import 'server-only';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';

export async function getClientIpHash() {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
  const salt = process.env.RATE_LIMIT_SALT || 'global-rotan';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 40);
}

/**
 * Fixed-window rate limit stored in Postgres so it works across serverless instances.
 * Fails open (allows) if the limiter itself is unavailable, but logs the error.
 */
export async function checkRateLimit(scope: string, limit: number, windowSeconds: number) {
  const ipHash = await getClientIpHash();
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('hit_rate_limit', {
      p_key: `${scope}:${ipHash}`,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    return { allowed: data === true, ipHash };
  } catch (error) {
    console.error('[rate-limit]', error instanceof Error ? error.message : error);
    return { allowed: true, ipHash };
  }
}
