import { NextResponse } from 'next/server';
import { getProductBySlug } from '@/lib/data/catalog';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const product = await getProductBySlug(slug);
    if (!product) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json({ product }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
  } catch (error) {
    console.error('[api/products/slug]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
