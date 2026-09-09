import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { ProductDTO } from '@kob/shared-types';
import { formatMoney } from '@kob/shared-types';
import { AddToCartButton } from '@/components/store/AddToCartButton';
import { MarketingShell } from '@/components/store/MarketingShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { serverApiFetch } from '@/lib/api';

async function getProduct(slug: string) {
  try {
    const data = await serverApiFetch<{ product: ProductDTO }>(`/products/${slug}`, { next: { revalidate: 30 } });
    return data.product;
  } catch {
    return null;
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  return (
    <MarketingShell>
      <main className="container-padded py-10">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/menu"><ArrowLeft className="h-4 w-4" /> Back to menu</Link>
        </Button>
        {!product ? (
          <Card className="glass-card p-8">Product could not be loaded. Please check the API connection.</Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="relative min-h-[420px] overflow-hidden rounded-[2.5rem] bg-secondary">
              {product.imageUrl ? (
                <Image src={product.imageUrl} alt={product.name} fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
              ) : null}
            </Card>
            <div className="space-y-6 self-center">
              <Badge variant={product.isAvailable ? 'success' : 'danger'}>{product.isAvailable ? 'Available now' : 'Temporarily sold out'}</Badge>
              <div className="space-y-4">
                <p className="text-sm font-black uppercase tracking-[0.3em] text-primary">{product.categoryName}</p>
                <h1 className="font-[var(--font-display)] text-5xl font-black text-charcoal">{product.name}</h1>
                <p className="text-lg leading-8 text-muted-foreground">{product.description}</p>
              </div>
              <p className="text-3xl font-black text-charcoal">{formatMoney(product.priceCents, product.currency)}</p>
              <Card className="glass-card p-5">
                <h2 className="mb-3 font-bold">Customize this item</h2>
                <p className="mb-4 text-sm text-muted-foreground">Variants and add-ons are designed for a future migration. For now, add quantity and special preparation notes.</p>
                <AddToCartButton productId={product.id} disabled={!product.isAvailable} withInstructions />
              </Card>
            </div>
          </div>
        )}
      </main>
    </MarketingShell>
  );
}
