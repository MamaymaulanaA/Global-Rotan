// Creates a confirmed Supabase Auth user and grants admin access.
// Run it yourself so the password never leaves your machine:
//   npm run admin:create -- you@example.com
// You will be prompted for the password (input is hidden).
import { createClient } from '@supabase/supabase-js';
import readline from 'node:readline';

const email = process.argv[2]?.trim().toLowerCase();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !email.includes('@')) {
  console.error('Usage: npm run admin:create -- email@example.com');
  process.exit(1);
}
if (!url || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (text) => {
      if (text.includes(question)) rl.output.write(text);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

const password = await askHidden('Password (min 10 characters): ');
if (password.length < 10) {
  console.error('Password must be at least 10 characters.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
if (error) {
  console.error('Could not create user:', error.message);
  process.exit(1);
}
const { error: profileError } = await supabase
  .from('profiles')
  .upsert({ id: data.user.id, email, role: 'admin', is_active: true }, { onConflict: 'id' });
if (profileError) {
  console.error('User created but role update failed:', profileError.message);
  process.exit(1);
}
console.log(`✔ Admin ${email} created. Sign in at /admin/login`);
