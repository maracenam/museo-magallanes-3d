import type { Pieza } from "@/lib/types";

/**
 * Piezas de demostración, SOLO para ver el diseño en local sin un proyecto
 * de Supabase configurado (ver src/lib/piezas.ts). Son tres fichas reales
 * del Museo Regional de Magallanes tomadas de SURDOC. No tienen modelo 3D
 * asociado, por lo que el visor muestra su estado "no disponible".
 * Nunca se usan en producción.
 */
const SURDOC = "https://www.surdoc.cl";

function demo(
  id: string,
  registro: string,
  imagen: string | null,
  ficha: Record<string, string>,
  creado_en: string
): Pieza {
  return {
    id,
    sketchfab_url: "",
    sketchfab_model_id: "",
    surdoc_url: `${SURDOC}/registro/${registro}`,
    ficha: {
      Institución: "Museo Regional de Magallanes",
      "Número de registro": registro,
      ...ficha,
    },
    imagen_url: imagen ? SURDOC + imagen : null,
    campos_faltantes: [],
    estado: "publicada",
    titulo: null,
    creado_en,
    actualizado_en: creado_en,
  };
}

export const PIEZAS_DEMO: Pieza[] = [
  demo(
    "demo-16-353",
    "16-353",
    "/sites/default/files/styles/large/public/records/images/2025-11/91-382%20Frontal.jpg?itok=OSKglzGZ",
    {
      "Nº de inventario": "91-382",
      Clasificación: "Arte - Artes Visuales",
      Colección: "Dormitorio",
      Objeto: "Escultura",
      Título: "Imagen de María Inmaculada",
      Creador: "Alois Lang",
      "Lugar de creación": "Oberammergau, Alemania.",
      Descripción:
        "Obra exenta. Figura femenina de pie y de frente de color marrón, tiene cabeza levemente inclinada hacia abajo, ambas manos juntas a la altura del pecho, está posada sobre esfera con cabeza de figuras infantiles que en cada extremo tiene dos puntas amarillas. Viste vestido largo con pliegues y capa sosteniendo una punta con el antebrazo izquierdo.",
      "Estado de conservación": "Bueno",
      "Forma de ingreso": "Donación",
      Procedencia: "Familia Braun Menéndez",
      "Fecha de ingreso": "1982-09-29",
    },
    "2026-11-03T12:00:00Z"
  ),
  demo(
    "demo-16-2089",
    "16-2089",
    "/sites/default/files/styles/large/public/records/images/2025-12/23-1332%20frontal.jpg?itok=XrD7mtrx",
    {
      "Nº de inventario": "23-1332",
      Clasificación: "Historia - Utensilios, Herramientas y Equipos",
      Colección: "Grimaldi",
      Objeto: "Boleadora",
      Descripción:
        "Objeto lítico, de forma esférica con una ranura por todo el contorno. De color gris. Esta formaba parte de una boleadora, atándose los tientos o cuerdas en la ranura.",
      "Estado de conservación": "Bueno",
    },
    "2026-11-02T12:00:00Z"
  ),
  demo(
    "demo-16-943",
    "16-943",
    null,
    {
      "Nº de inventario": "AL-161",
      Clasificación:
        "Antropología, Arqueología y Etnografía - Utensilios, Herramientas y Equipos",
      Colección: "Primeros Habitantes",
      Objeto: "Punta de flecha",
      Descripción:
        "Objeto de forma triangular con bordes acerrados, de color rojo con manchas de color beige y negro por ambas caras.",
      "Estado de conservación": "Bueno",
      "Forma de ingreso": "Donación",
    },
    "2026-11-01T12:00:00Z"
  ),
];
