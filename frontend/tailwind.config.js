/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FFF5F8',
        'cream-dark': '#F0E4ED',
        sky: '#5BADE5',
        'sky-dark': '#4A9BD4',
        navy: '#2D2654',
        bubblegum: '#F4A7BB',
        lavender: '#9B8BBF',
        mint: '#7EC8B8',
        sunshine: '#FFD93D',
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        amiri: ['Amiri', 'serif'],
      },
    },
  },
  plugins: [],
}
