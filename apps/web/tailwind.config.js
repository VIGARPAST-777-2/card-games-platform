/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Mesa de cartas: fieltro, madera, crema, burdeos, oro
        felt: {
          50: '#e8f5ee',
          100: '#c5e6d4',
          200: '#9dd4b5',
          300: '#6bb892',
          400: '#3d9a6e',
          500: '#1f7a52',
          600: '#186343',
          700: '#144f36',
          800: '#103d2a',
          900: '#0c2e20',
          950: '#061a12',
        },
        cream: {
          50: '#fdfbf7',
          100: '#f7f1e6',
          200: '#efe5d3',
          300: '#e2d2b5',
          400: '#d0b98f',
          500: '#bda06e',
        },
        wine: {
          400: '#c45c6a',
          500: '#a33d4c',
          600: '#8b2942',
          700: '#6e1f34',
          800: '#541828',
        },
        gold: {
          300: '#e4c97a',
          400: '#d4b45c',
          500: '#c4a35a',
          600: '#a8863f',
          700: '#8a6c32',
        },
        wood: {
          700: '#4a3c2a',
          800: '#3d3225',
          900: '#2c2416',
          950: '#1a150e',
        },
      },
      fontFamily: {
        display: ['Georgia', 'Times New Roman', 'serif'],
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 14px rgba(26, 21, 14, 0.35)',
        soft: '0 2px 8px rgba(26, 21, 14, 0.2)',
      },
    },
  },
  plugins: [],
};
