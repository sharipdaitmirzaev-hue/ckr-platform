import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--ckr-bg)",
        foreground: "var(--ckr-fg)",
        muted: "var(--ckr-muted)",
        accent: {
          DEFAULT: "var(--ckr-accent)",
          muted: "var(--ckr-accent-muted)",
        },
        surface: {
          DEFAULT: "var(--ckr-surface)",
          elevated: "var(--ckr-surface-elevated)",
        },
        border: "var(--ckr-border)",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "sans-serif"],
        display: ["var(--font-onest)", "var(--font-manrope)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 80px var(--ckr-accent-glow)",
      },
      backgroundImage: {
        "hero-grid":
          "linear-gradient(to right, var(--ckr-grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--ckr-grid-line) 1px, transparent 1px)",
        "hero-radial":
          "radial-gradient(ellipse 70% 55% at 70% 20%, var(--ckr-accent-muted), transparent 55%), radial-gradient(ellipse 50% 40% at 15% 80%, var(--ckr-surface-deep), transparent 60%)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "line-draw": {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out both",
        "fade-in": "fade-in 0.8s ease-out both",
        "line-draw": "line-draw 0.9s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
