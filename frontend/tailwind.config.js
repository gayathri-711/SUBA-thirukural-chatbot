/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFCF9',
          100: '#FAF6EE',
          200: '#F4EFEA',
          300: '#EAE2D5',
          400: '#DFD4C2',
        },
        forest: {
          50: '#EBF4F0',
          100: '#CCE5D9',
          200: '#9ECDB9',
          300: '#69AD92',
          400: '#408C70',
          500: '#2D6A4F',
          600: '#1B4332',
          700: '#143628',
          800: '#0F291E',
          900: '#081C15',
        },
        gold: {
          50: '#FCF9EE',
          100: '#F7F0D4',
          200: '#EEDDA7',
          300: '#E4C776',
          400: '#D4AF37',
          500: '#C59B27',
          600: '#A47D1A',
          700: '#7E5F14',
        }
      },
      fontFamily: {
        tamil: ['"Anek Tamil"', '"Noto Sans Tamil"', 'serif'],
        display: ['"Cinzel"', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 4px 20px -2px rgba(8, 28, 21, 0.05)',
        'card': '0 8px 30px -4px rgba(8, 28, 21, 0.08)',
        'elevated': '0 20px 40px -8px rgba(8, 28, 21, 0.12)',
      }
    },
  },
  plugins: [],
}
