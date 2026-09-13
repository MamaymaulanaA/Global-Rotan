// Replaces the demo catalog with the IndoRotan catalogue (products, photos, categories,
// collections) and fills the About page / home imagery. Brand and contact settings stay as they are.
//
// Usage: npm run import:indorotan -- [--images <folder with pre-downloaded photos>] [--dry-run]
// Needs DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
// Data: scripts/data/indorotan-catalog.json (bilingual product data prepared from https://indorotan.id).
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const { DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL: supabaseUrl, SUPABASE_SERVICE_ROLE_KEY: serviceKey } = process.env;
if (!DATABASE_URL || !supabaseUrl || !serviceKey) {
  console.error('DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const dryRun = flag('--dry-run');
const imageDir = option('--images');
const catalog = JSON.parse(fs.readFileSync(new URL('./data/indorotan-catalog.json', import.meta.url), 'utf8'));
const BUCKET = 'media';
const MIME = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };

const publicUrl = (storagePath) => `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${storagePath}`;

async function readImage(image) {
  const local = imageDir ? path.join(imageDir, path.basename(image.file)) : null;
  if (local && fs.existsSync(local)) return fs.readFileSync(local);
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(image.src, { headers: { 'User-Agent': 'Mozilla/5.0 (Global Rotan import)' } });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if (attempt === 3) throw new Error(`Download failed (${res.status}) ${image.src}`);
    await new Promise((r) => setTimeout(r, 1500 * attempt));
  }
}

async function upload(storagePath, body, ext) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}/${storagePath}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        'Content-Type': MIME[ext] ?? 'application/octet-stream',
        'Cache-Control': 'max-age=31536000',
        'x-upsert': 'true',
      },
      body,
    });
    if (res.ok) return;
    if (attempt === 3) throw new Error(`Upload failed (${res.status}) ${storagePath}: ${await res.text()}`);
    await new Promise((r) => setTimeout(r, 1500 * attempt));
  }
}

// 1. Upload photos ------------------------------------------------------------------
const jobs = catalog.products.flatMap((p) =>
  p.images.map((image, index) => {
    const ext = path.extname(image.file).slice(1).toLowerCase();
    const base = decodeURIComponent(image.src.split('/').pop()).replace(/\.[a-z]+$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
    return { product: p, image, ext, storagePath: `products/${p.slug}/${String(index + 1).padStart(2, '0')}-${base}.${ext}` };
  }),
);
console.log(`${catalog.products.length} products, ${jobs.length} photos${dryRun ? ' (dry run)' : ''}`);

if (!dryRun) {
  let done = 0;
  const queue = [...jobs];
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      while (queue.length) {
        const job = queue.shift();
        await upload(job.storagePath, await readImage(job.image), job.ext);
        done++;
        if (done % 25 === 0 || done === jobs.length) console.log(`  uploaded ${done}/${jobs.length}`);
      }
    }),
  );
}
const urlBySrc = new Map(jobs.map((j) => [j.image.src, publicUrl(j.storagePath)]));

// 2. Replace database content ------------------------------------------------------
const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
const q = (text, params) => client.query(text, params);

