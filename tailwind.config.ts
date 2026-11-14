import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        museo: {
          // Paleta institucional interna (panel de administración)
          oscuro: "#1B3A4B",
          medio: "#2E5D73",
          dorado: "#B08D57",
          crema: "#F2EFEA",
          texto: "#1A1A1A",
          fondo: "#FFFDFB",

          // Sistema del sitio oficial museodemagallanes.gob.cl, medido con
          // getComputedStyle sobre /colecciones. Lo usa el sitio público.
          cuerpo: "#4A4A4A", // texto de párrafos
          tinta: "#000000", // títulos, enlaces de tarjeta, botón primario
          suave: "#6B6B6B", // texto secundario (el sitio usa #8A8A8A; se
          //                   oscurece para cumplir contraste AA a 12px)
          linea: "#DEDEDE", // separadores y bordes finos
          borde: "#6A6A6A", // borde de campos de formulario
          superficie: "#F3F3F3", // fondo neutro bajo las fotografías
          negro: "#000000", // barra de navegación y pie de página
          acento: "#E0701E", // línea bajo el título y estados activos
          acentoClaro: "#FFA11B", // avisos
          flagAzul: "#0F69B5",
          flagRojo: "#EB3D45",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        sitio: "1172px",
      },
    },
  },
  plugins: [],
};

export default config;
