/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0F1117",
        darkCard: "#1A1D27",
        darkBorder: "#2D3245",
        darkHover: "#232736",
        electricViolet: {
          DEFAULT: "#7C3AED",
          hover: "#6D28D9",
          light: "#8B5CF6",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};
