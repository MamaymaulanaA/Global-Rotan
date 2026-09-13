// Applies SQL files from supabase/migrations in order and records them.
// Usage: npm run db:migrate   (requires DATABASE_URL in .env.local)
import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import pg from 'pg';

const dir = path.resolve('supabase/migrations');
const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Add it to .env.local (Supabase > Connect > Session pooler).');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

await client.query(`
  create schema if not exists private;
  revoke all on schema private from public, anon, authenticated;
  create table if not exists private.schema_migrations (
    name text primary key,
    checksum text not null,
    applied_at timestamptz not null default now()
  );
`);

const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
const applied = new Map(
  (await client.query('select name, checksum from private.schema_migrations')).rows.map((r) => [r.name, r.checksum]),
);
const force = process.argv.includes('--reapply');

for (const file of files) {
  const sql = await readFile(path.join(dir, file), 'utf8');
  const checksum = createHash('sha256').update(sql).digest('hex');
  if (applied.get(file) === checksum && !force) {
    console.log(`= ${file} (already applied)`);
    continue;
  }
  process.stdout.write(`> ${file} ... `);
  try {
    await client.query('begin');
    await client.query(sql);
    await client.query(
      `insert into private.schema_migrations (name, checksum) values ($1, $2)
       on conflict (name) do update set checksum = excluded.checksum, applied_at = now()`,
      [file, checksum],
    );
    await client.query('commit');
    console.log('ok');
  } catch (error) {
    await client.query('rollback');
    console.log('FAILED');
    console.error(error.message);
    if (error.position) {
      const pos = Number(error.position);
      console.error('Near:', sql.slice(Math.max(0, pos - 160), pos + 80));
    }
    await client.end();
    process.exit(1);
  }
}

// Ask PostgREST to reload its schema cache
await client.query(`notify pgrst, 'reload schema'`);
await client.end();
console.log('Migrations complete.');
