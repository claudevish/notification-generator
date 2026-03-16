/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        neon: {
          cyan: "#06b6d4",
          magenta: "#d946ef",
          violet: "#8b5cf6",
          blue: "#3b82f6",
        },
      },
      boxShadow: {
        "neon-sm": "0 0 10px rgba(139, 92, 246, 0.15), 0 0 30px rgba(139, 92, 246, 0.05)",
        "neon-md": "0 0 15px rgba(139, 92, 246, 0.2), 0 0 40px rgba(139, 92, 246, 0.08)",
        "neon-lg": "0 0 25px rgba(139, 92, 246, 0.25), 0 0 60px rgba(139, 92, 246, 0.1)",
        "neon-cyan": "0 0 15px rgba(6, 182, 212, 0.2), 0 0 40px rgba(6, 182, 212, 0.08)",
        "neon-magenta": "0 0 15px rgba(217, 70, 239, 0.2), 0 0 40px rgba(217, 70, 239, 0.08)",
        "inner-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.04), inset 0 0 20px rgba(139, 92, 246, 0.03)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-futuristic": "linear-gradient(135deg, rgba(24, 24, 27, 0.9) 0%, rgba(30, 27, 38, 0.8) 50%, rgba(20, 30, 35, 0.9) 100%)",
      },
      animation: {
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "border-flow": "border-flow 4s linear infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        "border-flow": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};
