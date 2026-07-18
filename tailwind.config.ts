import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ["Nunito Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Outfit", "ui-sans-serif", "system-ui", "sans-serif"],
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
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          text: "hsl(var(--warning-text))",
        },
        "destructive-text": "hsl(var(--destructive-text))",
        "success-text": "hsl(var(--success-text))",
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          border: "hsl(var(--sidebar-border))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        // Escala 50–950 por matiz da marca TEAR. DEFAULT = hex oficial do
        // manual, então classes legadas (bg-brand-blue-light, etc.) seguem
        // válidas; a escala destrava fundos sutis, bordas e data-viz rica.
        brand: {
          "blue-dark": {
            DEFAULT: "#001F6B",
            50: "#E8EDFA",
            100: "#C9D5F2",
            200: "#93A8E0",
            300: "#5E7BCE",
            400: "#2E50B0",
            500: "#0A2E8C",
            600: "#001F6B",
            700: "#001A5A",
            800: "#001242",
            900: "#000B2A",
            950: "#00071A",
          },
          "blue-light": {
            DEFAULT: "#1E88FF",
            50: "#EAF3FF",
            100: "#D2E6FF",
            200: "#A6CCFF",
            300: "#74AEFF",
            400: "#4A9BFF",
            500: "#1E88FF",
            600: "#006FE6",
            700: "#0057B4",
            800: "#004488",
            900: "#00305F",
            950: "#001E3D",
          },
          yellow: {
            DEFAULT: "#FFC400",
            50: "#FFF9E6",
            100: "#FFF0BF",
            200: "#FFE280",
            300: "#FFD445",
            400: "#FFCC1A",
            500: "#FFC400",
            600: "#E0AC00",
            700: "#B38800",
            800: "#806200",
            900: "#5C4600",
            950: "#3D2F00",
          },
          red: {
            DEFAULT: "#FF2D2D",
            50: "#FFECEC",
            100: "#FFD4D4",
            200: "#FFA8A8",
            300: "#FF7B7B",
            400: "#FF5454",
            500: "#FF2D2D",
            600: "#E60000",
            700: "#B40000",
            800: "#800000",
            900: "#5C0000",
            950: "#3D0000",
          },
          cyan: {
            DEFAULT: "#45C7FF",
            50: "#ECF9FF",
            100: "#D0F0FF",
            200: "#A1E2FF",
            300: "#72D4FF",
            400: "#45C7FF",
            500: "#1AB6FF",
            600: "#008FD6",
            700: "#006CA3",
            800: "#004C73",
            900: "#003049",
            950: "#001E2E",
          },
        },
      },
      fontSize: {
        // Escala tipográfica nomeada (peso + line-height + tracking embutidos).
        display: ["3.5rem", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "800" }],
        h1: ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "800" }],
        h2: ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.01em", fontWeight: "700" }],
        h3: ["1.125rem", { lineHeight: "1.4", letterSpacing: "-0.01em", fontWeight: "700" }],
        h4: ["1rem", { lineHeight: "1.45", letterSpacing: "-0.005em", fontWeight: "600" }],
        body: ["0.9375rem", { lineHeight: "1.55" }],
        caption: ["0.8125rem", { lineHeight: "1.4", fontWeight: "500" }],
        overline: ["0.6875rem", { lineHeight: "1", letterSpacing: "0.16em", fontWeight: "700" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgb(0 31 107 / 0.04), 0 4px 16px -2px rgb(0 31 107 / 0.08)",
        elevated:
          "0 4px 12px -2px rgb(0 31 107 / 0.10), 0 16px 48px -8px rgb(0 31 107 / 0.16)",
        glow: "0 8px 32px -4px rgb(30 136 255 / 0.35)",
        "glow-cyan": "0 8px 24px -6px rgb(69 199 255 / 0.45)",
        "glow-yellow": "0 8px 24px -6px rgb(255 196 0 / 0.40)",
        "glow-red": "0 8px 24px -6px rgb(255 45 45 / 0.35)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #001F6B 0%, #1E88FF 100%)",
        "brand-radial":
          "radial-gradient(120% 120% at 0% 0%, #0A2A80 0%, #001F6B 55%, #001545 100%)",
        // Hero do dashboard: base navy + auroras suaves nas cores da marca.
        "hero-aurora":
          "radial-gradient(70rem 32rem at 108% -12%, rgb(69 199 255 / 0.20) 0%, transparent 55%), radial-gradient(52rem 26rem at -8% 118%, rgb(30 136 255 / 0.28) 0%, transparent 58%), radial-gradient(36rem 20rem at 82% 112%, rgb(255 196 0 / 0.07) 0%, transparent 60%), radial-gradient(120% 120% at 0% 0%, #0A2A80 0%, #001F6B 55%, #001545 100%)",
        // Sidebar: mesmo navy com aurora ciano discreta no rodapé.
        "sidebar-aurora":
          "radial-gradient(30rem 22rem at 120% 104%, rgb(69 199 255 / 0.13) 0%, transparent 60%), radial-gradient(24rem 16rem at -30% -6%, rgb(30 136 255 / 0.20) 0%, transparent 55%), radial-gradient(120% 120% at 0% 0%, #0A2A80 0%, #001F6B 55%, #001545 100%)",
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
