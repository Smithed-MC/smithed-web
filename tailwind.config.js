module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      width: {
        '320': '320px',
        '480': '480px',
        '640': '640px'
      },
      height: {
        '180': '180px',
        '270': '270px',
        '360': '360px'
      },
      colors: {
        'light-accent': '#216BEA',
        'dark-accent': '#1B48C4'
      }
    },
  },
  fontFamily: {
    'disket': ['Disket']
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
