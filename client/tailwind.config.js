/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0B1526',
          900: '#0F1B33',
          800: '#152645',
          700: '#1E2E4F',
          600: '#2C3F63',
        },
        surface: {
          DEFAULT: '#F5F6FA',
          muted: '#ECEEF4',
        },
        accent: {
          DEFAULT: '#E0932F',
          dark: '#C77A1E',
          light: '#FBEBD5',
        },
        teal: {
          DEFAULT: '#0F7B6C',
          light: '#DCF2EE',
        },
        rose: {
          DEFAULT: '#C4432E',
          light: '#FBE4DF',
        },
        slate: {
          950: '#14213D',
          700: '#3D4A63',
          500: '#6B7690',
          300: '#C7CCDA',
          200: '#DEE1EA',
          100: '#EDEFF4',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(15, 27, 51, 0.06), 0 1px 8px -2px rgba(15, 27, 51, 0.08)',
      },
    },
  },
  plugins: [],
};
