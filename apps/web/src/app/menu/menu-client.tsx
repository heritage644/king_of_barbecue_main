'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Loader2, Plus, Search, X } from 'lucide-react';
import type { CartDTO, ProductCategoryDTO, ProductDTO } from '@kob/shared-types';
import { formatMoney } from '@kob/shared-types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { apiFetch, ApiError } from '@/lib/api';
import { notifyCartUpdated } from '@/lib/cart-events';

const ALL = 'all';

export function MenuClient() {
  const [categories, setCategories] = useState<ProductCategoryDTO[]>([]);
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(ALL);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('q');
    if (initialQuery) setSearchQuery(initialQuery);
    const initialCategory = params.get('category');

    async function loadData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          apiFetch<{ categories: ProductCategoryDTO[] }>('/categories'),
          apiFetch<{ products: ProductDTO[] }>('/products')
        ]);
        setCategories(catRes.categories);
        setProducts(prodRes.products);
        if (initialCategory && catRes.categories.some((category) => category.slug === initialCategory)) {
          setActiveCategory(initialCategory);
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Unable to reach the restaurant API.');
      } finally {
        setLoadingMenu(false);
      }
    }
    void loadData();
  }, []);

  const selectCategory = useCallback((slug: string) => {
    setActiveCategory(slug);
    const url = new URL(window.location.href);
    if (slug === ALL) url.searchParams.delete('category');
    else url.searchParams.set('category', slug);
    window.history.replaceState({}, '', `${url.pathname}${url.search}`);
    if (slug !== ALL) {
      document.getElementById(slug)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  async function handleAddToCart(productId: string) {
    setAddingId(productId);
    setError(null);
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
  const visibleProducts = useMemo(
    () =>
      normalizedSearch
        ? products.filter((product) =>
            [product.name, product.description, product.categoryName ?? ''].join(' ').toLowerCase().includes(normalizedSearch)
          )
        : products,
    [normalizedSearch, products]
  );

  const sections = useMemo(() => {
    const withItems = categories
      .map((category) => ({ ...category, items: visibleProducts.filter((product) => product.categoryId === category.id) }))
      .filter((category) => category.items.length > 0);
    if (activeCategory === ALL) return withItems;
    return withItems.filter((category) => category.slug === activeCategory);
  }, [activeCategory, categories, visibleProducts]);

  const activeName = activeCategory === ALL ? null : categories.find((category) => category.slug === activeCategory)?.name;
  const resultsCount = sections.reduce((total, section) => total + section.items.length, 0);

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl bg-[#FAFAFA] px-4 py-6 sm:px-6 lg:max-w-5xl lg:px-8 lg:py-10">
      {/* Title row */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-button text-[11px] font-normal uppercase tracking-[0.25em] text-gray-400">Delicious Eats</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#151515] sm:text-3xl">Our Menu</h1>
        </div>
        <p className="font-body text-xs font-medium text-gray-500 sm:text-sm">
          {resultsCount} dish{resultsCount === 1 ? '' : 'es'} available
          {activeName ? ` · ${activeName}` : ''}
        </p>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search meals, categories or descriptions"
          aria-label="Search menu"
          className="w-full rounded-2xl border border-gray-100 bg-white py-3 pl-10 pr-10 font-body text-sm font-medium outline-none transition focus:border-primary"
        />
        {normalizedSearch ? (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {error ? (
        <Card className="mb-6 border-red-200 bg-red-50 p-4 font-body text-sm font-medium text-red-800">{error}</Card>
      ) : null}

      {/* Category rail — sticky under the 80px header, scrollable on mobile,
          wrapping into a grid once there is room. */}
      {categories.length ? (
        <nav
          aria-label="Menu categories"
          className="sticky top-[4.5rem] z-30 mb-6 rounded-2xl border border-gray-100 bg-white/95 p-1.5 shadow-sm backdrop-blur-md"
        >
          <div className="rail sm:flex-wrap sm:overflow-visible">
            <button
              type="button"
              onClick={() => selectCategory(ALL)}
              aria-pressed={activeCategory === ALL}
              className={`flex-none rounded-xl px-4 py-2 font-button text-[13px] font-normal transition ${
                activeCategory === ALL ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-[#151515]'
              }`}
            >
              All
            </button>
            {categories.map((category) => {
              const count = visibleProducts.filter((product) => product.categoryId === category.id).length;
              const isActive = activeCategory === category.slug;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => selectCategory(category.slug)}
                  aria-pressed={isActive}
                  disabled={count === 0}
                  className={`flex-none rounded-xl px-4 py-2 font-button text-[13px] font-normal transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    isActive ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-[#151515]'
                  }`}
                >
                  {category.name}
                  <span className={`ml-1.5 text-[11px] ${isActive ? 'text-white/70' : 'text-gray-400'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </nav>
      ) : null}

      {loadingMenu ? (
        <Card className="p-8 text-center font-body text-sm text-gray-400">Loading menu items…</Card>
      ) : sections.length ? (
        <div id="all" className="space-y-8">
          {sections.map((section) => (
            <section key={section.id} id={section.slug} className="scroll-mt-32 space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold text-[#151515] sm:text-xl">{section.name}</h2>
                <span className="font-body text-xs font-medium text-gray-400">
                  {section.items.length} item{section.items.length === 1 ? '' : 's'}
                </span>
              </div>
              {section.description ? <p className="font-body text-sm text-gray-500">{section.description}</p> : null}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {section.items.map((product) => {
                  const isAdding = addingId === product.id;
                  const isAdded = addedId === product.id;

                  return (
                    <Card
                      key={product.id}
                      className="relative flex overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="flex w-full gap-3">
                        <Link
                          href={`/menu/${product.slug}`}
                          aria-label={`View ${product.name}`}
                          className="relative h-20 w-20 flex-none overflow-hidden rounded-xl bg-gray-100 sm:h-24 sm:w-24"
                        >
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              sizes="(max-width: 640px) 80px, 96px"
                              className="object-cover transition duration-300 hover:scale-105"
                            />
                          ) : null}
                        </Link>

                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div className="min-w-0">
                            <Link
                              href={`/menu/${product.slug}`}
                              className="block truncate text-sm font-semibold text-[#151515] transition hover:text-primary"
                            >
                              {product.name}
                            </Link>
                            {product.description ? (
                              <p className="mt-0.5 line-clamp-2 font-body text-xs font-medium text-gray-400">
                                {product.description}
                              </p>
                            ) : null}
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2">
                            <p className="truncate font-body text-sm font-medium text-primary">
                              {formatMoney(product.priceCents, product.currency)}
                            </p>

                            {!product.isAvailable ? (
                              <Badge variant="danger" className="px-2 py-1 text-[10px]">
                                Sold out
                              </Badge>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddToCart(product.id)}
                                disabled={isAdding}
                                className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#151515] text-white shadow-sm transition hover:bg-gray-800 active:scale-95 disabled:opacity-50"
                                aria-label={`Add ${product.name} to cart`}
                              >
                                {isAdding ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : isAdded ? (
                                  <Check className="h-4 w-4 text-emerald-400" />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <h2 className="font-heading text-lg font-semibold text-[#151515]">Nothing matches that yet</h2>
          <p className="mx-auto mt-2 max-w-md font-body text-sm font-medium text-gray-500">
            {normalizedSearch
              ? `No dishes match “${searchQuery}”. Try a protein, a side or a category name.`
              : 'This section is empty right now — the kitchen restocks between services.'}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {normalizedSearch ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="rounded-full bg-primary px-4 py-2 font-button text-[13px] font-normal text-white transition hover:bg-ember-700"
              >
                Clear search
              </button>
            ) : null}
            {activeCategory !== ALL ? (
              <button
                type="button"
                onClick={() => selectCategory(ALL)}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 font-button text-[13px] font-normal text-gray-600 transition hover:border-primary hover:text-primary"
              >
                Show all categories
              </button>
            ) : null}
          </div>
        </div>
      )}
    </main>
  );
}
