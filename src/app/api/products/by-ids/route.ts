import { NextResponse, type NextRequest } from 'next/server';
import { getProductsByIds } from '@/lib/data/catalog';

export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get('ids') ?? '').split(',').filter(Boolean);
  try {
    const items = await getProductsByIds(ids);
    return NextResponse.json({ items }, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } });
  } catch (error) {
    console.error('[api/products/by-ids]', error);
    return NextResponse.json({ items: [], error: 'server_error' }, { status: 500 });
  }
}
