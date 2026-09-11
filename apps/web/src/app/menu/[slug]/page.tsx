import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { ProductDTO } from '@kob/shared-types';
import { formatMoney } from '@kob/shared-types';
import { AddToCartButton } from '@/components/store/AddToCartButton';
import { MarketingShell } from '@/components/store/MarketingShell';
import { Card } from '@/components/ui/card';
import { serverApiFetch } from '@/lib/api';

async function getProduct(slug: string) {
  try {
    const data = await serverApiFetch<{ product: ProductDTO }>(`/products/${slug}`, {
      next: { revalidate: 30 }
    });
    return data.product;
  } catch {
    return null;
  }
}

// Static mock sizes matching the Figma UI spec
const plateSizes = [
  { id: 'small', label: 'Small', price: '₦4,500' },
  { id: 'medium', label: 'Medium', price: '₦8,500', selected: true },
  { id: 'large', label: 'Large', price: '₦9,500' }
];

export default async function ProductDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  return (
    <MarketingShell>
      <main className="bg-white min-h-screen pb-12">
        {!product ? (
          <div className="container-padded py-10">
            <Card className="border border-gray-100 p-8 text-center font-body text-sm font-medium text-gray-500">
              Product could not be loaded. Please check the API connection.
            </Card>
          </div>
        ) : (
          <div className="mx-auto max-w-xl sm:py-8 sm:px-4">
            <div className="overflow-hidden bg-white sm:rounded-3xl sm:border sm:border-gray-100 sm:shadow-lg">
              
              {/* Image Header with Floating Back Button */}
              <div className="relative aspect-[4/3] w-full bg-gray-100">
                {product.imageUrl && (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    priority
                    sizes="(min-width: 640px) 600px, 100vw"
                    className="object-cover"
                  />
                )}
                <Link
                  href="/menu"
                  aria-label="Back to menu"
                  className="absolute top-4 left-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#151515] shadow-md transition hover:bg-gray-50 active:scale-95"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </div>

              {/* Product Details Section */}
              <div className="p-5 space-y-5">
                {/* Title & Main Price */}
                <div>
                  <h1 className="text-2xl font-semibold text-[#151515] sm:text-3xl">{product.name}</h1>
                  <p className="mt-1 font-body text-xl font-medium text-primary">
                    {formatMoney(product.priceCents, product.currency)}
                  </p>
                  {product.description && (
                    <p className="mt-2 font-body text-sm leading-6 text-gray-500">
                      {product.description}
                    </p>
                  )}
                </div>

                {/* Plate Size Selector Box */}
                <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-3">
                  <h2 className="text-sm font-semibold text-[#151515]">Plate size</h2>
                  <div className="space-y-2.5">
                    {plateSizes.map((size) => (
                      <label
                        key={size.id}
                        className="flex cursor-pointer select-none items-center justify-between font-body text-sm font-medium"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="plate-size"
                            defaultChecked={size.selected}
                            className="h-4 w-4 accent-primary text-primary border-gray-300 focus:ring-primary"
                          />
                          <span
                            className={`${
                              size.selected ? 'text-[#151515]' : 'text-gray-500'
                            }`}
                          >
                            {size.label}
                          </span>
                        </div>
                        <span className="font-bold text-[#151515]">{size.price}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Preparation Note */}
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-[#151515]">Note:</h3>
                  <p className="font-body text-xs leading-5 text-gray-500">
                    Please remember to pick a size and note that the large size contains extra meat
                  </p>
                </div>

                {/* Add to Cart Actions (Stepper + CTA Button) */}
                <div className="pt-2">
                  <AddToCartButton
                    productId={product.id}
                    disabled={!product.isAvailable}
                  />
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </MarketingShell>
  );
}