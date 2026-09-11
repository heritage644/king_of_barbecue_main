import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';

/**
 * Brand typefaces are self-hosted through Fontsource packages, so the site never
 * depends on a third-party font CDN (and works in locked-down/air-gapped deploys).
 *
 * Outfit     -> headings
 * Metropolis -> body copy
 * Roboto     -> buttons / interactive controls
 *
 * Only the three weights the brand guide allows are loaded:
 * 400 (buttons), 500 (body), 600 (headings).
 */
import '@fontsource/outfit/latin-400.css';
import '@fontsource/outfit/latin-500.css';
import '@fontsource/outfit/latin-600.css';
import '@fontsource/metropolis/latin-400.css';
import '@fontsource/metropolis/latin-500.css';
import '@fontsource/metropolis/latin-600.css';
import '@fontsource/roboto/latin-400.css';
import '@fontsource/roboto/latin-500.css';
import '@fontsource/roboto/latin-600.css';

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
    <html lang="en" className="font-body">
      <body>{children}</body>
    </html>
  );
}
