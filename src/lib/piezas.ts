import { cache } from "react";
import { crearClienteServidor } from "@/lib/supabase/server";
import { PIEZAS_DEMO } from "@/lib/demo";
import { tituloDePieza } from "@/lib/ficha";
import type { Pieza } from "@/lib/types";

/**
 * Modo demostración: solo en desarrollo y solo si no hay Supabase
 * configurado (.env.local ausente). Permite revisar el diseño en local.
 * En producción nunca se activa.
 */
const MODO_DEMO =
  process.env.NODE_ENV !== "production" &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL;

/** Piezas publicadas, opcionalmente filtradas por título. */
export async function listarPiezasPublicadas(q?: string): Promise<Pieza[]> {
  const termino = q?.trim();

  if (MODO_DEMO) {
    const t = termino?.toLocaleLowerCase("es");
    return t
      ? PIEZAS_DEMO.filter((p) =>
          tituloDePieza(p).toLocaleLowerCase("es").includes(t)
        )
      : PIEZAS_DEMO;
  }

  const supabase = await crearClienteServidor();
  // Sin sesión de administrador: RLS solo entrega piezas "publicada".
  let consulta = supabase
    .from("piezas")
    .select("*")
    .eq("estado", "publicada")
    .order("creado_en", { ascending: false });

  if (termino) {
    // Se escapan los comodines de LIKE para buscar el texto literal.
    const literal = termino.replace(/[\\%_]/g, (c) => `\\${c}`);
    consulta = consulta.ilike("titulo", `%${literal}%`);
  }

  const { data } = await consulta;
  return (data ?? []) as Pieza[];
}

/** Una pieza publicada; null si no existe o está oculta. */
export const obtenerPiezaPublicada = cache(
  async (id: string): Promise<Pieza | null> => {
    if (MODO_DEMO) return PIEZAS_DEMO.find((p) => p.id === id) ?? null;

    const supabase = await crearClienteServidor();
    const { data } = await supabase
      .from("piezas")
      .select("*")
      .eq("id", id)
      .eq("estado", "publicada") // el público solo ve piezas publicadas
      .maybeSingle<Pieza>();
    return data;
  }
);
