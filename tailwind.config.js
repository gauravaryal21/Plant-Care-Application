/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f3f7f1',
          100: '#e4eedf',
          200: '#c8dcc0',
          300: '#a2c498',
          400: '#79a871',
          500: '#578a50',
          600: '#436e3e',
          700: '#36582f',
          800: '#2c4628',
          900: '#1f3320',
          950: '#131f15',
        },
        clay: {
          50: '#fbf5ef',
          100: '#f5e6d8',
          200: '#ebcbb0',
          500: '#b8673a',
          600: '#9c5328',
          700: '#7f4322',
        },
        paper: '#f6f5f0',
      },
      boxShadow: {
        card: '0 1px 2px rgba(31, 51, 32, 0.04), 0 4px 16px -6px rgba(31, 51, 32, 0.08)',
        lift: '0 2px 4px rgba(31, 51, 32, 0.06), 0 16px 32px -12px rgba(31, 51, 32, 0.22)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        'fade-in': 'fade-in 0.2s ease-out both',
        'slide-in-right': 'slide-in-right 0.28s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scale-in 0.2s ease-out both',
      },
    },
  },
  plugins: [],
};
