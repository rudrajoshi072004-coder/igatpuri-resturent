/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1d3557",
        secondary: "#457b9d",
        accent: "#e63946",
        light: "#f1faee",
      }
    },
  },
  plugins: [],
}
