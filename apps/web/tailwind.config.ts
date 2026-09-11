import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Base backgrounds set strictly to pure white
        background: '#FFFFFF',
        foreground: '#151515',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#151515'
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#151515'
        },
        primary: {
          DEFAULT: '#F4511E', // Flame Orange
          foreground: '#FFFFFF'
        },
        secondary: {
          DEFAULT: '#2E8B57', // Forest Green
          foreground: '#FFFFFF'
        },
        muted: {
          DEFAULT: '#E8E8E5', // Light Gray background
          foreground: '#777777' // Darker Gray text
        },
        accent: {
          DEFAULT: '#D99000', // Gold/Amber
          foreground: '#FFFFFF'
        },
        destructive: {
          DEFAULT: '#C93C3C', // Red
          foreground: '#FFFFFF'
        },
        border: '#E8E8E5',
        input: '#E8E8E5',
        ring: '#F4511E',

        // Brand palette utilities
        brand: {
          orange: '#F4511E',
          green: '#2E8B57',
          gold: '#D99000',
          red: '#C93C3C',
          dark: '#151515',
          light: '#FAFAF8',
          white: '#FFFFFF',
          surface: '#242424',
          gray: '#777777',
          border: '#E8E8E5'
        },

        // Tokens referenced across the marketing/ops UI. These were previously
        // used (text-charcoal / bg-charcoal / hover:bg-ember-700) without ever
        // being defined, which silently dropped the styles.
        charcoal: {
          DEFAULT: '#151515',
          soft: '#242424',
          muted: '#3a3a3a'
        },
        ember: {
          50: '#fff4ed',
          100: '#ffe6d5',
          200: '#feccaa',
          300: '#fda674',
          400: '#fb743c',
          500: '#f9541e',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      fontFamily: {
        // Headings -> Outfit, body copy -> Metropolis, controls -> Roboto.
        heading: ['var(--font-heading)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        button: ['var(--font-button)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      fontWeight: {
        // Brand rule: type never goes outside regular (400) - semibold (600).
        // Buttons are regular, body copy is medium, headings are semibold, and
        // legacy font-bold/font-black usages clamp to 600 so no faux weights
        // are synthesised against the three files we actually ship.
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '600',
        extrabold: '600',
        black: '600'
      },
      boxShadow: {
        glow: '0 24px 80px rgba(244, 81, 30, 0.22)'
      }
    }
  },
  plugins: []
};

export default config;