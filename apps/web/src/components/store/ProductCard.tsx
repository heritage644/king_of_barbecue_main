import Image from 'next/image';
import Link from 'next/link';
import type { ProductDTO } from '@kob/shared-types';
import { formatMoney } from '@kob/shared-types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AddToCartButton } from './AddToCartButton';

export function ProductCard({ product }: { product: ProductDTO }) {
  return (
    <Card className="group overflow-hidden bg-white/80 transition hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/menu/${product.slug}`} className="block" aria-label={`View ${product.name}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : null}
          <div className="absolute left-4 top-4">
            <Badge variant={product.isAvailable ? 'success' : 'danger'}>{product.isAvailable ? 'Available' : 'Sold out'}</Badge>
          </div>
        </div>
      </Link>
      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{product.categoryName}</p>
          <Link href={`/menu/${product.slug}`} className="block text-xl font-black text-charcoal hover:text-primary">
            {product.name}
          </Link>
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{product.description}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg font-black text-charcoal">{formatMoney(product.priceCents, product.currency)}</p>
          <AddToCartButton productId={product.id} disabled={!product.isAvailable} />
        </div>
      </div>
    </Card>
  );
}
