import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Earth tones (Primary Brand)
        earth: {
          50: '#f5f8f5',
          100: '#e6ede6',
          200: '#cdd9cd',
          300: '#adbfad',
          400: '#7a9a7a',
          500: '#5f7d5f',
          600: '#577256',  // Primary
          700: '#4d6a4d',
          800: '#3d5a3d',
          900: '#2d4a2d',
          950: '#1a2e1a',
        },
        // Sage (Secondary)
        sage: {
          50: '#f3f9f4',
          100: '#e7f3e9',
          200: '#c8dbcd',
          300: '#a9c2b1',
          400: '#8aaa95',
          500: '#6b9279',
          600: '#527a5f',  // Primary sage
          700: '#426650',
          800: '#365340',
          900: '#2a4030',
          950: '#1e2d20',
        },
        // TCM Red (Traditional Chinese Medicine accent)
        tcm: {
          50: '#fff5f5',
          100: '#ffe5e6',
          200: '#ffccce',
          300: '#ff9aa0',
          400: '#ff6770',
          500: '#d63031',
          600: '#c1272d',  // Traditional Chinese red
          700: '#a01f23',
          800: '#7f1a1d',
          900: '#651618',
        },
        // Gold (Premium/Verified)
        gold: {
          50: '#faf4ed',
          100: '#f5e9d8',
          200: '#ead3b0',
          300: '#dfbd88',
          400: '#e0b589',
          500: '#d4a574',
          600: '#c8955f',
          700: '#855f30',
          800: '#85602e',
          900: '#644817',
        },
        // Cream (Warm backgrounds)
        cream: {
          50: '#fffef9',
          100: '#fefcf3',
          200: '#faf6e8',
          300: '#f5edd8',
          400: '#efe4c8',
        },
        // Warm (Warnings, TCM hot)
        warm: {
          50: '#fef7f6',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#c25b56',
          600: '#dc2626',
          700: '#991b1b',
        },
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
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};

export default config;
