import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicEnv } from './env';

let client: ReturnType<typeof createClient> | null = null;

/** Anonymous, cookie-less client for public catalog reads (RLS: published data only). */
export function createPublicClient() {
  if (client) return client;
  const { url, anonKey } = getSupabasePublicEnv();
  client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
