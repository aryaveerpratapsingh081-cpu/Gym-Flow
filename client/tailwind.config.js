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
        gym: {
          900: '#0a0d12',
          800: '#121721',
          700: '#1a2232',
          600: '#253047',
          emerald: '#10b981',
          emeraldHover: '#059669',
          accent: '#10b981',
          gold: '#eab308',
          silver: '#94a3b8'
        }
      }
    },
  },
  plugins: [],
}
