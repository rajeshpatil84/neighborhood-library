/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body: ["'DM Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        ink: {
          DEFAULT: "#1a1a2e",
          light: "#2d2d44",
        },
        parchment: {
          DEFAULT: "#f5f0e8",
          dark: "#e8e0d0",
        },
        amber: {
          library: "#c8962c",
        },
        sage: "#4a7c59",
        crimson: "#c0392b",
      },
    },
  },
  plugins: [],
};
