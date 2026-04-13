import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms';
import tailwindColorRefs from './styles/generated/tailwind-color-refs.json';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      /** Primitive palettes — CSS variables from Style Dictionary (`npm run tokens:build`) */
      colors: {
        ...tailwindColorRefs,
      },
      fontFamily: {
        sans: ['Source Sans 3', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif: ['Crimson Pro', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
        chinese: ['Noto Serif SC', 'serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
      },
      boxShadow: {
        'earth': '0 10px 15px -3px rgba(93, 122, 93, 0.15), 0 4px 6px -2px rgba(93, 122, 93, 0.05)',
        'sage': '0 10px 15px -3px rgba(82, 122, 95, 0.15), 0 4px 6px -2px rgba(82, 122, 95, 0.05)',
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'float': '0 8px 16px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-earth': 'linear-gradient(135deg, #f5f8f5 0%, #e7f3e9 100%)',
        'gradient-sage': 'linear-gradient(135deg, #f3f9f4 0%, #e6ede6 100%)',
        'gradient-hero': 'linear-gradient(135deg, #f5f8f5 0%, #f3f9f4 50%, #e7f3e9 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#374151', // gray-700
            a: {
              color: '#5d7a5d', // earth-600
              '&:hover': {
                color: '#4d6a4d', // earth-700
              },
            },
            h1: {
              color: '#111827', // gray-900
              fontFamily: 'Crimson Pro, Georgia, serif',
            },
            h2: {
              color: '#111827', // gray-900
              fontFamily: 'Crimson Pro, Georgia, serif',
            },
            h3: {
              color: '#111827', // gray-900
            },
            strong: {
              color: '#111827', // gray-900
            },
            code: {
              color: '#4d6a4d', // earth-700
              backgroundColor: '#f5f8f5', // earth-50
              padding: '0.25rem 0.375rem',
              borderRadius: '0.25rem',
              fontWeight: '500',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
          },
        },
      },
    },
  },
  plugins: [
    typography,
    forms,
  ],
};

export default config;
