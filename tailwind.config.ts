import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#14161A",
          soft: "#4B4841",
          muted: "#8C877E",
          faint: "#B4AEA3",
        },
        paper: {
          DEFAULT: "#FFFFFF",
          soft: "#FAF9F6",
          sunken: "#F4F2ED",
          border: "#E7E3DB",
        },
        accent: {
          DEFAULT: "#2159C5",
          soft: "#EAF0FC",
          hover: "#1B49A3",
        },
        signal: {
          ok: "#1E7A52",
          warn: "#A8412C",
          info: "#5B5750",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,22,26,.04), 0 12px 28px -18px rgba(20,22,26,.18)",
      },
      keyframes: {
        pulse2: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".35" },
        },
      },
      animation: {
        pulse2: "pulse2 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
