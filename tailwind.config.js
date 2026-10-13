/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#0b5cab",
          600: "#094d92",
          700: "#083e75",
          800: "#07305c",
          900: "#052445",
          cyan: "#0f87fc",
        },
        enterprise: {
          canvas: "#0b0f19",
          surface: "#111925",
          card: "#141e2e",
          header: "#172132",
          border: "#1e2a3e",
        },
      },
    },
  },
  plugins: [],
};
