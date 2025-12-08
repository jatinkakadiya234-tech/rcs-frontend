/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        palette: {
          bg: '#FAF9EE',
          accent: '#A2AF9B',
          border: '#DCCFC0',
          muted: '#EEEEEE',
          text: '#1F2937',
        },
      },
    },
  },
}


