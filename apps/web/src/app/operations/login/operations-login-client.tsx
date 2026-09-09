'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch, ApiError } from '@/lib/api';

export function OperationsLoginClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setError(null);
    try {
      await apiFetch('/auth/login', {
        method: 'POST',
        json: {
          email: String(form.get('email') ?? ''),
          password: String(form.get('password') ?? '')
        }
      });
      router.push('/operations');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to log in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-charcoal px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <Card className="w-full border-white/10 bg-white/10 p-8 text-white shadow-2xl backdrop-blur">
          <Link href="/" className="mb-8 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary"><Flame className="h-6 w-6" /></span>
            <span className="text-xl font-black">King of Barbecue Ops</span>
          </Link>
          <div className="mb-6">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-amber-300">Secure staff portal</p>
            <h1 className="mt-3 text-3xl font-black">Sign in to manage orders</h1>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" defaultValue="admin@kingbbq.local" required className="text-charcoal" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" defaultValue="password123" required className="text-charcoal" />
            </div>
            {error ? <p className="rounded-2xl bg-red-500/20 p-3 text-sm font-semibold text-red-100">{error}</p> : null}
            <Button type="submit" size="lg" disabled={loading} className="w-full">{loading ? 'Signing in…' : 'Sign in'}</Button>
          </form>
          <p className="mt-6 text-sm text-white/60">Seeded demo staff: admin@kingbbq.local / password123</p>
        </Card>
      </div>
    </main>
  );
}
