import 'server-only';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/data/cache';

/**
 * Expire cached public data after an admin change. `expire: 0` makes the next visitor
 * wait for fresh data instead of seeing the old version (read-your-own-writes).
 */
export function invalidatePublicData(...tags: (keyof typeof CACHE_TAGS)[]) {
  for (const tag of tags) revalidateTag(CACHE_TAGS[tag], { expire: 0 });
}
