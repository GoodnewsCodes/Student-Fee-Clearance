import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    fontFamily: {
      sans: ["Arial", "Helvetica", "sans-serif"],
      serif: ["Georgia", "serif"],
      mono: ["ui-monospace", "SFMono-Regular", "monospace"],
    },
    fontSize: {
      xs: ["0.8rem", { lineHeight: "1.2rem" }],
      sm: ["0.95rem", { lineHeight: "1.4rem" }],
      base: ["1.1rem", { lineHeight: "1.6rem" }],
      lg: ["1.25rem", { lineHeight: "1.75rem" }],
      xl: ["1.4rem", { lineHeight: "1.9rem" }],
      "2xl": ["1.6rem", { lineHeight: "2.1rem" }],
      "3xl": ["2rem", { lineHeight: "2.5rem" }],
    },
    extend: {
      colors: {
        // Arthur Jarvis ERP Color Scheme - University Colors
        "aj-primary": "#1a237e", // Blue
        "aj-secondary": "#ffa200", // Gold from login screen
        "aj-accent": "#ffa200", // Same gold for consistency
        "aj-background": "#f8fafc",
        "aj-text": "#000000",
        "aj-white": "#ffffff",
        "aj-success": "#10b981",
        "aj-warning": "#ffa200",
        "aj-danger": "#ef4444",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      dropShadow: {
        "aj-logo": [
          "0 4px 8px rgba(255, 162, 0, 0.3)",
          "0 2px 4px rgba(255, 162, 0, 0.2)",
        ],
        "aj-primary": [
          "0 2px 4px rgba(36, 40, 70, 0.11)",
          "0 1px 2px rgba(41, 43, 71, 0.06)",
        ],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
