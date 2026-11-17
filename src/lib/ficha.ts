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
  "Técnica / Material",
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

/**
 * Campos que no se listan en la ficha pública: se muestran aparte
 * ("Descripción"), repiten otros campos ("Adquisición") o son datos de
 * gestión interna ("Ubicación", p. ej. "En depósito"). Siguen guardados y
 * visibles en el panel.
 */
const OMITIDOS = new Set(["Descripción", "Adquisición", "Ubicación"]);

const normalizar = (texto: string) => texto.replace(/\s+/g, " ").trim();

/**
 * Quita de una ficha los campos que solo repiten información de otros.
 * Se usa al leer SURDOC y al abrir una pieza en el panel, para que los
 * duplicados no lleguen a guardarse (camposDeFicha, más abajo, solo los
 * oculta al mostrar).
 *
 * SURDOC agrupa datos (por ejemplo "Adquisición" contiene "Forma de
 * ingreso", "Procedencia" y "Fecha de ingreso"), y al leer la página el
 * grupo puede terminar como un campo más, con todo el texto pegado. Se
 * descartan:
 *  - campos cuya etiqueta es otra etiqueta seguida de su valor
 *    ("Forma de ingreso Donación" = "Donación");
 *  - campos cuyo valor es la suma de dos o más campos que ya existen
 *    ("Adquisición" = "Forma de ingreso Donación Procedencia ...").
 *
 * También normaliza los espacios de las etiquetas. No modifica los
 * valores ni descarta campos vacíos (el panel los usa mientras se editan).
 */
export function limpiarFicha(
  ficha: Record<string, string>
): Record<string, string> {
  const base: Record<string, string> = {};
  for (const [clave, valor] of Object.entries(ficha)) {
    const etiqueta = normalizar(clave);
    if (!etiqueta) continue;
    if (!(etiqueta in base) || !base[etiqueta]) base[etiqueta] = valor;
  }

  const claves = Object.keys(base);
  const par = (clave: string) => `${clave} ${normalizar(base[clave])}`;
  const conValor = (clave: string) => normalizar(base[clave]) !== "";

  return Object.fromEntries(
    Object.entries(base).filter(([clave, valor]) => {
      const otras = claves.filter((otra) => otra !== clave && conValor(otra));

      if (otras.some((otra) => clave === par(otra))) return false;

      const texto = normalizar(valor);
      const repetidos = otras.filter((otra) => texto.includes(par(otra)));
      return repetidos.length < 2;
    })
  );
}

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
