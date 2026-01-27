/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- EXISTING SEMANTIC TOKENS (Keep these!) ---
        background: "#0f172a", // Slate 900
        surface: "#1e293b",    // Slate 800
        primary: "#fbbf24",    // Oly Gold (Beer/Gold)
        accent: "#3b82f6",     // Blue 500 (Artesian Water)
        'glass-surface': 'rgba(30, 41, 59, 0.7)', // Slate 800 @ 70%
        'glass-border': 'rgba(255, 255, 255, 0.08)',

        // --- NEW BRAND TOKENS (For new components) ---
        // We alias these so we can be specific in the future
        'oly-navy': '#0f172a',
        'oly-gold': '#fbbf24',
        'oly-red': '#ef4444',
      },
      fontFamily: {
        'league': ['Oswald', 'sans-serif'],
        'body': ['Roboto Condensed', 'sans-serif'],
      },
      transitionTimingFunction: {
        'spring-bounce': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'spring-smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      scale: {
        '97': '0.97',
      },
      spacing: {
        'touch': '44px', // "Drunk Thumb" Standard (WSLCB)
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      }
    },
  },
  plugins: [],
}