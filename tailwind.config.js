/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#18392D',
          hover: '#122b22',
          light: '#245241',
          subtle: '#e8efe9',
        },
        sage: {
          DEFAULT: '#C8D3C5',
          light: '#E5EBE3',
          dark: '#9EAF99',
        },
        parchment: {
          DEFAULT: '#F4F0E5',
          light: '#FAF8F3',
          dark: '#E8E1D1',
        },
        waypost: {
          bg: '#F4F0E5',
          forest: '#18392D',
          sage: '#C8D3C5',
          text: '#242923',
          muted: '#73776F',
          card: '#FFFFFF',
          cardWarm: '#FAF7F0',
          border: '#DED8C7',
          borderLight: '#E8E3D5',
        },
        primaryText: '#242923',
        secondaryText: '#73776F',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
      },
      boxShadow: {
        'card': '0 2px 8px -2px rgba(24, 57, 45, 0.08), 0 1px 3px 0 rgba(24, 57, 45, 0.04)',
        'elevated': '0 10px 25px -5px rgba(24, 57, 45, 0.12), 0 8px 10px -6px rgba(24, 57, 45, 0.08)',
        'sheet': '0 -4px 20px -2px rgba(24, 57, 45, 0.1)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.22s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
};
