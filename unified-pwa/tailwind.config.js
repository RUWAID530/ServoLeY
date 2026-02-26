/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-700': 'rgb(31, 41, 55)',
        'dark-800': 'rgb(17, 24, 39)',
        'dark-900': 'rgb(10, 15, 20)',
        background: '#050B14',
        surface: '#0F172A',
        primary: '#2DD4BF',
        secondary: '#A3E635',
        accent: '#38BDF8',
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-out',
        'spin-slow': 'spin 20s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'bounce-slow': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-in-from-top-4': 'slideInFromTop 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInFromTop: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}