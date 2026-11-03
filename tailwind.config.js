/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Luna Design System Palette
        luna: {
          lavender: '#BCA0F5',
          purple: '#8961D8',
          peach: '#FFD2BF',
          cream: '#FFF8F2',
          pink: '#FBE5EF',
          lilac: '#F0E9FF',
          text: '#332B40',
          secondary: '#71667D',
          border: '#E9DDF1',
          card: '#FFFFFF',
          success: '#3BAA83',
          warning: '#E7A34B',
          error: '#E46F7D',
        },
        // Final Mandatory Theme Palette
        navy: {
          DEFAULT: '#10182B', // Primary dark navy
          card: '#070E20',    // Card background
          secondary: '#141E34', // Secondary card background
          border: '#26334A',  // Borders
        },
        cyan: {
          DEFAULT: '#18BDF5', // Primary cyan
          hover: '#38BDF8',
          glow: 'rgba(24, 189, 245, 0.35)',
        },
        surface: {
          bg: '#FFF8F2',      // Luna warm cream background
          textLight: '#FFFFFF', // Text on dark surfaces
          textMuted: '#71667D', // Secondary text
          textDark: '#332B40',  // Primary text
          border: '#E9DDF1',
        },
        status: {
          success: '#3BAA83',
          warning: '#E7A34B',
          error: '#E46F7D',
        },
        brand: {
          purple: '#8961D8',
          violet: '#8961D8',
          lavender: '#BCA0F5',
          peach: '#FFD2BF',
          cream: '#FFF8F2',
          blue: '#8961D8',
          darkBlue: '#8961D8',
          dark: '#332B40',
          secondary: '#71667D',
          muted: '#71667D',
          bg: '#FFF8F2',
          card: '#FFFFFF',
          border: '#E9DDF1',
          success: '#3BAA83',
          warning: '#E7A34B',
          error: '#E46F7D',
          incidentCard: '#FFFFFF',
          darkSurface: '#FFF8F2',
          darkCard: '#FFFFFF',
          darkBorder: '#E9DDF1',
        },
        gradient: {
          start: '#8961D8',
          mid: '#BCA0F5',
          end: '#FFD2BF',
        }
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(24, 189, 245, 0.08), 0 2px 6px -1px rgba(16, 24, 43, 0.06)',
        'card': '0 10px 30px -4px rgba(7, 14, 32, 0.08), 0 4px 8px -2px rgba(7, 14, 32, 0.04)',
        'card-hover': '0 16px 36px -4px rgba(24, 189, 245, 0.16), 0 6px 12px -2px rgba(16, 24, 43, 0.08)',
        'glow-cyan': '0 0 25px -3px rgba(24, 189, 245, 0.45)',
        'glow-purple': '0 0 25px -3px rgba(168, 85, 247, 0.35)',
        'incident': '0 12px 30px -4px rgba(7, 14, 32, 0.6), 0 4px 10px -2px rgba(0, 0, 0, 0.4)',
        'navy-card': '0 12px 32px -4px rgba(0, 0, 0, 0.45)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'xs': ['13px', '18px'],
        'sm': ['14px', '20px'],
        'base': ['16px', '24px'],
        'lg': ['18px', '26px'],
        'xl': ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '38px'],
        '4xl': ['36px', '44px'],
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '20%, 60%': { transform: 'rotate(14deg)' },
          '40%, 80%': { transform: 'rotate(-10deg)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      },
      animation: {
        wave: 'wave 1.8s ease-in-out infinite',
        float: 'bounceSubtle 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
