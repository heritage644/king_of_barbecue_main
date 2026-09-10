'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function HomeSearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/menu?q=${encodeURIComponent(trimmed)}` : '/menu');
  }

  return (
    <form action="/menu" method="get" onSubmit={handleSubmit} className="relative w-full" role="search">
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="search"
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search favorite meal"
        className="w-full rounded-full border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none placeholder:text-gray-400 focus:border-primary"
        aria-label="Search menu items"
      />
    </form>
  );
}
