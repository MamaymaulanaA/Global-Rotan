import 'server-only';
import type { ZodError } from 'zod';
import { AdminAuthError, requireAdmin, type AdminContext } from './auth';

export type AdminResult<T = null> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function zodFieldErrors(error: ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.');
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export function dbErrorMessage(error: { code?: string; message: string; details?: string | null }) {
  if (error.code === '23505') {
    if (/slug/.test(error.message + (error.details ?? ''))) return { error: 'This slug is already used.', field: 'slug' };
    if (/sku/.test(error.message + (error.details ?? ''))) return { error: 'This SKU is already used.', field: 'sku' };
    return { error: 'A record with the same unique value already exists.' };
  }
  if (error.code === '23503') return { error: 'This record is referenced by other data and cannot be removed.' };
  if (error.code === '42501') return { error: 'You do not have permission to perform this action.' };
  return { error: error.message };
}

/** Runs an admin-only server action with consistent auth + error handling. */
export async function withAdmin<T>(fn: (admin: AdminContext) => Promise<AdminResult<T>>): Promise<AdminResult<T>> {
  try {
    const admin = await requireAdmin();
    return await fn(admin);
  } catch (error) {
    if (error instanceof AdminAuthError) return { ok: false, error: 'Your session has expired or you are not an admin. Please sign in again.' };
    console.error('[admin action]', error);
    return { ok: false, error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}
