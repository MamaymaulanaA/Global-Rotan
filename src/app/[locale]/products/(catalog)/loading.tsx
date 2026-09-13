import { ProductCardSkeleton } from '@/components/product/product-card';

export default function ProductsLoading() {
  return (
    <div role="status" aria-label="Loading products">
      <section className="border-b border-line">
        <div className="container-page pb-10 pt-6 lg:pb-14 lg:pt-8">
          <div className="skeleton h-4 w-40" />
          <div className="mt-10 max-w-3xl space-y-4">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-10 w-2/3" />
            <div className="skeleton h-5 w-full" />
          </div>
        </div>
      </section>
      <div className="container-page py-8 lg:grid lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-10 lg:py-12 xl:grid-cols-[270px_minmax(0,1fr)] xl:gap-12">
        <div className="hidden space-y-4 lg:block">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton h-10 w-full" />
          ))}
        </div>
        <div>
          <div className="skeleton h-12 w-full" />
          <div className="skeleton mt-5 h-5 w-40" />
          <ul className="mt-8 grid grid-cols-1 gap-x-3 gap-y-10 min-[420px]:grid-cols-2 sm:gap-x-5 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i}>
                <ProductCardSkeleton />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
