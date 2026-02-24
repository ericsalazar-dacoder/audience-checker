import type { Config } from "tailwindcss";

const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e3f2fd",
          100: "#bbdefb",
          200: "#90caf9",
          300: "#64b5f6",
          400: "#42a5f5",
          500: "#2196F3", // Globe Blue
          600: "#1e88e5",
          700: "#1976d2",
          800: "#1565c0",
          900: "#0d47a1",
        },
        secondary: {
          50: "#f5f5f5",
          100: "#eeeeee",
          200: "#e0e0e0",
          300: "#bdbdbd",
          400: "#9e9e9e",
          500: "#757575",
          600: "#616161",
          700: "#424242",
          800: "#212121", // Globe Black
          900: "#000000",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
