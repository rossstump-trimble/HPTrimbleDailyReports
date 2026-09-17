import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
        "3xl": "2000px",
        "4xl": "3000px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-roboto)", "var(--font-montserrat)", "sans-serif"],
        roboto: ["var(--font-roboto)", "sans-serif"],
      },
      colors: {
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
        "trimble-blue-dark": "#004f83",
        "trimble-blue": "#0063a3",
        "trimble-yellow": "#fbad26",
        "trimble-green": "#349c44",
        "trimble-red": "#b44e2a",
        "trimble-gray": "#252a2e",
        "gray-light": "#f1f1f6",
        "gray-0": "#e0e1e9",
        "gray-1": "#cbcdd6",
        "gray-2": "#b7b9c3",
        "gray-3": "#a3a6b1",
        "gray-4": "#90939f",
        "gray-5": "#7d808d",
        "gray-6": "#6a6e79",
        "gray-7": "#585c65",
        "gray-8": "#464b52",
        "gray-9": "#353a40",
        "gray-10": "#171c1e",
        "tc-blue": "hsl(var(--tc-blue))",
        "tc-blue-hover": "hsl(var(--tc-blue-hover))",
        "tc-secondary": "hsl(var(--tc-secondary))",
        "tc-secondary-hover": "hsl(var(--tc-secondary-hover))",
        "tc-secondary-toolbar": "hsl(var(--tc-secondary-toolbar))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        shine: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "gradient-xy": {
          "0%, 100%": {
            "background-size": "400% 400%",
            "background-position": "left center",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
          },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
          },
          "100%": {
            opacity: "1",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "gradient-xy": "gradient-xy 3s linear infinite",
        shine: "shine 8s ease-in-out infinite",
        "fade-in": "fade-in 0.5s ease-in-out",
      },
      boxShadow: {
        "1": "0 1px 4px 1px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.16)",
        "2": "0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)",
        "3": "0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)",
        "4": "0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)",
        "5": "0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)",
      },
      fontSize: {
        lead: "1.25rem",
        card: "1rem",
        "card-2": "0.75rem",
      },
      screens: {
        "2xl": "1400px",
        "3xl": "2000px",
        "4xl": "3000px",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;

export default config;
