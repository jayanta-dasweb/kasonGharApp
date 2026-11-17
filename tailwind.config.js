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
        muga: {
          DEFAULT: '#D97706',
          soft: '#F59E0B',
        },
        cream: '#FAFAF9',
        ink: '#0F172A',
      },
    },
  },
  plugins: [],
};
