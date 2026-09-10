'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetch, ApiError } from '@/lib/api';

export function OperationsLoginClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4 py-8 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all sm:max-w-lg">
        
        {/* Hero Image Banner with Logo */}
        <div className="relative h-44 w-full bg-gray-900 sm:h-52">
          <Image
            src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1000"
            alt="Barbecue & Grills Header"
            fill
            priority
            className="object-cover opacity-80"
          />
          
          {/* Circular Logo Badge */}
          <div className="absolute left-6 top-6 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-white shadow-md sm:h-16 sm:w-16">
            <div className="relative h-10 w-10 sm:h-12 sm:w-12">
              <Image
                src="/logo.png" 
                alt="Barbecue & Grills Logo"
                fill
                className="object-contain"
                onError={(e) => {
                  // Fallback icon if logo image path isn't present
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-8">
          
          {/* Header Title */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-[#151515] sm:text-3xl">Staff Portal</h1>
            <p className="mt-1 text-xs text-gray-400 sm:text-sm">Welcome back. Please sign in to continue</p>
          </div>

          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-semibold text-red-800">
              {error}
            </div>
          ) : null}

          {/* Login Form */}
          <form onSubmit={submit} className="space-y-4">
            
            {/* Email / Username Input */}
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Email/ Username"
                defaultValue="admin@kingbbq.local"
                required
                className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-xs font-medium text-[#151515] shadow-sm outline-none transition placeholder:text-gray-300 focus:border-primary sm:text-sm"
              />
            </div>

            {/* Password Input with Visibility Toggle */}
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Password"
                defaultValue="password123"
                required
                className="w-full rounded-2xl border border-gray-100 bg-white py-3 pl-4 pr-11 text-xs font-medium text-[#151515] shadow-sm outline-none transition placeholder:text-gray-300 focus:border-primary sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="mt-2 h-12 w-full rounded-2xl bg-primary text-sm font-bold text-white shadow-md transition-all hover:bg-primary/90 active:scale-[0.99]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          {/* Links & Seeded Info */}
          <div className="mt-4 text-center space-y-3">
            <Link
              href="#"
              className="inline-block text-xs font-semibold text-primary transition hover:underline"
            >
              Forgot Password
            </Link>

            <div className="pt-2 border-t border-gray-100">
              <p className="text-[11px] font-medium text-gray-400">
                Seeded demo staff: <span className="text-gray-600 font-semibold">admin@kingbbq.local</span> / <span className="text-gray-600 font-semibold">password123</span>
              </p>
            </div>
          </div>

        </div>
      </Card>
    </main>
  );
}