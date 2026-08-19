import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        abyss: {
          950: "#050b14",
          900: "#0a1420",
          800: "#0f1e2e",
          700: "#16293d",
          600: "#1f374f",
        },
        tide: {
          in: "#22c55e",
          out: "#f97316",
          slack: "#64748b",
        },
        score: {
          low: "#ef4444",
          mid: "#eab308",
          high: "#22c55e",
        },
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(34,197,94,0.35)",
      },
      backgroundImage: {
        "depth-gradient":
          "radial-gradient(circle at 50% 0%, #16293d 0%, #0a1420 45%, #050b14 100%)",
      },
      keyframes: {
        pulseSlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        "pulse-slow": "pulseSlow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
