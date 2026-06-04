import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-serif)', 'serif'],
        sans:  ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#1D9E75',
          dark:    '#0F6E56',
          light:   '#1D9E7520',
          muted:   '#1D9E7540',
        },
        surface: {
          1: '#111111',
          2: '#1a1a1a',
          3: '#222222',
          border: '#1f1f1f',
          'border-2': '#2a2a2a',
        },
      },
      fontSize: {
        'hero-sm': ['clamp(2.5rem, 6vw, 4.5rem)', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
        'hero':    ['clamp(3rem, 7vw, 5.5rem)',   { lineHeight: '1.06', letterSpacing: '-0.025em' }],
        'section': ['clamp(2rem, 4.5vw, 3.5rem)', { lineHeight: '1.1',  letterSpacing: '-0.02em' }],
      },
    },
  },
  plugins: [],
};

export default config;
