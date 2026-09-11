import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  Headphones,
  Home,
  LayoutGrid,
  MapPin,
  Phone,
  Radar,
  ShieldCheck,
  ShoppingCart
} from 'lucide-react';
import type { ProductCategoryDTO, ProductDTO } from '@kob/shared-types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MarketingShell } from '@/components/store/MarketingShell';
import { HomeSearchForm } from '@/components/store/HomeSearchForm';
import { HomeFeaturedMenu } from '@/components/store/HomeFeaturedMenu';
import { serverApiFetch } from '@/lib/api';

/** Used when the product API is unreachable, so the page never shows a hole. */
const fallbackGallery = [
  'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=900&q=80'
];

async function getMenuSnapshot(): Promise<{ categories: ProductCategoryDTO[]; products: ProductDTO[] }> {
  try {
    const [categories, products] = await Promise.all([
      serverApiFetch<{ categories: ProductCategoryDTO[] }>('/categories', { next: { revalidate: 30 } }),
      serverApiFetch<{ products: ProductDTO[] }>('/products', { next: { revalidate: 30 } })
    ]);
    return { categories: categories.categories, products: products.products };
  } catch {
    return { categories: [], products: [] };
  }
}

export default async function LandingPage() {
  const { categories, products } = await getMenuSnapshot();
  const featured = products.filter((product) => product.isFeatured);

  const gallery = products
    .filter((product) => product.imageUrl)
    .slice(0, 4)
    .map((product) => ({ src: product.imageUrl as string, alt: product.name }));
  const galleryImages = gallery.length
    ? gallery
    : fallbackGallery.map((src, index) => ({ src, alt: `King of Barbecue plate ${index + 1}` }));

  return (
    <MarketingShell>
      <main>
        <section className="container-padded space-y-5 pt-4 pb-8">
          {/* Mobile / tablet search */}
          <HomeSearchForm />

          {/* Hero banner — fluid grid so copy and platter never collide, from
              a 320px phone up to an ultrawide desktop. */}
          <div className="relative isolate overflow-hidden rounded-2xl bg-[#151515] text-white shadow-md sm:rounded-[2rem]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_130%_at_88%_-10%,rgba(244,81,30,0.45),transparent_58%)]"
            />
            <div className="relative grid items-center gap-6 p-6 sm:p-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 lg:p-14 xl:gap-14">
              <div className="max-w-xl space-y-3 sm:space-y-4">
                <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-button text-[11px] font-normal uppercase tracking-[0.18em] text-white/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                  Grilled to order in Awka
                </p>
                <h1 className="text-[1.75rem] leading-[1.12] sm:text-4xl lg:text-5xl xl:text-[3.5rem]">
                  Good food.
                  <br />
                  <span className="text-primary">Hot</span> off the <span className="text-primary">grill</span>
                </h1>
                <p className="max-w-md font-body text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
                  Grilled favourites, BBQ classics and sides made fresh to order — tracked live from approval to
                  completion.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button asChild size="lg" className="bg-primary px-6 text-[15px] hover:bg-ember-700">
                    <Link href="/menu">
                      Order now <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="ghost" className="border border-white/20 px-5 text-[15px] text-white hover:bg-white/10">
                    <Link href="#featured">See today’s picks</Link>
                  </Button>
                </div>

                <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-4 font-body text-xs font-medium text-white/60 sm:text-sm">
                  <li className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" aria-hidden /> 15–25 min kitchen time
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Radar className="h-3.5 w-3.5 text-primary" aria-hidden /> Live status
                  </li>
                  <li className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden /> Verified payments
                  </li>
                </ul>
              </div>

              {/* Platter */}
              <div className="relative mx-auto aspect-square w-full max-w-[220px] sm:ms-auto sm:me-0 sm:max-w-[300px] lg:max-w-[380px] xl:max-w-[440px]">
                <Image
                  src="https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=900&q=80"
                  alt="Barbecue platter fresh off the grill"
                  fill
                  sizes="(min-width: 1024px) 40vw, (min-width: 640px) 300px, 220px"
                  className="object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.45)]"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Category rail + product grid (live from the menu API) */}
        <HomeFeaturedMenu categories={categories} products={products} featured={featured} />

        {/* Gallery */}
        <section id="gallery" className="container-padded py-12">
          <div className="mb-6 max-w-2xl">
            <p className="font-button text-[11px] font-normal uppercase tracking-[0.3em] text-primary">Gallery</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#151515] sm:text-3xl">
              Warm tables, bold plates, serious fire.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            {galleryImages.slice(0, 4).map((image, index) => (
              <div
                key={image.src}
                className={`relative min-h-48 overflow-hidden rounded-2xl ${
                  index === 0 ? 'sm:col-span-2 sm:row-span-2 min-h-64' : ''
                }`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 640px) 25vw, 100vw"
                  className="object-cover transition duration-500 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </section>

        {/* About */}
        <section id="about" className="container-padded py-12">
          <Card className="grid overflow-hidden rounded-3xl bg-[#151515] text-white lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative min-h-56 lg:min-h-full">
              <Image
                src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80"
                alt="Restaurant dining room"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="space-y-4 p-6 sm:p-10">
              <p className="font-button text-[11px] font-normal uppercase tracking-[0.3em] text-amber-300">About us</p>
              <h2 className="text-2xl font-semibold sm:text-3xl">Built around hospitality, now upgraded for speed.</h2>
              <p className="font-body text-sm leading-6 text-white/75 sm:text-base sm:leading-7">
                King of Barbecue brings the energy of a live grill to a smoother digital ordering experience. Our
                operations team receives structured orders instantly, verifies payment, and keeps you informed from
                approval to completion.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Info icon={<ShieldCheck className="h-4 w-4" />} label="Verified orders" />
                <Info icon={<Clock className="h-4 w-4" />} label="Live status" />
                <Info icon={<Headphones className="h-4 w-4" />} label="Real people" />
              </div>
            </div>
          </Card>
        </section>

        {/* Contact */}
        <section id="contact" className="container-padded pb-16 pt-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <Phone className="mb-3 h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold text-[#151515]">Call or WhatsApp</h3>
              <a className="mt-1 block font-body text-sm font-medium text-gray-500 hover:text-primary" href="tel:+2348000000000">
                +234 800 000 0000
              </a>
            </Card>
            <Card className="p-5">
              <MapPin className="mb-3 h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold text-[#151515]">Location</h3>
              <p className="mt-1 font-body text-sm font-medium text-gray-500">11 Ember Avenue, Awka, Nigeria</p>
            </Card>
            <Card className="p-5">
              <Clock className="mb-3 h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold text-[#151515]">Opening hours</h3>
              <p className="mt-1 font-body text-sm font-medium text-gray-500">Mon–Sat, 10:00 AM – 10:00 PM</p>
            </Card>
          </div>
        </section>

        {/* Mobile floating bottom dock */}
        <nav
          aria-label="Quick navigation"
          className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 sm:hidden"
        >
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-[#151515] p-1.5 shadow-xl">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-button text-xs font-normal text-white transition"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link
              href="/menu"
              className="flex flex-col items-center justify-center rounded-full px-4 py-1.5 font-button text-[11px] font-normal text-gray-400 transition hover:text-white"
            >
              <LayoutGrid className="h-4 w-4" />
              Menu
            </Link>
            <Link
              href="/cart"
              className="relative flex flex-col items-center justify-center rounded-full px-4 py-1.5 font-button text-[11px] font-normal text-gray-400 transition hover:text-white"
            >
              <ShoppingCart className="h-4 w-4" />
              Cart
            </Link>
          </div>
        </nav>
      </main>
    </MarketingShell>
  );
}

function Info({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 font-body text-xs font-medium sm:text-sm">
      {icon}
      {label}
    </div>
  );
}
