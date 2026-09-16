/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta retirada do mock.pdf (sidebar creme claro, área de conteúdo
        // creme mais fechado, cartões quase brancos).
        cream: {
          50: "#FBF9F4",
          100: "#F5F0E6",
          200: "#EDE4D3",
          300: "#E0D3B8",
        },
        ink: {
          700: "#4A3B2E",
          800: "#3A2E22",
          900: "#2B211B",
        },
        brand: {
          50: "#FBEEE2",
          100: "#F3D9BC",
          300: "#DDA772",
          400: "#CC8A4C",
          500: "#BC7137",
          600: "#A15F2C",
          700: "#824B22",
        },
        muted: {
          400: "#A6997F",
          500: "#8A7B6C",
          600: "#6B5D4F",
          700: "#5B4636",
        },
        // Cinza-quente do terceiro cartão de "novidades" no mock.
        pedra: {
          500: "#6E655B",
          600: "#5E564D",
        },
      },
      fontFamily: {
        serif: ["Source Serif 4", "Georgia", "Cambria", "Times New Roman", "serif"],
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
