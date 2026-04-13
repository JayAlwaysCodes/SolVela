/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#14F195",
        secondary: "#9945FF",
        dark: "#0F0F1A",
        card: "#1A1A2E",
        border: "#2A2A4A",
      },
    },
  },
  plugins: [],
}