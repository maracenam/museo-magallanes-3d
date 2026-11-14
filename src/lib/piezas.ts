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

/** Piezas publicadas, opcionalmente filtradas por título. */
export async function listarPiezasPublicadas(q?: string): Promise<Pieza[]> {
  const termino = limpiarBusqueda(q);

  if (MODO_DEMO) {
    const t = termino?.toLocaleLowerCase("es");
    return (
      t
        ? PIEZAS_DEMO.filter((p) =>
            tituloDePieza(p).toLocaleLowerCase("es").includes(t)
          )
        : PIEZAS_DEMO
    ).map(sanear);
  }

  const supabase = await crearClienteServidor();
  // Sin sesión de administrador: RLS solo entrega piezas "publicada".
  let consulta = supabase
    .from("piezas")
    .select(COLUMNAS_PUBLICAS)
    .eq("estado", "publicada")
    .order("creado_en", { ascending: false });

  if (termino) {
    // Se escapan los comodines de LIKE para buscar el texto literal.
    const literal = termino.replace(/[\\%_]/g, (c) => `\\${c}`);
    consulta = consulta.ilike("titulo", `%${literal}%`);
  }

  const { data, error } = await consulta;
  if (error) console.error("[publico] listar piezas:", error.message);
  return ((data ?? []) as unknown as Pieza[]).map(sanear);
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
