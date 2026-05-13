/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:      "#06060f",
        bg2:     "#0a0b16",
        cyan:    "#00e5ff",
        violet:  "#a855f7",
        amber:   "#f59e0b",
        emerald: "#10b981",
        pink:    "#f472b6",
        danger:  "#ef4444",
        text1:   "#dfe0f0",
        text2:   "#6b7294",
        text3:   "#7a7da6",
        // legacy
        void:  "#06060f",
        dark:  "#1a1a2e",
        wine:  "#6a040f",
        ruby:  "#9d0208",
        red:   "#d00000",
        orange: "#e85d04",
        yellow: "#faa307",
        "bright-yellow": "#ffba08",
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        body:    ["Exo 2", "sans-serif"],
        mono:    ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
