/**
 * Validaciones de seguridad compartidas por las rutas de API, el
 * prescrapper y las páginas públicas. Todo dato que venga del navegador
 * o de un sitio externo pasa por aquí antes de guardarse o mostrarse.
 */

const HOSTS_SURDOC = new Set(["surdoc.cl", "www.surdoc.cl"]);
const HOSTS_SKETCHFAB = new Set(["sketchfab.com", "www.sketchfab.com"]);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID_SKETCHFAB = /^[0-9a-f]{32}$/i;

export const LIMITES = {
  busqueda: 100,
  url: 2048,
  titulo: 300,
  camposFicha: 80,
  claveFicha: 120,
  valorFicha: 5000,
  camposFaltantes: 50,
  cuerpoJson: 200_000, // bytes
} as const;

function parsearHttps(valor: unknown): URL | null {
  if (typeof valor !== "string" || valor.length > LIMITES.url) return null;
  try {
    const url = new URL(valor.trim());
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

/** Enlace a una ficha de SURDOC: solo https://surdoc.cl o www.surdoc.cl. */
export function esUrlSurdoc(valor: unknown): valor is string {
  const url = parsearHttps(valor);
  return !!url && HOSTS_SURDOC.has(url.hostname) && !url.port;
}

/** Enlace a un modelo de Sketchfab. */
export function esUrlSketchfab(valor: unknown): valor is string {
  const url = parsearHttps(valor);
  return !!url && HOSTS_SKETCHFAB.has(url.hostname) && !url.port;
}

/** Origen del proyecto de Supabase configurado (para Storage). */
function hostSupabase(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
}

/** Fotografía: solo imágenes servidas por SURDOC o por el Supabase propio. */
export function esUrlImagen(valor: unknown): valor is string {
  const url = parsearHttps(valor);
  if (!url || url.port) return false;
  return HOSTS_SURDOC.has(url.hostname) || url.hostname === hostSupabase();
}

export function esIdSketchfab(valor: unknown): valor is string {
  return typeof valor === "string" && ID_SKETCHFAB.test(valor);
}

export function esUuid(valor: unknown): valor is string {
  return typeof valor === "string" && UUID.test(valor);
}

/**
 * Extrae el ID (32 caracteres hexadecimales) de un enlace de Sketchfab,
 * p. ej. https://sketchfab.com/3d-models/boleadora-0123...cdef
 */
export function extraerIdSketchfab(valor: unknown): string | null {
  if (!esUrlSketchfab(valor)) return null;
  const coincidencias = new URL(valor).pathname.match(/[0-9a-f]{32}/gi);
  return coincidencias ? coincidencias[coincidencias.length - 1] : null;
}

/** Recorta y limpia el término de búsqueda pública. */
export function limpiarBusqueda(valor: unknown): string | undefined {
  if (typeof valor !== "string") return undefined;
  const limpio = valor.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  return limpio ? limpio.slice(0, LIMITES.busqueda) : undefined;
}

// ---------------------------------------------------------------------
// Validación del cuerpo de las piezas (POST y PUT)
// ---------------------------------------------------------------------

export interface DatosPieza {
  sketchfab_url?: string;
  sketchfab_model_id?: string;
  surdoc_url?: string;
  ficha?: Record<string, string>;
  imagen_url?: string | null;
  campos_faltantes?: string[];
  titulo?: string | null;
  estado?: "publicada" | "oculta";
}

type Resultado = { ok: true; datos: DatosPieza } | { ok: false; error: string };

function validarFicha(valor: unknown): Record<string, string> | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return null;
  const entradas = Object.entries(valor as Record<string, unknown>);
  if (entradas.length > LIMITES.camposFicha) return null;

  const ficha: Record<string, string> = {};
  for (const [clave, texto] of entradas) {
    if (
      typeof texto !== "string" ||
      !clave.trim() ||
      clave.length > LIMITES.claveFicha ||
      texto.length > LIMITES.valorFicha ||
      clave === "__proto__" ||
      clave === "constructor" ||
      clave === "prototype"
    ) {
      return null;
    }
    ficha[clave] = texto;
  }
  return ficha;
}

/**
 * Valida y normaliza los datos de una pieza. Con `parcial` (PUT) solo se
 * validan los campos presentes; sin él (POST) se exigen los obligatorios.
 * Cualquier campo no listado aquí se descarta.
 */
export function validarPieza(cuerpo: unknown, parcial: boolean): Resultado {
  if (!cuerpo || typeof cuerpo !== "object" || Array.isArray(cuerpo)) {
    return { ok: false, error: "Cuerpo inválido." };
  }
  const b = cuerpo as Record<string, unknown>;
  const datos: DatosPieza = {};
  const presente = (campo: string) => campo in b && b[campo] !== undefined;

  if (!parcial) {
    for (const campo of [
      "sketchfab_url",
      "sketchfab_model_id",
      "surdoc_url",
      "ficha",
    ]) {
      if (!presente(campo)) {
        return {
          ok: false,
          error: "Faltan datos obligatorios para guardar la pieza.",
        };
      }
    }
  }

  if (presente("sketchfab_url")) {
    if (!esUrlSketchfab(b.sketchfab_url)) {
      return { ok: false, error: "El enlace de Sketchfab no es válido." };
    }
    datos.sketchfab_url = b.sketchfab_url;
  }
  if (presente("sketchfab_model_id")) {
    if (!esIdSketchfab(b.sketchfab_model_id)) {
      return {
        ok: false,
        error: "El ID del modelo de Sketchfab no es válido.",
      };
    }
    datos.sketchfab_model_id = b.sketchfab_model_id.toLowerCase();
  }
  if (presente("surdoc_url")) {
    if (!esUrlSurdoc(b.surdoc_url)) {
      return {
        ok: false,
        error: "El enlace debe ser una ficha de https://www.surdoc.cl.",
      };
    }
    datos.surdoc_url = b.surdoc_url;
  }
  if (presente("ficha")) {
    const ficha = validarFicha(b.ficha);
    if (!ficha) return { ok: false, error: "La ficha técnica no es válida." };
    datos.ficha = ficha;
  }
  if (presente("imagen_url")) {
    if (b.imagen_url === null || b.imagen_url === "") {
      datos.imagen_url = null;
    } else if (esUrlImagen(b.imagen_url)) {
      datos.imagen_url = b.imagen_url;
    } else {
      return {
        ok: false,
        error:
          "La fotografía debe ser una imagen https de SURDOC o del almacenamiento del museo.",
      };
    }
  }
  if (presente("campos_faltantes")) {
    const lista = b.campos_faltantes;
    if (
      !Array.isArray(lista) ||
      lista.length > LIMITES.camposFaltantes ||
      !lista.every(
        (c) => typeof c === "string" && c.length <= LIMITES.claveFicha
      )
    ) {
      return { ok: false, error: "La lista de campos faltantes no es válida." };
    }
    datos.campos_faltantes = lista as string[];
  }
  if (presente("titulo")) {
    if (b.titulo === null || b.titulo === "") {
      datos.titulo = null;
    } else if (
      typeof b.titulo === "string" &&
      b.titulo.length <= LIMITES.titulo
    ) {
      datos.titulo = b.titulo.trim();
    } else {
      return {
        ok: false,
        error: `El título admite hasta ${LIMITES.titulo} caracteres.`,
      };
    }
  }
  if (presente("estado")) {
    if (b.estado !== "publicada" && b.estado !== "oculta") {
      return { ok: false, error: "Estado inválido." };
    }
    datos.estado = b.estado;
  }

  if (parcial && Object.keys(datos).length === 0) {
    return { ok: false, error: "No hay cambios que guardar." };
  }
  return { ok: true, datos };
}
