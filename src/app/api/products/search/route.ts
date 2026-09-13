import { NextResponse, type NextRequest } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') ?? '').toLowerCase().replace(/[%_*\\(),."']/g, ' ').trim().slice(0, 60);
  if (q.length < 2) return NextResponse.json({ items: [] });
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('products')
      .select('id, slug, sku, name_en, name_id, images:product_images(url, is_primary, sort_order, color_id)')
      .eq('status', 'published')
      .ilike('search_text', `%${q.replace(/\s+/g, '%')}%`)
      .order('is_featured', { ascending: false })
      .limit(6);
    if (error) throw error;
    const rows = (data ?? []) as unknown as { id: string; slug: string; sku: string; name_en: string; name_id: string; images: { url: string; is_primary: boolean; sort_order: number; color_id: string | null }[] }[];
    const items = rows.map((p) => {
      const images = [...((p.images as { url: string; is_primary: boolean; sort_order: number; color_id: string | null }[]) ?? [])]
        .filter((i) => !i.color_id)
        .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
      return { id: p.id, slug: p.slug, sku: p.sku, name_en: p.name_en, name_id: p.name_id, image: images[0]?.url ?? null };
    });
    return NextResponse.json({ items }, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } });
  } catch (error) {
    console.error('[api/products/search]', error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
