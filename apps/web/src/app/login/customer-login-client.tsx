'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch, ApiError } from '@/lib/api';

export function CustomerLoginClient() {
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
      router.push('/dashboard/orders');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to log in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container-padded py-12">
      <Card className="glass-card mx-auto max-w-md p-8">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-primary">Customer account</p>
        <h1 className="mt-3 text-3xl font-black text-charcoal">Sign in to view orders</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
          <Button type="submit" size="lg" disabled={loading} className="w-full">{loading ? 'Signing in…' : 'Sign in'}</Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">Demo customer from seed: customer@example.com / customer123</p>
      </Card>
    </main>
  );
}
