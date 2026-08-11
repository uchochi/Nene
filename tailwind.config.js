/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        n8n: {
          red: '#ff0c00',
          'red-hover': '#e00a00',
          orange: '#ff6421',
          'orange-light': '#ff8e5d',
          'orange-bright': '#ff9b26',
          dark: '#080808',
          'dark-2': '#0e0918',
          'dark-3': '#1A1624',
          'dark-4': '#1b1728',
          'dark-5': '#272333',
          purple: '#4b397a',
          'purple-light': '#5159d9',
          gray: '#7a7a7a',
          'gray-light': '#a3a3a3',
          'gray-dark': '#464646',
        },
        node: {
          input: '#4CAF50',
          format: '#2196F3',
          tag: '#FF9800',
          group: '#9C27B0',
          translate: '#00BCD4',
          output: '#F44336',
          ai: '#E91E63',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
