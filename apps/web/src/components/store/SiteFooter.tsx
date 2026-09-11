import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Clock, Facebook, Instagram, Mail, MapPin, Music2, Phone, Twitter } from 'lucide-react';
import type { ProductCategoryDTO, ProductDTO } from '@kob/shared-types';
import { serverApiFetch } from '@/lib/api';
import { siteConfig, type SiteSocial } from '@/lib/site';
import { Logo } from './Logo';
import { FooterOrderTracker } from './FooterOrderTracker';
import { FooterStoreStatus } from './FooterStoreStatus';

const socialIcons: Record<string, LucideIcon> = {
  instagram: Instagram,
  x: Twitter,
  facebook: Facebook,
  tiktok: Music2
};

export type FooterMenuSection = ProductCategoryDTO & { count: number };

/** Menu sections + live item counts, straight from the product API. */
async function getMenuSections(): Promise<FooterMenuSection[]> {
  try {
    const [categories, products] = await Promise.all([
      serverApiFetch<{ categories: ProductCategoryDTO[] }>('/categories', { next: { revalidate: 60 } }),
      serverApiFetch<{ products: ProductDTO[] }>('/products', { next: { revalidate: 60 } })
    ]);

    const counts = new Map<string, number>();
    for (const product of products.products) {
      counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
    }

    return categories.categories
      .map((category) => ({ ...category, count: counts.get(category.id) ?? 0 }))
      .filter((category) => category.count > 0);
  } catch {
    return [];
  }
}

/**
 * Footer for the public site. Menu links and item counts come from the live
 * product API (revalidated every 60s), the status pill streams the operations
 * pause switch in realtime and the copyright year is computed — so nothing in
 * here is a stale copy of the catalogue.
 */
export async function SiteFooter() {
  const year = new Date().getFullYear();
  const sections = await getMenuSections();

  return (
    <footer id="site-footer" className="mt-16 bg-[#151515] text-white">
      <div className="container-padded grid gap-10 pb-28 pt-12 sm:pb-14 lg:grid-cols-[1.5fr_0.8fr_1fr_1.2fr] lg:gap-8 lg:py-16">
        {/* Brand + live status */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Logo />
            <p className="font-heading text-lg font-semibold uppercase leading-tight tracking-[0.12em]">
              <span className="text-primary">King</span> of
              <br />
              Barbecue
            </p>
          </div>
          <p className="max-w-sm font-body text-sm font-medium leading-6 text-white/65">{siteConfig.blurb}</p>
          <FooterStoreStatus hours={siteConfig.hours} />
          <ul className="flex flex-wrap gap-2 pt-1">
            {siteConfig.socials.map((social) => (
              <SocialLink key={social.id} social={social} />
            ))}
          </ul>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:contents">
          {/* Site navigation */}
          <nav aria-labelledby="footer-explore" className="space-y-3">
            <FooterHeading id="footer-explore">Explore</FooterHeading>
            <ul className="space-y-2">
              {siteConfig.navigation.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Support links */}
          <nav aria-labelledby="footer-support" className="space-y-3">
            <FooterHeading id="footer-support">Support</FooterHeading>
            <ul className="space-y-2">
              {siteConfig.support.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Live menu categories */}
          <nav aria-labelledby="footer-menu" className="space-y-3">
            <FooterHeading id="footer-menu">Our menu</FooterHeading>
            {sections.length ? (
              <ul className="space-y-2">
                {sections.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/menu?category=${encodeURIComponent(category.slug)}`}
                      className="group flex items-center justify-between gap-3 font-body text-sm font-medium text-white/75 transition hover:text-primary"
                    >
                      <span>{category.name}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 font-button text-[11px] font-normal text-white/60 transition group-hover:bg-primary group-hover:text-white">
                        {category.count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-body text-sm font-medium text-white/50">
                Today&rsquo;s sections are being refreshed —{' '}
                <Link href="/menu" className="text-primary underline-offset-4 hover:underline">
                  open the full menu
                </Link>
                .
              </p>
            )}
          </nav>
        </div>

        {/* Track + contact */}
        <div className="space-y-6">
          <FooterOrderTracker />
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <FooterHeading id="footer-visit">Visit us</FooterHeading>
            <ul className="space-y-2.5 font-body text-sm font-medium text-white/75">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden />
                <a href={siteConfig.address.mapsHref} target="_blank" rel="noreferrer" className="transition hover:text-primary">
                  {siteConfig.address.line1}, {siteConfig.address.line2}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden />
                <a href={siteConfig.phone.telHref} className="transition hover:text-primary">
                  {siteConfig.phone.display}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden />
                <a href={`mailto:${siteConfig.email}`} className="transition hover:text-primary">
                  {siteConfig.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden />
                <span className="block space-y-0.5">
                  {siteConfig.hours.map((entry) => (
                    <span key={entry.days} className="block">
                      {entry.days}: {entry.time}
                    </span>
                  ))}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-padded flex flex-col gap-3 py-5 font-body text-xs font-medium text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Prices in NGN, inclusive of VAT</span>
            <Link href="/operations" className="transition hover:text-primary">
              Staff order board
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 id={id} className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-white/45">
      {children}
    </h3>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-body text-sm font-medium text-white/75 transition hover:text-primary">
      {children}
    </Link>
  );
}

function SocialLink({ social }: { social: SiteSocial }) {
  const Icon = socialIcons[social.id] ?? Instagram;
  return (
    <li>
      <a
        href={social.href}
        target="_blank"
        rel="noreferrer"
        aria-label={social.label}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-primary hover:bg-primary hover:text-white"
      >
        <Icon className="h-4 w-4" />
      </a>
    </li>
  );
}
