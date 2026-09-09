import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'King of Barbecue — Premium Grills & Online Ordering',
  description: 'Order smoky grills, rice meals, fish, chicken, sides and drinks from King of Barbecue.',
  metadataBase: new URL('https://king-of-barbecue.local')
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#c2410c'
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
