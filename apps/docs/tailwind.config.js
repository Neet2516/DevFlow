/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f9f9f9',
          100: '#f0f0f0',
          200: '#e0e0e0',
          300: '#cccccc',
          400: '#999999',
          500: '#666666',
          600: '#444444',
          700: '#222222',
          800: '#141414',
          900: '#0a0a0a',
          950: '#000000',
        },
        surface: {
          light: '#ffffff',
          dark:  '#000000',
        },
        sidebar: {
          light: '#fafafa',
          dark:  '#0a0a0a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'float-slow':  'floatY 6s ease-in-out infinite',
        'float-med':   'floatY 4s ease-in-out infinite',
        'float-fast':  'floatY 3s ease-in-out infinite',
        'fade-up':     'fadeUp 0.6s ease-out forwards',
        'fade-up-delay-1': 'fadeUp 0.6s 0.1s ease-out both',
        'fade-up-delay-2': 'fadeUp 0.6s 0.2s ease-out both',
        'fade-up-delay-3': 'fadeUp 0.6s 0.3s ease-out both',
        'fade-up-delay-4': 'fadeUp 0.6s 0.4s ease-out both',
        'fade-up-delay-5': 'fadeUp 0.6s 0.5s ease-out both',
        'scale-in': 'scaleIn 0.4s ease-out both',
      },
      keyframes: {
        floatY: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
