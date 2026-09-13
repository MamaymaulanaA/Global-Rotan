import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicEnv } from './env';

/**
 * Service-role client. SERVER ONLY — bypasses RLS.
 * Used exclusively for validated public submissions (inquiries, messages),
 * rate limiting and admin user management.
 */
export function createServiceClient() {
  const { url } = getSupabasePublicEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set on the server.');
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
