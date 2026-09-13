// Seeds demo data into Supabase. Safe to re-run: demo catalog rows are upserted by slug,
// their colors/sizes/images/variants are rebuilt, demo inquiries/testimonials are replaced.
// Site settings are only inserted when missing (use --reset-settings to overwrite).
// Usage: npm run db:seed
import pg from 'pg';
import { CATEGORIES, COLLECTIONS, PRODUCTS, TESTIMONIALS, TONE_COLORS } from './seed-data.mjs';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set in .env.local');
  process.exit(1);
}
const resetSettings = process.argv.includes('--reset-settings');
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
const q = (text, params) => client.query(text, params);

try {
  await q('begin');

  // Categories -----------------------------------------------------------------
  const categoryIds = {};
  for (const [index, c] of CATEGORIES.entries()) {
    const { rows } = await q(
      `insert into public.categories (slug, name_en, name_id, description_en, description_id, image_url, is_active, sort_order)
       values ($1,$2,$3,$4,$5,$6,true,$7)
       on conflict (slug) do update set name_en=excluded.name_en, name_id=excluded.name_id,
         description_en=excluded.description_en, description_id=excluded.description_id,
         image_url=excluded.image_url, sort_order=excluded.sort_order
       returning id`,
      [c.slug, c.name_en, c.name_id, c.description_en, c.description_id, `/demo/site/category-${c.slug}.svg`, index],
    );
    categoryIds[c.slug] = rows[0].id;
  }

  // Collections ------------------------------------------------------------------
  const collectionIds = {};
  for (const [index, c] of COLLECTIONS.entries()) {
    const { rows } = await q(
      `insert into public.collections (slug, name_en, name_id, tagline_en, tagline_id, description_en, description_id, image_url, is_active, is_featured, sort_order)
       values ($1,$2,$3,$4,$5,$6,$7,$8,true,$9,$10)
       on conflict (slug) do update set name_en=excluded.name_en, name_id=excluded.name_id, tagline_en=excluded.tagline_en,
         tagline_id=excluded.tagline_id, description_en=excluded.description_en, description_id=excluded.description_id,
         image_url=excluded.image_url, is_featured=excluded.is_featured, sort_order=excluded.sort_order
       returning id`,
      [c.slug, c.name_en, c.name_id, c.tagline_en, c.tagline_id, c.description_en, c.description_id, `/demo/site/collection-${c.slug}.svg`, c.is_featured, index],
    );
    collectionIds[c.slug] = rows[0].id;
  }

  // Products -------------------------------------------------------------------------
  const productIds = {};
  for (const [index, p] of PRODUCTS.entries()) {
    const specs = [
      { label_en: 'Construction', label_id: 'Konstruksi', value_en: 'Hand-bound joints, no visible staples', value_id: 'Sambungan diikat tangan, tanpa staples terlihat' },
      { label_en: 'Assembly', label_id: 'Perakitan', value_en: 'Delivered fully assembled', value_id: 'Dikirim dalam kondisi terakit' },
      { label_en: 'Packing', label_id: 'Kemasan', value_en: 'Foam, plastic wrap and export carton', value_id: 'Foam, plastik, dan karton ekspor' },
    ];
    const { rows } = await q(
      `insert into public.products (
         slug, sku, name_en, name_id, short_description_en, short_description_id, description_en, description_id,
         category_id, collection_id, base_price_usd, price_display_type, materials, material_detail_en, material_detail_id,
         finishing_en, finishing_id, finishing_options, usage, width_cm, depth_cm, height_cm, seat_height_cm, weight_kg,
         specs, moq, lead_time_min_weeks, lead_time_max_weeks, availability, care_en, care_id, customization_en, customization_id,
         is_featured, is_new, is_best_seller, status, sort_order, seo_title_en, seo_title_id, meta_description_en, meta_description_id
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42)
       on conflict (slug) do update set
         sku=excluded.sku, name_en=excluded.name_en, name_id=excluded.name_id, short_description_en=excluded.short_description_en,
         short_description_id=excluded.short_description_id, description_en=excluded.description_en, description_id=excluded.description_id,
         category_id=excluded.category_id, collection_id=excluded.collection_id, base_price_usd=excluded.base_price_usd,
         price_display_type=excluded.price_display_type, materials=excluded.materials, material_detail_en=excluded.material_detail_en,
         material_detail_id=excluded.material_detail_id, finishing_en=excluded.finishing_en, finishing_id=excluded.finishing_id,
         finishing_options=excluded.finishing_options, usage=excluded.usage, width_cm=excluded.width_cm, depth_cm=excluded.depth_cm,
         height_cm=excluded.height_cm, seat_height_cm=excluded.seat_height_cm, weight_kg=excluded.weight_kg, specs=excluded.specs,
         moq=excluded.moq, lead_time_min_weeks=excluded.lead_time_min_weeks, lead_time_max_weeks=excluded.lead_time_max_weeks,
         availability=excluded.availability, care_en=excluded.care_en, care_id=excluded.care_id, customization_en=excluded.customization_en,
         customization_id=excluded.customization_id, is_featured=excluded.is_featured, is_new=excluded.is_new,
         is_best_seller=excluded.is_best_seller, status=excluded.status, sort_order=excluded.sort_order,
         seo_title_en=excluded.seo_title_en, seo_title_id=excluded.seo_title_id,
         meta_description_en=excluded.meta_description_en, meta_description_id=excluded.meta_description_id
       returning id`,
      [
        p.slug, p.sku, p.name_en, p.name_id, p.short_en, p.short_id, p.desc_en, p.desc_id,
        categoryIds[p.category], p.collection ? collectionIds[p.collection] : null, p.price, p.price_type, p.materials,
        p.material_en, p.material_id, p.finishing_en, p.finishing_id, JSON.stringify(p.finishing_options), p.usage,
        p.dims[0], p.dims[1], p.dims[2], p.seat, p.weight, JSON.stringify(specs), p.moq, p.lead[0], p.lead[1], p.availability,
        p.care_en ?? null, p.care_id ?? null, p.customization_en ?? null, p.customization_id ?? null,
        Boolean(p.flags.is_featured), Boolean(p.flags.is_new), Boolean(p.flags.is_best_seller), p.status ?? 'published', index,
        `${p.name_en} | Rattan Furniture from Indonesia`, `${p.name_id} | Furnitur Rotan Indonesia`, p.short_en, p.short_id,
      ],
    );
    const productId = rows[0].id;
    productIds[p.slug] = productId;

    // Rebuild children
    await q('delete from public.product_variants where product_id = $1', [productId]);
    await q('delete from public.product_images where product_id = $1', [productId]);
    await q('delete from public.product_colors where product_id = $1', [productId]);
    await q('delete from public.product_sizes where product_id = $1', [productId]);

    const colorIds = {};
    for (const [i, tone] of p.tones.entries()) {
      const c = TONE_COLORS[tone];
      const { rows: cr } = await q(
        `insert into public.product_colors (product_id, name_en, name_id, hex, family, sort_order) values ($1,$2,$3,$4,$5,$6) returning id`,
        [productId, c.name_en, c.name_id, c.hex, c.family, i],
      );
      colorIds[tone] = cr[0].id;
    }

    const sizeIds = {};
    for (const [i, s] of p.sizes.entries()) {
      const { rows: sr } = await q(
        `insert into public.product_sizes (product_id, label_en, label_id, width_cm, depth_cm, height_cm, sort_order) values ($1,$2,$3,$4,$5,$6,$7) returning id`,
        [productId, s.label_en, s.label_id, s.dims[0], s.dims[1], s.dims[2], i],
      );
      sizeIds[s.label_en] = { id: sr[0].id, adj: s.adj };
    }

    const altViews = [
      ['front view on a studio backdrop', 'tampak depan dengan latar studio'],
      ['styled in a warm interior', 'ditata di interior yang hangat'],
      ['close-up of the hand-woven texture', 'detail tekstur anyaman tangan'],
    ];
    for (let i = 0; i < 3; i += 1) {
      await q(
        `insert into public.product_images (product_id, url, alt_en, alt_id, width, height, is_primary, sort_order) values ($1,$2,$3,$4,800,1000,$5,$6)`,
        [productId, `/demo/products/${p.slug}-${i + 1}.svg`, `${p.name_en} — ${altViews[i][0]}`, `${p.name_id} — ${altViews[i][1]}`, i === 0, i],
      );
    }
    for (const [i, tone] of p.tones.slice(1).entries()) {
      await q(
        `insert into public.product_images (product_id, color_id, url, alt_en, alt_id, width, height, is_primary, sort_order) values ($1,$2,$3,$4,$5,800,1000,false,$6)`,
        [productId, colorIds[tone], `/demo/products/${p.slug}-${tone}.svg`, `${p.name_en} in ${TONE_COLORS[tone].name_en}`, `${p.name_id} warna ${TONE_COLORS[tone].name_id}`, 10 + i],
      );
    }

    // Variants: one per color × size when the product has sizes (with price adjustments),
    // plus explicit unavailable combinations.
    const skuSuffix = (tone) => tone.slice(0, 3).toUpperCase();
    if (p.sizes.length) {
      for (const tone of p.tones) {
        for (const [si, s] of p.sizes.entries()) {
          const unavailable = p.unavailable.some(([ut, us]) => ut === tone && us === s.label_en);
          await q(
            `insert into public.product_variants (product_id, color_id, size_id, sku, price_adjustment_usd, availability, sort_order)
             values ($1,$2,$3,$4,$5,$6,$7)`,
            [productId, colorIds[tone], sizeIds[s.label_en].id, `${p.sku}-${skuSuffix(tone)}-${si + 1}`, s.adj, unavailable ? 'unavailable' : 'available', si],
          );
        }
      }
    } else if (p.tones.length > 1) {
      for (const [i, tone] of p.tones.entries()) {
        await q(
          `insert into public.product_variants (product_id, color_id, sku, price_adjustment_usd, availability, sort_order) values ($1,$2,$3,0,'available',$4)`,
          [productId, colorIds[tone], `${p.sku}-${skuSuffix(tone)}`, i],
        );
      }
    }
  }

  // Testimonials (demo) ------------------------------------------------------------------
  await q('delete from public.testimonials where is_demo');
  for (const [i, t] of TESTIMONIALS.entries()) {
    await q(
      `insert into public.testimonials (author_name, author_role_en, author_role_id, company_name, country, quote_en, quote_id, rating, is_demo, is_published, sort_order)
       values ($1,$2,$3,$4,$5,$6,$7,$8,true,true,$9)`,
      [t.author_name, t.author_role_en, t.author_role_id, t.company_name, t.country, t.quote_en, t.quote_id, t.rating, i],
    );
  }

  // Site settings ---------------------------------------------------------------------------
  const settings = {
    business: {
      name: 'Global Rotan',
      tagline_en: 'Indonesian rattan furniture for homes, hospitality and projects worldwide.',
      tagline_id: 'Furnitur rotan Indonesia untuk hunian, hospitality, dan proyek di seluruh dunia.',
      email: 'hello@globalrotan.example',
      whatsapp: '6281200000000',
      phone_display: '+62 812-0000-0000 (demo)',
      address_en: 'Workshop address — update in Admin › Settings (demo)',
      address_id: 'Alamat workshop — ubah di Admin › Pengaturan (demo)',
      hours_en: 'Mon–Sat, 08:00–17:00 (GMT+7)',
      hours_id: 'Senin–Sabtu, 08.00–17.00 WIB',
      socials: {},
      is_demo: true,
    },
    localization: { default_language: 'en', default_currency: 'USD', usd_to_idr: 16250 },
    announcement: {
      enabled: true,
      text_en: 'Worldwide Shipping and Custom Furniture Available.',
      text_id: 'Melayani Pengiriman Internasional dan Furnitur Custom.',
      link: '/custom-furniture',
    },
    commerce: {
      moq_note_en: 'Minimum order quantities are shown per product and can be combined for container orders.',
      moq_note_id: 'Minimum order tercantum di setiap produk dan dapat digabungkan untuk pesanan kontainer.',
      production_info_en: 'Typical production time is 3–10 weeks depending on design and quantity.',
      production_info_id: 'Waktu produksi umumnya 3–10 minggu tergantung desain dan jumlah.',
      shipping_info_en: 'Export packing included in quotations. Freight, duties and taxes are quoted separately.',
      shipping_info_id: 'Kemasan ekspor termasuk dalam penawaran. Ongkos kirim, bea, dan pajak dihitung terpisah.',
    },
    seo: {},
    whatsapp: {},
    content: {
      home: {},
      about: {},
      about_facts: [],
      clients: [
        { name: 'Client logo (demo)', is_demo: true },
        { name: 'Client logo (demo)', is_demo: true },
        { name: 'Client logo (demo)', is_demo: true },
        { name: 'Client logo (demo)', is_demo: true },
        { name: 'Client logo (demo)', is_demo: true },
        { name: 'Client logo (demo)', is_demo: true },
      ],
    },
  };
  for (const [key, value] of Object.entries(settings)) {
    await q(
      resetSettings
        ? `insert into public.site_settings (key, value) values ($1, $2) on conflict (key) do update set value = excluded.value`
        : `insert into public.site_settings (key, value) values ($1, $2) on conflict (key) do nothing`,
      [key, JSON.stringify(value)],
    );
  }

  // Demo inquiries ---------------------------------------------------------------------------
  await q('delete from public.inquiries where is_demo');
  const demoInquiries = [
    {
      name: 'Demo Buyer — Retail', company: 'Demo Home Store Pty Ltd', email: 'buyer.demo@example.com', code: '+61', phone: '400000001',
      country: 'Australia', type: 'retailer', dest: 'Sydney, Australia', lang: 'en', cur: 'USD', status: 'new', budget: 'USD 10,000–15,000',
      items: [['kawi-lounge-chair', 'honey', 'Standard', 12], ['kawi-side-table', 'honey', null, 12]], daysAgo: 1,
      customization: 'Seat cushion in oatmeal linen. Retail packaging with our label.',
    },
    {
      name: 'Demo Designer — Hospitality', company: 'Demo Studio Interiors', email: 'studio.demo@example.com', code: '+31', phone: '600000002',
      country: 'Netherlands', type: 'interior_designer', dest: 'Rotterdam port, Netherlands', lang: 'en', cur: 'USD', status: 'quotation_sent', budget: '',
      items: [['senja-cane-dining-chair', 'black', 'With Armrest', 40], ['anyam-pendant-lamp', 'natural', 'Large Ø 55', 12]], daysAgo: 6,
      customization: 'Chairs for a restaurant project, seat height 46 cm.',
    },
    {
      name: 'Demo Pelanggan — Vila', company: '', email: 'vila.demo@example.com', code: '+62', phone: '81200000003',
      country: 'Indonesia', type: 'project_owner', dest: 'Canggu, Bali', lang: 'id', cur: 'IDR', status: 'contacted', budget: 'Rp150.000.000',
      items: [['nusa-sun-lounger', 'sand', null, 8], ['segara-canopy-daybed', 'sand', null, 2]], daysAgo: 12,
      customization: 'Kasur warna krem, perlu dikirim sebelum akhir bulan.',
    },
  ];
  const { rows: rateRows } = await q(`select (value->>'usd_to_idr')::numeric as rate from public.site_settings where key = 'localization'`);
  const year = new Date().getFullYear();
  for (const [i, d] of demoInquiries.entries()) {
    const number = `GR-DEMO-${year}-${String(i + 1).padStart(3, '0')}`;
    const { rows } = await q(
      `insert into public.inquiries (inquiry_number, status, full_name, company_name, email, phone_country_code, phone_number, country, customer_type,
         shipping_destination, preferred_language, preferred_currency, estimated_budget, customization_request, message, privacy_accepted_at, locale,
         exchange_rate_used, is_demo, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, now(), $11, $16, true, now() - ($17 || ' days')::interval)
       returning id`,
      [number, d.status, d.name, d.company || null, d.email, d.code, d.phone, d.country, d.type, d.dest, d.lang, d.cur, d.budget || null, d.customization,
        'Demo inquiry created by the seed script.', rateRows[0]?.rate ?? 16250, String(d.daysAgo)],
    );
    let total = 0;
    for (const [slug, tone, sizeLabel, qty] of d.items) {
      const p = PRODUCTS.find((x) => x.slug === slug);
      const size = p.sizes.find((s) => s.label_en === sizeLabel);
      const unit = p.price == null ? null : p.price + (size?.adj ?? 0);
      if (unit != null) total += unit * qty;
      await q(
        `insert into public.inquiry_items (inquiry_id, product_id, product_name_en, product_name_id, sku, color_name, size_label, quantity, unit_price_usd, price_display_type, image_url, product_url)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [rows[0].id, productIds[slug], p.name_en, p.name_id, p.sku, TONE_COLORS[tone].name_en, size?.label_en ?? null, qty, unit, p.price_type,
          `/demo/products/${slug}-1.svg`, `/products/${slug}`],
      );
    }
    await q('update public.inquiries set estimated_total_usd = $1 where id = $2', [total || null, rows[0].id]);
  }

  // Demo contact messages ------------------------------------------------------------------------
  await q('delete from public.contact_messages where is_demo');
  await q(
    `insert into public.contact_messages (topic, full_name, email, phone, country, subject, message, status, is_demo, created_at) values
     ('export', 'Demo Importer', 'import.demo@example.com', '+1 555 0100', 'United States', 'Container loading', 'Demo message: how many Kawi lounge chairs fit in a 40ft HQ container?', 'new', true, now() - interval '2 hours'),
     ('project', 'Demo Hotel Group', 'hotel.demo@example.com', null, 'Singapore', 'Lobby furniture', 'Demo message: we are furnishing a 120-room hotel and would like custom wing chairs.', 'read', true, now() - interval '3 days')`,
  );

  await q('commit');
  console.log(`Seeded ${CATEGORIES.length} categories, ${COLLECTIONS.length} collections, ${PRODUCTS.length} products, ${TESTIMONIALS.length} testimonials, ${demoInquiries.length} inquiries.`);
} catch (error) {
  await q('rollback');
  console.error('Seed failed:', error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
