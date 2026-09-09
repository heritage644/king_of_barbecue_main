import type { ProductCategoryDTO, ProductDTO } from '@kob/shared-types';
import { MarketingShell } from '@/components/store/MarketingShell';
import { ProductCard } from '@/components/store/ProductCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { serverApiFetch } from '@/lib/api';

async function loadMenu() {
  try {
    const [categoriesData, productsData] = await Promise.all([
      serverApiFetch<{ categories: ProductCategoryDTO[] }>('/categories', { next: { revalidate: 30 } }),
      serverApiFetch<{ products: ProductDTO[] }>('/products', { next: { revalidate: 30 } })
    ]);
    return { categories: categoriesData.categories, products: productsData.products, error: null as string | null };
  } catch {
    return { categories: [], products: [], error: 'Unable to reach the restaurant API. Please start the API server and try again.' };
  }
}

export default async function MenuPage() {
  const { categories, products, error } = await loadMenu();

  return (
    <MarketingShell>
      <main className="container-padded py-12">
        <div className="mb-10 max-w-3xl space-y-4">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-primary">Full menu</p>
          <h1 className="font-[var(--font-display)] text-5xl font-black text-charcoal">Choose your fire.</h1>
          <p className="text-lg leading-8 text-muted-foreground">
            Every price and availability state is loaded from the backend. Your final order total is always recalculated server-side at checkout.
          </p>
        </div>

        {categories.length ? (
          <div className="sticky top-20 z-30 mb-8 overflow-x-auto rounded-full border border-white/70 bg-background/85 p-2 backdrop-blur">
            <div className="flex min-w-max gap-2">
              <Button asChild size="sm" variant="dark"><a href="#all">All</a></Button>
              {categories.map((category) => (
                <Button key={category.id} asChild size="sm" variant="outline">
                  <a href={`#${category.slug}`}>{category.name}</a>
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        {error ? <Card className="glass-card p-8 text-muted-foreground">{error}</Card> : null}

        <div id="all" className="space-y-12">
          {categories.map((category) => {
            const categoryProducts = products.filter((product) => product.categoryId === category.id);
            if (!categoryProducts.length) return null;
            return (
              <section key={category.id} id={category.slug} className="scroll-mt-36 space-y-5">
                <div>
                  <h2 className="font-[var(--font-display)] text-3xl font-black text-charcoal">{category.name}</h2>
                  {category.description ? <p className="mt-2 text-muted-foreground">{category.description}</p> : null}
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {categoryProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </MarketingShell>
  );
}
