import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowRight, 
  Plus, 
  Home, 
  LayoutGrid, 
  ShoppingCart, 
  Clock, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';
import type { ProductDTO } from '@kob/shared-types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MarketingShell } from '@/components/store/MarketingShell';
import { HomeSearchForm } from '@/components/store/HomeSearchForm';
import { ProductCard } from '@/components/store/ProductCard';
import { serverApiFetch } from '@/lib/api';

const categories = ['All items', 'Grills', 'BBQ', 'Chicken', 'Sides'];

const gallery = [
  'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=900&q=80'
];

async function getFeaturedProducts() {
  try {
    const data = await serverApiFetch<{ products: ProductDTO[] }>('/products?featured=true', { next: { revalidate: 30 } });
    return data.products;
  } catch {
    return [];
  }
}

export default async function LandingPage() {
  const featured = await getFeaturedProducts();

  return (
    <MarketingShell>
      <main className="pb-24 sm:pb-0">
        <section className="container-padded space-y-6 pt-4 pb-8">
          {/* Mobile Search Input */}
          <HomeSearchForm />

          {/* Hero Banner (Figma Dark Card with Platter Image) */}
          <div className="relative overflow-hidden rounded-2xl bg-[#151515] p-6 text-white shadow-md sm:p-10">
            <div className="relative z-10 max-w-[240px] space-y-2 sm:max-w-md">
              <h1 className="text-2xl font-bold leading-tight sm:text-4xl">
                Good food. <br />
                <span className="text-primary">Hot</span> off the <span className="text-primary">grill</span>
              </h1>
              <p className="text-xs text-gray-300 sm:text-sm">
                Grilled favourites, BBQ classics and sides made fresh to order.
              </p>
              <div className="pt-3">
                <Button asChild size="sm" className="rounded-xl bg-primary hover:bg-primary/90">
                  <Link href="/menu" className="flex items-center gap-1.5 text-xs font-semibold">
                    Order now <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Platter graphic background positioning */}
            <div className="absolute -right-10 -bottom-6 h-48 w-48 sm:right-0 sm:bottom-0 sm:h-72 sm:w-72">
              <Image
                src="https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80"
                alt="Barbecue platter"
                fill
                sizes="(min-width: 640px) 300px, 200px"
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat, index) => (
              <button
                key={cat}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                  index === 0
                    ? 'border border-primary text-primary bg-white'
                    : 'bg-white text-gray-600 border border-transparent hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Popular Picks Section */}
        <section id="featured" className="container-padded py-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#151515]">Popular Picks</h2>
            <Link href="/menu" className="text-xs font-semibold text-primary hover:underline">
              See all
            </Link>
          </div>

          {featured.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {featured.slice(0, 6).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {/* Fallback Cards Matching Figma */}
              <Card className="flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-50">
                  <Image
                    src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80"
                    alt="BBQ Chicken Platter"
                    fill
                    sizes="(min-width: 640px) 30vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <div className="mt-2 space-y-1">
                  <h3 className="text-xs font-bold text-[#151515]">BBQ Chicken Platter</h3>
                  <p className="line-clamp-2 text-[10px] text-gray-400">Smoky, flame-grilled chicken finished ...</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-[#151515]">₦12,500</span>
                    <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white transition hover:bg-primary/90">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>

              <Card className="flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-amber-50/50">
                  <Image
                    src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80"
                    alt="Beef Suya"
                    fill
                    sizes="(min-width: 640px) 30vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <div className="mt-2 space-y-1">
                  <h3 className="text-xs font-bold text-[#151515]">Beef Suya</h3>
                  <p className="line-clamp-2 text-[10px] text-gray-400">Tender grilled beef coated in our signature suya spice.</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-[#151515]">₦9,000</span>
                    <span className="rounded-lg bg-gray-500 px-2 py-1 text-[10px] font-semibold text-white">
                      Unavailable
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </section>

        {/* Gallery Section */}
        <section id="gallery" className="container-padded py-12">
          <div className="mb-6 max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Gallery</p>
            <h2 className="mt-2 text-2xl font-bold text-[#151515] sm:text-3xl">
              Warm tables, bold plates, serious fire.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            {gallery.map((src, index) => (
              <div
                key={src}
                className={`relative min-h-48 overflow-hidden rounded-2xl ${
                  index === 0 ? 'sm:col-span-2 sm:row-span-2 min-h-64' : ''
                }`}
              >
                <Image
                  src={src}
                  alt="Gallery image"
                  fill
                  sizes="(min-width: 640px) 25vw, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="container-padded py-12">
          <Card className="grid overflow-hidden rounded-3xl bg-[#151515] text-white lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative min-h-64">
              <Image
                src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80"
                alt="Restaurant dining room"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="space-y-4 p-6 sm:p-10">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-300">About us</p>
              <h2 className="text-2xl font-bold sm:text-3xl">Built around hospitality, now upgraded for speed.</h2>
              <p className="text-xs leading-6 text-white/75 sm:text-sm">
                King of Barbecue brings the energy of a live grill to a smoother digital ordering experience. Our operations team receives structured orders instantly, verifies payment, and keeps you informed from approval to completion.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Info icon={<ShieldCheck className="h-4 w-4" />} label="Verified orders" />
                <Info icon={<Clock className="h-4 w-4" />} label="Live status" />
                <Info icon={<Sparkles className="h-4 w-4" />} label="Premium taste" />
              </div>
            </div>
          </Card>
        </section>

        {/* Contact Section */}
        <section id="contact" className="container-padded pb-16 pt-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <Phone className="mb-3 h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-[#151515]">Call or WhatsApp</h3>
              <a className="mt-1 block text-xs text-gray-500 hover:text-primary" href="tel:+2348000000000">
                +234 800 000 0000
              </a>
            </Card>
            <Card className="p-5">
              <MapPin className="mb-3 h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-[#151515]">Location</h3>
              <p className="mt-1 text-xs text-gray-500">11 Ember Avenue, Awka, Nigeria</p>
            </Card>
            <Card className="p-5">
              <Clock className="mb-3 h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-[#151515]">Opening hours</h3>
              <p className="mt-1 text-xs text-gray-500">Mon–Sat, 10:00 AM – 10:00 PM</p>
            </Card>
          </div>
        </section>

        {/* Mobile Floating Bottom Dock (Matches Figma Image) */}
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 sm:hidden">
          <nav className="flex items-center gap-1 rounded-full bg-[#151515] p-1.5 shadow-xl border border-white/10">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white transition"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link
              href="/menu"
              className="flex flex-col items-center justify-center rounded-full px-4 py-1.5 text-[10px] font-semibold text-gray-400 hover:text-white transition"
            >
              <LayoutGrid className="h-4 w-4" />
              Menu
            </Link>
            <Link
              href="/cart"
              className="flex flex-col items-center justify-center rounded-full px-4 py-1.5 text-[10px] font-semibold text-gray-400 hover:text-white transition"
            >
              <ShoppingCart className="h-4 w-4" />
              Cart
            </Link>
          </nav>
        </div>
      </main>
    </MarketingShell>
  );
}

function Info({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold">
      {icon}
      {label}
    </div>
  );
}