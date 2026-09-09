import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock, MapPin, Phone, ShieldCheck, Sparkles } from 'lucide-react';
import type { ProductDTO } from '@kob/shared-types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MarketingShell } from '@/components/store/MarketingShell';
import { ProductCard } from '@/components/store/ProductCard';
import { serverApiFetch } from '@/lib/api';

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
      <main>
        <section className="container-padded grid min-h-[calc(100vh-5rem)] items-center gap-10 py-12 lg:grid-cols-[1fr_0.9fr] lg:py-20">
          <div className="max-w-3xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/70 px-4 py-2 text-sm font-bold text-primary shadow-sm">
              <Sparkles className="h-4 w-4" /> Live ordering now available
            </div>
            <div className="space-y-5">
              <h1 className="font-[var(--font-display)] text-5xl font-black leading-[0.95] tracking-tight text-charcoal sm:text-6xl lg:text-7xl">
                Smoke, spice and royal barbecue — ordered in minutes.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Browse signature grills, rice meals, fish, chicken, sides and chilled drinks. Place a guest order, watch status updates live, and skip the WhatsApp waiting line.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/menu">
                  View Menu <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#contact">Call the restaurant</Link>
              </Button>
            </div>
            <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                ['Fresh off the grill', 'Prepared only after your order lands.'],
                ['Live tracking', 'Follow approval and preparation in real time.'],
                ['Guest checkout', 'No account required before ordering.']
              ].map(([title, body]) => (
                <Card key={title} className="glass-card p-4">
                  <p className="font-bold text-charcoal">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </Card>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-8 rounded-[3rem] bg-primary/20 blur-3xl" />
            <Card className="relative overflow-hidden rounded-[2.5rem] bg-charcoal text-white shadow-glow">
              <div className="relative aspect-[4/5]">
                <Image
                  src="https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=1200&q=80"
                  alt="Barbecue platter with fire-grilled meat"
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/20 to-transparent" />
                <div className="absolute bottom-0 space-y-3 p-7">
                  <BadgeLike>Most ordered</BadgeLike>
                  <h2 className="text-3xl font-black">Royal Mixed Grill</h2>
                  <p className="max-w-sm text-sm leading-6 text-white/80">Smoky beef, chicken, sausage and plantain with our house pepper sauce.</p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section id="featured" className="container-padded py-16">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-primary">Featured menu</p>
              <h2 className="mt-3 font-[var(--font-display)] text-4xl font-black text-charcoal">Popular from the pit</h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/menu">Explore all dishes</Link>
            </Button>
          </div>
          {featured.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.slice(0, 6).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Card className="glass-card p-8 text-muted-foreground">Menu is loading from the restaurant API. Start the API and seed data to see live products.</Card>
          )}
        </section>

        <section id="gallery" className="container-padded py-16">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-primary">Gallery</p>
            <h2 className="mt-3 font-[var(--font-display)] text-4xl font-black text-charcoal">Warm tables, bold plates, serious fire.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {gallery.map((src, index) => (
              <div key={src} className={`relative overflow-hidden rounded-[2rem] ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''} min-h-64`}>
                <Image src={src} alt="King of Barbecue gallery image" fill sizes="(min-width: 768px) 25vw, 100vw" className="object-cover" />
              </div>
            ))}
          </div>
        </section>

        <section id="about" className="container-padded py-16">
          <Card className="grid overflow-hidden bg-charcoal text-white lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative min-h-80">
              <Image src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80" alt="Restaurant dining room" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
            </div>
            <div className="space-y-5 p-8 lg:p-12">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-amber-300">About us</p>
              <h2 className="font-[var(--font-display)] text-4xl font-black">Built around hospitality, now upgraded for speed.</h2>
              <p className="leading-8 text-white/75">
                King of Barbecue brings the energy of a live grill to a smoother digital ordering experience. Our operations team receives structured orders instantly, verifies payment, and keeps you informed from approval to completion.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <Info icon={<ShieldCheck className="h-5 w-5" />} label="Verified orders" />
                <Info icon={<Clock className="h-5 w-5" />} label="Live status" />
                <Info icon={<Sparkles className="h-5 w-5" />} label="Premium taste" />
              </div>
            </div>
          </Card>
        </section>

        <section id="contact" className="container-padded pb-20 pt-12">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="glass-card p-6">
              <Phone className="mb-4 h-6 w-6 text-primary" />
              <h3 className="text-xl font-black">Call or WhatsApp</h3>
              <a className="mt-2 block text-muted-foreground hover:text-primary" href="tel:+2348000000000">+234 800 000 0000</a>
            </Card>
            <Card className="glass-card p-6">
              <MapPin className="mb-4 h-6 w-6 text-primary" />
              <h3 className="text-xl font-black">Location</h3>
              <p className="mt-2 text-muted-foreground">11 Ember Avenue, Awka, Nigeria</p>
            </Card>
            <Card className="glass-card p-6">
              <Clock className="mb-4 h-6 w-6 text-primary" />
              <h3 className="text-xl font-black">Opening hours</h3>
              <p className="mt-2 text-muted-foreground">Mon–Sat, 10:00 AM – 10:00 PM</p>
            </Card>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}

function BadgeLike({ children }: { children: ReactNode }) {
  return <span className="inline-flex rounded-full bg-amber-300 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-charcoal">{children}</span>;
}

function Info({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-3 text-sm font-bold">
      {icon}
      {label}
    </div>
  );
}
