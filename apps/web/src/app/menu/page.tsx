'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SiteHeader } from '@/components/store/SiteHeader';
import { ShoppingCart, Plus, Check, Loader2, Search } from 'lucide-react';
import type { ProductCategoryDTO, ProductDTO, CartDTO } from '@kob/shared-types';
import { formatMoney } from '@kob/shared-types';
import { Card } from '@/components/ui/card';
import { apiFetch, ApiError } from '@/lib/api';
import { notifyCartUpdated } from '@/lib/cart-events';

export default function MenuPage() {
  const [categories, setCategories] = useState<ProductCategoryDTO[]>([]);
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const initialQuery = new URLSearchParams(window.location.search).get('q');
    if (initialQuery) setSearchQuery(initialQuery);

    async function loadData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          apiFetch<{ categories: ProductCategoryDTO[] }>('/categories'),
          apiFetch<{ products: ProductDTO[] }>('/products')
        ]);
        setCategories(catRes.categories);
        setProducts(prodRes.products);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Unable to reach the restaurant API.');
      } finally {
        setLoadingMenu(false);
      }
    }
    void loadData();
  }, []);

  async function handleAddToCart(productId: string) {
    setAddingId(productId);
    try {
      await apiFetch<{ cart: CartDTO }>('/cart/items', {
        method: 'POST',
        json: { productId, quantity: 1 }
      });
      notifyCartUpdated();
      setAddedId(productId);
      setTimeout(() => setAddedId(null), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add item to cart');
    } finally {
      setAddingId(null);
    }
  }

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visibleProducts = normalizedSearch
    ? products.filter((product) =>
        [product.name, product.description, product.categoryName ?? '']
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)
      )
    : products;

  return (
    <>
   
    <main className="mx-auto min-h-screen max-w-md bg-[#FAFAFA] px-4 py-6 sm:px-6 md:max-w-2xl lg:max-w-5xl lg:px-8 lg:py-10">
     <SiteHeader/>
      {/* Header Navigation */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Delicious Eats</p>
          <h1 className="text-2xl font-bold text-[#151515] sm:text-3xl">Our Menu</h1>
        </div>
        
     
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search meals, categories or descriptions"
          className="w-full rounded-2xl border border-gray-100 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary"
          aria-label="Search menu"
        />
      </div>

      {normalizedSearch ? (
        <p className="mb-4 text-xs font-semibold text-gray-500">
          Showing results for <span className="text-primary">{searchQuery}</span>
        </p>
      ) : null}

      {error ? (
        <Card className="mb-6 border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
          {error}
        </Card>
      ) : null}

      {/* Sticky Categories */}
      {categories.length ? (
        <div className="sticky top-4 z-30 mb-6 overflow-x-auto rounded-2xl border border-gray-100 bg-white/90 p-1.5 shadow-sm backdrop-blur-md no-scrollbar">
          <div className="flex min-w-max gap-1.5">
            <a
              href="#all"
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary/90"
            >
              All
            </a>
            {categories.map((category) => (
              <a
                key={category.id}
                href={`#${category.slug}`}
                className="rounded-xl px-4 py-2 text-xs font-bold text-gray-500 transition hover:bg-gray-50 hover:text-[#151515]"
              >
                {category.name}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {loadingMenu ? (
        <Card className="p-8 text-center text-xs text-gray-400">Loading menu items…</Card>
      ) : (
        /* Grid List */
        <div id="all" className="space-y-8">
          {!error && visibleProducts.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-sm text-gray-500 shadow-sm">
              No menu items match your search yet. Try a different meal, protein or category.
            </div>
          ) : null}

          {categories.map((category) => {
            const categoryProducts = visibleProducts.filter((product) => product.categoryId === category.id);
            if (!categoryProducts.length) return null;

            return (
              <section key={category.id} id={category.slug} className="scroll-mt-24 space-y-3">
                <div>
                  <h2 className="text-lg font-bold text-[#151515] sm:text-xl">{category.name}</h2>
                  {category.description ? (
                    <p className="text-xs text-gray-400">{category.description}</p>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                  {categoryProducts.map((product) => {
                    const isAdding = addingId === product.id;
                    const isAdded = addedId === product.id;

                    return (
                      <Card
                        key={product.id}
                        className="relative flex overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:shadow-md"
                      >
                        <div className="flex w-full gap-3">
                          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-24 sm:w-24">
                            {product.imageUrl ? (
                              <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                sizes="(max-width: 640px) 80px, 96px"
                                className="object-cover"
                              />
                            ) : null}
                          </div>

                          <div className="flex flex-1 flex-col justify-between">
                            <div>
                              <h3 className="text-xs font-bold text-[#151515] sm:text-sm">{product.name}</h3>
                              {product.description ? (
                                <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-400 sm:text-xs">
                                  {product.description}
                                </p>
                              ) : null}
                            </div>

                            <div className="flex items-center justify-between pt-2">
                              <p className="text-xs font-bold text-primary sm:text-sm">
                                {formatMoney(product.priceCents, product.currency)}
                              </p>

                              <button
                                type="button"
                                onClick={() => handleAddToCart(product.id)}
                                disabled={isAdding}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#151515] text-white shadow-sm transition hover:bg-gray-800 active:scale-95 disabled:opacity-50 sm:h-8 sm:w-8"
                                aria-label={`Add ${product.name} to cart`}
                              >
                                {isAdding ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
                                ) : isAdded ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-400 sm:h-4 sm:w-4" />
                                ) : (
                                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
    </>
  );
}