// Grants admin access to an EXISTING Supabase Auth user.
// Create the user first in Supabase Dashboard → Authentication → Users → "Add user",
// then run:  npm run admin:promote -- someone@example.com
import pg from 'pg';

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes('@')) {
  console.error('Usage: npm run admin:promote -- email@example.com');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  const { rows } = await client.query('select id, email from auth.users where lower(email) = $1', [email]);
  if (!rows.length) {
    console.error(`No auth user found for ${email}. Create the user in Supabase Authentication first.`);
    process.exitCode = 1;
  } else {
    await client.query(
      `insert into public.profiles (id, email, role, is_active) values ($1, $2, 'admin', true)
       on conflict (id) do update set role = 'admin', is_active = true, email = excluded.email`,
      [rows[0].id, rows[0].email],
    );
    console.log(`✔ ${email} is now an active admin. Sign in at /admin/login`);
  }
} finally {
  await client.end();
}
