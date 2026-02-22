/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./js/**/*.js", "./data/**/*.js"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        emerald: {
          400: "rgb(var(--theme-400) / <alpha-value>)",
          500: "rgb(var(--theme-500) / <alpha-value>)",
          600: "rgb(var(--theme-600) / <alpha-value>)",
          700: "rgb(var(--theme-700) / <alpha-value>)",
          800: "rgb(var(--theme-800) / <alpha-value>)",
          900: "rgb(var(--theme-900) / <alpha-value>)",
          950: "rgb(var(--theme-950) / <alpha-value>)",
        },
        slate: {
          50: "rgb(var(--slate-50) / <alpha-value>)",
          100: "rgb(var(--slate-100) / <alpha-value>)",
          200: "rgb(var(--slate-200) / <alpha-value>)",
          300: "rgb(var(--slate-300) / <alpha-value>)",
          400: "rgb(var(--slate-400) / <alpha-value>)",
          500: "rgb(var(--slate-500) / <alpha-value>)",
          600: "rgb(var(--slate-600) / <alpha-value>)",
          700: "rgb(var(--slate-700) / <alpha-value>)",
          800: "rgb(var(--slate-800) / <alpha-value>)",
          900: "rgb(var(--slate-900) / <alpha-value>)",
          950: "rgb(var(--slate-950) / <alpha-value>)",
        },
      },
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
        quran: ['"KFGQPC Uthmanic Script HAFS Regular"', "Amiri", "serif"],
      },
      animation: {
        "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
