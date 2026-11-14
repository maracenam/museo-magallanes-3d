import type { Pieza } from "@/lib/types";

export function tituloDePieza(pieza: Pieza): string {
  return (
    pieza.titulo ||
    pieza.ficha["Título"] ||
    pieza.ficha["Objeto"] ||
    "Pieza sin título"
  );
}

/** Orden de lectura de la ficha, el mismo criterio que usa SURDOC. */
const ORDEN = [
  "Objeto",
  "Título",
  "Creador",
  "Colección",
  "Clasificación",
  "Lugar de creación",
  "Materiales",
  "Técnica",
  "Dimensiones",
  "Estado de conservación",
  "Procedencia",
  "Forma de ingreso",
  "Fecha de ingreso",
  "Institución",
  "Número de registro",
  "Nº de inventario",
  "Registradores",
];

/** Campos que se muestran aparte o que repiten otros campos. */
const OMITIDOS = new Set(["Descripción", "Adquisición"]);

/**
 * Prepara la ficha para mostrarla: quita las claves duplicadas que deja el
 * prescrapper (p. ej. "InstituciónMuseo Regional de Magallanes", que es la
 * etiqueta pegada a su valor), quita la descripción (se muestra como texto
 * corrido) y ordena los campos.
 */
export function camposDeFicha(
  ficha: Record<string, string>
): [string, string][] {
  const claves = Object.keys(ficha);
  const entradas = Object.entries(ficha).filter(([clave, valor]) => {
    if (!valor?.trim() || OMITIDOS.has(clave)) return false;
    const esPegada = claves.some(
      (otra) => otra !== clave && clave.startsWith(otra)
    );
    return !esPegada;
  });

  const posicion = (clave: string) => {
    const i = ORDEN.indexOf(clave);
    return i === -1 ? ORDEN.length : i;
  };
  return entradas.sort(([a], [b]) => posicion(a) - posicion(b));
}
