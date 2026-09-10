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
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'ui-sans-serif', 'system-ui']
      },
      boxShadow: {
        glow: '0 24px 80px rgba(244, 81, 30, 0.22)'
      }
    }
  },
  plugins: []
};

export default config;