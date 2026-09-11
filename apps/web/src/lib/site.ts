/**
 * Single source of truth for marketing/contact data.
 *
 * Anything a restaurant owner would realistically change (hours, phone,
 * address, social profiles, quick links) lives here instead of being
 * copy-pasted into the hero, contact cards and footer.
 */
export const siteConfig = {
  name: 'King of Barbecue',
  tagline: 'Good food. Hot off the grill.',
  blurb:
    'Grilled favourites, BBQ classics and sides made fresh to order — with live order tracking from approval to completion.',
  phone: {
    display: '+234 800 000 0000',
    telHref: 'tel:+2348000000000',
    whatsappHref: 'https://wa.me/2348000000000'
  },
  email: 'hello@kingofbarbecue.ng',
  address: {
    line1: '11 Ember Avenue',
    line2: 'Awka, Anambra, Nigeria',
    mapsHref: 'https://www.google.com/maps/search/?api=1&query=11+Ember+Avenue+Awka'
  },
  /** Opening hours in 24h form so the footer can decide "open now" client-side. */
  hours: [
    { days: 'Mon – Sat', time: '10:00 AM – 10:00 PM', openHour: 10, closeHour: 22, weekdays: [1, 2, 3, 4, 5, 6] },
    { days: 'Sunday', time: 'Closed', openHour: null, closeHour: null, weekdays: [0] }
  ],
  socials: [
    { id: 'instagram', label: 'Instagram', href: 'https://instagram.com' },
    { id: 'x', label: 'X', href: 'https://x.com' },
    { id: 'facebook', label: 'Facebook', href: 'https://facebook.com' },
    { id: 'tiktok', label: 'TikTok', href: 'https://tiktok.com' }
  ],
  navigation: [
    { label: 'Browse the menu', href: '/menu' },
    { label: 'Your cart', href: '/cart' },
    { label: 'Sign in', href: '/login' },
    { label: 'Your orders', href: '/dashboard/orders' }
  ],
  support: [
    { label: 'Delivery & checkout', href: '/checkout' },
    { label: 'Gallery', href: '/#gallery' },
    { label: 'About us', href: '/#about' },
    { label: 'Staff order board', href: '/operations' }
  ]
} as const;

export type SiteConfig = typeof siteConfig;

export type StoreSchedule = {
  days: string;
  time: string;
  /** null when the restaurant never opens that day. */
  openHour: number | null;
  closeHour: number | null;
  /** JS weekday numbers (0 = Sunday). */
  weekdays: readonly number[];
};

export type SiteSocial = SiteConfig['socials'][number];