try {
  await q('begin');

  const { rows: rateRows } = await q(`select (value->>'usd_to_idr')::numeric as rate from public.site_settings where key = 'localization'`);
  const rate = Number(rateRows[0]?.rate) > 0 ? Number(rateRows[0].rate) : 16250;

  // Demo data only: demo inquiries/messages and the whole sample catalog.
  const removed = {
    inquiries: (await q('delete from public.inquiries where is_demo')).rowCount,
    messages: (await q('delete from public.contact_messages where is_demo')).rowCount,
    testimonials: (await q('delete from public.testimonials')).rowCount,
    products: (await q('delete from public.products')).rowCount,
    categories: (await q('delete from public.categories')).rowCount,
    collections: (await q('delete from public.collections')).rowCount,
  };
  console.log('removed', removed);

  const categoryIds = {};
  for (const [index, c] of catalog.categories.entries()) {
    const { rows } = await q(
      `insert into public.categories (slug, name_en, name_id, description_en, description_id, image_url, is_active, sort_order)
       values ($1,$2,$3,$4,$5,$6,true,$7) returning id`,
      [c.slug, c.name_en, c.name_id, c.description_en, c.description_id, urlBySrc.get(c.image_src) ?? null, index],
    );
    categoryIds[c.slug] = rows[0].id;
  }

  const collectionIds = {};
  for (const [index, c] of catalog.collections.entries()) {
    const { rows } = await q(
      `insert into public.collections (slug, name_en, name_id, tagline_en, tagline_id, description_en, description_id, image_url, is_active, is_featured, sort_order)
       values ($1,$2,$3,$4,$5,$6,$7,$8,true,true,$9) returning id`,
      [c.slug, c.name_en, c.name_id, c.tagline_en, c.tagline_id, c.description_en, c.description_id, urlBySrc.get(c.image_src) ?? null, index],
    );
    collectionIds[c.slug] = rows[0].id;
  }

  // Featured: the first product of each category (catalogue order is newest first).
  const featured = new Set(catalog.categories.map((c) => catalog.products.find((p) => p.category === c.slug)?.sku).filter(Boolean).slice(0, 8));

  for (const p of catalog.products) {
    const { rows } = await q(
      `insert into public.products (
         slug, sku, name_en, name_id, short_description_en, short_description_id, description_en, description_id,
         category_id, collection_id, base_price_usd, price_idr, price_display_type,
         materials, material_detail_en, material_detail_id, finishing_en, finishing_id, usage,
         width_cm, depth_cm, height_cm, specs, moq, lead_time_min_weeks, lead_time_max_weeks, availability,
         care_en, care_id, is_featured, is_new, is_best_seller, status, sort_order, color_families)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'fixed',$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,1,$23,$24,'made_to_order',$25,$26,$27,$28,false,'published',$29,$30)
       returning id`,
      [
        p.slug, p.sku, p.name_en, p.name_id, p.short_description_en, p.short_description_id, p.description_en, p.description_id,
        categoryIds[p.category], collectionIds[p.collection], Math.round(p.price_idr / rate), p.price_idr,
        p.materials, p.material_detail_en, p.material_detail_id, p.finishing_en, p.finishing_id, p.usage,
        p.width_cm, p.depth_cm, p.height_cm, JSON.stringify(p.specs), p.lead_time_min_weeks, p.lead_time_max_weeks,
        p.care_en, p.care_id, featured.has(p.sku), p.source_order < 12, p.source_order, p.color_families,
      ],
    );
    for (const image of p.images) {
      const job = jobs.find((j) => j.image === image);
      await q(
        `insert into public.product_images (product_id, storage_path, url, alt_en, alt_id, width, height, is_primary, sort_order)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [rows[0].id, job.storagePath, urlBySrc.get(image.src), p.name_en, p.name_id, image.width, image.height, image.sort_order === 0, image.sort_order],
      );
    }
  }

  // Page imagery and About content (merged into the existing "content" settings).
  const photo = (sku, index = 0) => urlBySrc.get(catalog.products.find((p) => p.sku === sku)?.images[index]?.src) ?? '';
  const { rows: contentRows } = await q(`select value from public.site_settings where key = 'content'`);
  const content = contentRows[0]?.value ?? {};
  const aboutContent = JSON.parse(fs.readFileSync(new URL('./data/about-content.json', import.meta.url), 'utf8'));
  content.home = { ...(content.home ?? {}), hero_image: photo('INDODR-98'), intro_image: photo('INDOAR-94'), project_image: photo('INDOSR-39') };
  content.about = { ...(content.about ?? {}), ...aboutContent.about, image: photo('INDOKT-08') };
  content.about_facts = aboutContent.about_facts;
  content.custom = { ...(content.custom ?? {}), image: photo('INDODR-100') };
  content.export = { ...(content.export ?? {}), image: photo('INDOSR-74') };
  content.clients = (content.clients ?? []).filter((c) => !c.is_demo);
  await q(
    `insert into public.site_settings (key, value, is_public) values ('content', $1, true)
     on conflict (key) do update set value = excluded.value`,
    [JSON.stringify(content)],
  );

  if (dryRun) {
    await q('rollback');
    console.log('Dry run: rolled back.');
  } else {
    await q('commit');
    console.log(`Imported ${catalog.products.length} products into ${catalog.categories.length} categories and ${catalog.collections.length} collections (1 USD = Rp${rate}).`);
  }
} catch (error) {
  await q('rollback');
  console.error('Import failed, database unchanged:', error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
