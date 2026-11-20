import { cache } from "react";
import { crearClienteServidor } from "@/lib/supabase/server";
import { PIEZAS_DEMO } from "@/lib/demo";
import { tituloDePieza } from "@/lib/ficha";
import {
  esIdSketchfab,
  esUrlImagen,
  esUrlSurdoc,
  esUuid,
  limpiarBusqueda,
} from "@/lib/seguridad";
import type { Pieza } from "@/lib/types";

/**
 * Modo demostración: solo en desarrollo y solo si no hay Supabase
 * configurado (.env.local ausente). Permite revisar el diseño en local.
 * En producción nunca se activa.
 */
const MODO_DEMO =
  process.env.NODE_ENV !== "production" &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL;

/** Columnas que necesita el sitio público (nada más sale de la base). */
const COLUMNAS_PUBLICAS =
  "id, sketchfab_model_id, surdoc_url, ficha, imagen_url, titulo, estado, creado_en";

/**
 * Última barrera antes de mostrar una pieza: aunque un dato inválido
 * llegara a la base, nunca se pinta un enlace, imagen o iframe que no
 * apunte a los dominios esperados (evita XSS con javascript: y similares).
 */
function sanear(pieza: Pieza): Pieza {
  const ficha: Record<string, string> = {};
  if (pieza.ficha && typeof pieza.ficha === "object") {
    for (const [clave, valor] of Object.entries(pieza.ficha)) {
      if (typeof valor === "string") ficha[clave] = valor;
    }
  }
  return {
    ...pieza,
    ficha,
    titulo: typeof pieza.titulo === "string" ? pieza.titulo : null,
    imagen_url: esUrlImagen(pieza.imagen_url) ? pieza.imagen_url : null,
    surdoc_url: esUrlSurdoc(pieza.surdoc_url) ? pieza.surdoc_url : "",
    sketchfab_model_id: esIdSketchfab(pieza.sketchfab_model_id)
      ? pieza.sketchfab_model_id
      : "",
  };
}

/** Cuántas piezas muestra cada página del catálogo público. */
export const PIEZAS_POR_PAGINA = 15;

export interface PaginaDePiezas {
  piezas: Pieza[];
  /** Total de piezas que cumplen la búsqueda, sumando todas las páginas. */
  total: number;
  /** Página entregada (1 = primera), ya ajustada al rango válido. */
  pagina: number;
  /** Cantidad de páginas; como mínimo 1. */
  paginas: number;
}

/** Convierte ?pagina= en un entero ≥ 1 (cualquier otra cosa es la 1). */
export function leerPagina(valor: unknown): number {
  const n = typeof valor === "string" ? Number.parseInt(valor, 10) : NaN;
  return Number.isSafeInteger(n) && n >= 1 ? n : 1;
}

/** Si piden una página más allá de la última, se entrega la última. */
function ajustarPagina(pagina: number, total: number) {
  const paginas = Math.max(1, Math.ceil(total / PIEZAS_POR_PAGINA));
  return { pagina: Math.min(Math.max(1, pagina), paginas), paginas };
}

/**
 * Una página del catálogo: piezas publicadas, de la más nueva a la más
 * antigua, opcionalmente filtradas por título. Solo se traen de la base
 * las piezas de esa página, para que el catálogo cargue igual de rápido
 * con 15 piezas que con 1.500.
 */
export async function listarPiezasPublicadas(
  q?: string,
  paginaPedida = 1
): Promise<PaginaDePiezas> {
  const termino = limpiarBusqueda(q);

  if (MODO_DEMO) {
    const t = termino?.toLocaleLowerCase("es");
    const todas = t
      ? PIEZAS_DEMO.filter((p) =>
          tituloDePieza(p).toLocaleLowerCase("es").includes(t)
        )
      : PIEZAS_DEMO;
    const { pagina, paginas } = ajustarPagina(paginaPedida, todas.length);
    const desde = (pagina - 1) * PIEZAS_POR_PAGINA;
    return {
      piezas: todas.slice(desde, desde + PIEZAS_POR_PAGINA).map(sanear),
      total: todas.length,
      pagina,
      paginas,
    };
  }

  const supabase = await crearClienteServidor();
  // Se escapan los comodines de LIKE para buscar el texto literal.
  const patron = termino
    ? `%${termino.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
    : null;

  // 1) Cuántas hay en total (sin traer filas), para conocer la última
  //    página antes de pedir un rango que podría no existir.
  // Sin sesión de administrador: RLS solo entrega piezas "publicada".
  let conteo = supabase
    .from("piezas")
    .select("id", { count: "exact", head: true })
    .eq("estado", "publicada");
  if (patron) conteo = conteo.ilike("titulo", patron);

  const { count, error: errorConteo } = await conteo;
  if (errorConteo) {
    console.error("[publico] contar piezas:", errorConteo.message);
  }
  const total = count ?? 0;
  const { pagina, paginas } = ajustarPagina(paginaPedida, total);
  if (total === 0) return { piezas: [], total, pagina, paginas };

  // 2) Solo las filas de la página pedida. El segundo orden (id) hace que
  //    el orden sea estable aunque dos piezas tengan la misma fecha, así
  //    ninguna se repite ni se salta entre páginas.
  const desde = (pagina - 1) * PIEZAS_POR_PAGINA;
  let consulta = supabase
    .from("piezas")
    .select(COLUMNAS_PUBLICAS)
    .eq("estado", "publicada")
    .order("creado_en", { ascending: false })
    .order("id", { ascending: true })
    .range(desde, desde + PIEZAS_POR_PAGINA - 1);
  if (patron) consulta = consulta.ilike("titulo", patron);

  const { data, error } = await consulta;
  if (error) console.error("[publico] listar piezas:", error.message);
  return {
    piezas: ((data ?? []) as unknown as Pieza[]).map(sanear),
    total,
    pagina,
    paginas,
  };
}

/** Una pieza publicada; null si no existe, está oculta o el id no es válido. */
export const obtenerPiezaPublicada = cache(
  async (id: string): Promise<Pieza | null> => {
    if (MODO_DEMO) {
      const pieza = PIEZAS_DEMO.find((p) => p.id === id);
      return pieza ? sanear(pieza) : null;
    }
    if (!esUuid(id)) return null;

    const supabase = await crearClienteServidor();
    const { data, error } = await supabase
      .from("piezas")
      .select(COLUMNAS_PUBLICAS)
      .eq("id", id)
      .eq("estado", "publicada") // el público solo ve piezas publicadas
      .maybeSingle();
    if (error) console.error("[publico] leer pieza:", error.message);
    return data ? sanear(data as unknown as Pieza) : null;
  }
);
