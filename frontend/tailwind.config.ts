import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#050713",
        panel: "rgba(15, 23, 42, 0.72)",
        border: "rgba(148, 163, 184, 0.18)",
        success: "#21d07a",
        warning: "#f5a524",
        danger: "#ff5166",
        accent: "#3b82f6"
      },
      boxShadow: {
        glow: "0 0 42px rgba(59, 130, 246, 0.32)",
        success: "0 0 32px rgba(33, 208, 122, 0.24)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Arial", "sans-serif"]
      },
      backgroundImage: {
        "dashboard-grid": "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)"
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "0.58", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.03)" }
        }
      },
      animation: {
        pulseGlow: "pulseGlow 3s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;

