/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        royal: {
          DEFAULT: '#1E3A8A',
          dark: '#1E3A5F',
          light: '#3B82F6',
        },
        maroon: {
          DEFAULT: '#6B1E2A',
          soft: '#8B3A45',
        },
        muga: {
          DEFAULT: '#D97706',
          soft: '#F59E0B',
        },
        cream: '#F7F1E8',
        ink: '#0F172A',
      },
    },
  },
  plugins: [],
};
