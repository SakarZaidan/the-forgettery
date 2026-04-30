/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#0a0014",
        bright: "#7df9ff",
        dim: "#4a3a6a",
        crack: "#8b3a62",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
}
