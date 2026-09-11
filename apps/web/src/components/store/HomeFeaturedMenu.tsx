'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, UtensilsCrossed } from 'lucide-react';
import type { ProductCategoryDTO, ProductDTO } from '@kob/shared-types';
import { ProductCard } from './ProductCard';

const ALL = 'all';

/**
 * The section under the hero banner: category pills + product grid.
 *
 * Everything is derived from the product API — no hard-coded category list —
 * and every pill is a real filter (click, arrow-key, deep link via
 * ?category=<slug>). The grid re-renders instantly from the already-fetched
 * catalogue, so switching categories never hits the network.
 */
export function HomeFeaturedMenu({
  categories,
  products,
  featured
}: {
  categories: ProductCategoryDTO[];
  products: ProductDTO[];
  featured: ProductDTO[];
}) {
  const [activeId, setActiveId] = useState<string>(ALL);
  const pillsRef = useRef<HTMLDivElement>(null);

  const tabs = useMemo(() => {
    const withCounts = categories
      .map((category) => ({
        ...category,
        count: products.filter((product) => product.categoryId === category.id).length
      }))
      .filter((category) => category.count > 0);

    return [{ id: ALL, slug: '', name: 'All items', count: products.length }, ...withCounts];
  }, [categories, products]);

  // Restore a deep-linked category (?category=slug) on first client render.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('category');
    if (!slug) return;
    const match = tabs.find((tab) => tab.slug === slug);
    if (match) setActiveId(match.id);
  }, [tabs]);

  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  const visibleProducts = useMemo(() => {
    if (activeId === ALL) {
      const pool = featured.length ? featured : products;
      return pool.slice(0, 8);
    }
    return products.filter((product) => product.categoryId === activeId).slice(0, 12);
  }, [activeId, featured, products]);

  const selectTab = useCallback((id: string) => {
    setActiveId(id);
    const slug = id === ALL ? '' : (tabs.find((tab) => tab.id === id)?.slug ?? '');
    const nextQuery = slug ? `?category=${encodeURIComponent(slug)}` : '';
    window.history.replaceState({}, '', `${window.location.pathname}${nextQuery}`);
  }, [tabs]);

  // Roving focus: left/right arrows walk the pill rail like a tablist.
  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const pills = Array.from(pillsRef.current?.querySelectorAll<HTMLButtonElement>('[data-pill]') ?? []);
    const currentIndex = pills.findIndex((pill) => pill === document.activeElement);
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const next = pills[(currentIndex + delta + pills.length) % pills.length];
    if (next) {
      event.preventDefault();
      next.focus();
      next.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, []);

  const sectionTitle = activeId === ALL ? 'Popular Picks' : activeTab?.name ?? 'Popular Picks';
  const menuHref = activeTab?.slug ? `/menu?category=${encodeURIComponent(activeTab.slug)}` : '/menu';

  return (
   <section id="featured" className="container-padded space-y-5 px-5 py-6 sm:px-6">
  <div className="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h2 className="text-xl font-semibold text-[#151515] sm:text-2xl">{sectionTitle}</h2>
      <p className="mt-1 font-body text-xs font-medium text-gray-500 sm:text-sm">
        {visibleProducts.length} of {products.length} dish{products.length === 1 ? '' : 'es'}
        {activeId !== ALL ? ' in this section' : ' ready to order today'}
      </p>
    </div>
    <div className="flex items-center gap-2">
      {activeId !== ALL ? (
        <button
          type="button"
          onClick={() => selectTab(ALL)}
          className="rounded-full border border-gray-200 bg-white px-3 py-1.5 font-button text-[13px] font-normal text-gray-600 transition hover:border-primary hover:text-primary"
        >
          Clear filter
        </button>
      ) : null}
      <Link href={menuHref} className="inline-flex items-center gap-1 font-button text-[13px] font-normal text-primary hover:underline">
        See all <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  </div>

  {tabs.length > 1 ? (
    <div
      ref={pillsRef}
      role="tablist"
      aria-label="Filter menu by category"
      onKeyDown={handleKeyDown}
      className="rail -mx-5 px-5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            data-pill
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => selectTab(tab.id)}
            className={`flex flex-none items-center gap-1.5 whitespace-nowrap rounded-xl border px-4 py-2 font-button text-[13px] font-normal transition-colors ${
              isActive
                ? 'border-primary bg-primary text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary'
            }`}
          >
            {tab.name}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[11px] leading-none ${
                isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  ) : null}

  {visibleProducts.length ? (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {visibleProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  ) : (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
      <UtensilsCrossed className="mx-auto h-6 w-6 text-gray-400" />
      <p className="mt-3 font-heading text-base font-semibold text-[#151515]">
        {products.length ? 'This section is sold out for today.' : 'The menu is being refreshed.'}
      </p>
      <p className="mt-1 font-body text-sm font-medium text-gray-500">
        {products.length
          ? 'Pick another category above — the kitchen restocks between services.'
          : 'Connect the product API or seed the database and today’s dishes will appear here.'}
      </p>
      <Link
        href="/menu"
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-button text-[13px] font-normal text-white transition hover:bg-ember-700"
      >
        Browse the full menu <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )}
</section>
  );
}