/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0b0e14',
          panel: '#11151c',
          card: '#161b24',
          border: '#1f2733',
        },
        accent: {
          DEFAULT: '#4ade80',
          muted: '#22c55e',
        },
        loss: '#ef4444',
        win: '#22c55e',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
