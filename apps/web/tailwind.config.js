/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef3f9',
          100: '#d5e0ef',
          200: '#b0c5df',
          300: '#849fca',
          400: '#5a7ab0',
          500: '#3f5f96',
          600: '#324b7a',
          700: '#2a3d63',
          800: '#1e2d4a',
          900: '#0B1F3A',
          950: '#071528',
        },
        cream: {
          50: '#ffffff',
          100: '#faf9f7',
          200: '#f3f1ec',
          300: '#e8e4db',
          400: '#d4cfc3',
        },
        gold: {
          400: '#c9a84c',
          500: '#b8922f',
          600: '#9a7824',
        },
      },
      fontFamily: {
        display: ['"Libre Baskerville"', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px rgba(11, 31, 58, 0.08)',
        card: '0 8px 30px rgba(11, 31, 58, 0.12)',
      },
    },
  },
  plugins: [],
};
