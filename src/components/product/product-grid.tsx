import { cn } from '@/lib/utils';
import type { ProductCardData } from '@/types/domain';
import { ProductCard, ProductCardSkeleton } from './product-card';

export function ProductGrid({
  products,
  columns = 4,
  priorityCount = 0,
  className,
}: {
  products: ProductCardData[];
  columns?: 3 | 4;
  priorityCount?: number;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        'grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:gap-x-6 lg:gap-y-14',
        columns === 4 && 'xl:grid-cols-4',
        className,
      )}
    >
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard
            product={product}
            index={index}
            priority={index < priorityCount}
            sizes={columns === 4 ? '(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 48vw' : '(min-width: 1024px) 24vw, (min-width: 768px) 30vw, 48vw'}
          />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 8, columns = 4 }: { count?: number; columns?: 3 | 4 }) {
  return (
    <ul className={cn('grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:gap-x-6', columns === 4 && 'xl:grid-cols-4')}>
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <ProductCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
