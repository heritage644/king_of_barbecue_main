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

  {/* Hero banner */}
  <div className="relative overflow-hidden rounded-2xl bg-[#151515] text-white shadow-md sm:rounded-[2rem]">
    <div className="flex min-h-[160px] items-stretch justify-between sm:min-h-[220px] lg:min-h-[260px]">
      {/* Left Content Area */}
      <div className="flex flex-1 flex-col justify-center p-5 sm:p-8 md:p-10 lg:p-12">
        <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          Good food.
          <br />
          <span className="text-primary">Hot</span> off the <span className="text-primary">grill</span>
        </h1>
        <p className="mt-2 max-w-sm text-xs text-gray-300 sm:mt-3 sm:text-sm lg:text-base">
          Grilled favourites, BBQ classics and sides made fresh to order.
        </p>

        <div className="mt-4 sm:mt-6">
          <Button asChild size="lg" className="rounded-full bg-primary px-5 py-2 text-xs font-semibold hover:bg-ember-700 sm:px-6 sm:text-sm">
            <Link href="/menu" className="inline-flex items-center gap-1.5">
              Order now <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>

      {/* Right Image Container */}
      <div className="relative w-[35%] shrink-0 sm:w-[30%] lg:w-[28%]">
        <Image
          src="https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=900&q=80"
          alt="Barbecue ribs fresh off the grill"
          fill
          sizes="(min-width: 1024px) 28vw, (min-width: 640px) 30vw, 35vw"
          className="object-cover object-right"
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
