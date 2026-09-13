import 'server-only';
import type { AdminContext } from './auth';
import { INQUIRY_STATUSES } from '@/types/domain';

export interface InquiryFilters {
  q?: string;
  status?: string;
  from?: string;
  to?: string;
  archived?: string;
  page?: string;
}

/** Shared filter logic for the inquiry list and CSV export. */
export function buildInquiryQuery(admin: AdminContext, filters: InquiryFilters, select: string, options?: { count?: 'exact' }) {
  let query = admin.supabase.from('inquiries').select(select, options).order('created_at', { ascending: false });
  if (filters.q) {
    const term = filters.q.replace(/[%_*\\(),."']/g, ' ').trim().slice(0, 60);
    if (term) {
      const like = `%${term}%`;
      query = query.or(
        ['inquiry_number', 'full_name', 'email', 'company_name', 'phone_number', 'country'].map((col) => `${col}.ilike.${like}`).join(','),
      );
    }
  }
  if (filters.status && (INQUIRY_STATUSES as readonly string[]).includes(filters.status)) query = query.eq('status', filters.status);
  if (filters.from && /^\d{4}-\d{2}-\d{2}$/.test(filters.from)) query = query.gte('created_at', `${filters.from}T00:00:00+07:00`);
  if (filters.to && /^\d{4}-\d{2}-\d{2}$/.test(filters.to)) query = query.lte('created_at', `${filters.to}T23:59:59+07:00`);
  query = query.eq('is_archived', filters.archived === '1');
  return query;
}
