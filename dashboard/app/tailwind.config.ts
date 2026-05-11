import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Okabe-Ito palette + neutrals (see dashboard/build/07_accessibility.md)
        ink: {
          DEFAULT: "#1F1F1F",
          muted: "#8C8C8C",
          grid: "#D9D9D9",
          soft: "#F4F4F5",
        },
        accent: {
          blue: "#0072B2",
          orange: "#E69F00",
        },
        state: {
          stable: "#56B4E9",
          watch: "#E69F00",
          critical: "#D55E00",
          insufficient: "#999999",
        },
        equity: {
          fast: "#0072B2",
          slow: "#D55E00",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      fontSize: {
        kpi: ["28px", { lineHeight: "1.1", fontWeight: "700" }],
        "kpi-label": ["12px", { lineHeight: "1.2" }],
      },
      maxWidth: {
        canvas: "1440px",
      },
    },
  },
  plugins: [],
};

export default config;
