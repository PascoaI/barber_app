/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './legacy/**/*.{html,js}',
    './*.html',
    './script.js'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#c69a45',
        'primary-dark': '#a87a2f',
        background: '#090c14',
        surface: '#111624',
        borderc: '#28314a',
        'text-primary': '#edf2ff',
        'text-secondary': '#9da8c3'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem'
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,0.24)'
      }
    }
  },
  plugins: []
};
