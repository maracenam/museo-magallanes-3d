import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { crearClienteServidor } from "@/lib/supabase/server";
import { LIMITES } from "@/lib/seguridad";

export function errorJson(mensaje: string, status: number) {
  return NextResponse.json(
    { error: mensaje },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

/**
 * Error interno: el detalle se registra en el servidor y el navegador
 * recibe un mensaje genérico (no se filtran detalles de la base de datos).
 */
export function errorInterno(contexto: string, detalle: unknown) {
  console.error(`[api] ${contexto}:`, detalle);
  return errorJson("Ocurrió un error en el servidor. Inténtalo de nuevo.", 500);
}

/**
 * Defensa contra CSRF para peticiones que modifican datos: la petición
 * debe venir del mismo origen y declarar JSON (un formulario de otro
 * sitio no puede enviar application/json sin pasar por CORS).
 */
function esPeticionMismoOrigen(request: Request): boolean {
  const origen = request.headers.get("origin");
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origen || !host) return false;
  try {
    return new URL(origen).host === host;
  } catch {
    return false;
  }
}

type Acceso =
  | { ok: true; supabase: SupabaseClient }
  | { ok: false; respuesta: NextResponse };

/**
 * Exige una sesión válida de un administrador del museo. Además de la
 * sesión, consulta la función es_admin() de la base (lista blanca en la
 * tabla `administradores`). Si la función no existe o falla, se niega el
 * acceso (falla cerrado).
 */
export async function exigirAdmin(
  request: Request,
  { modifica }: { modifica: boolean }
): Promise<Acceso> {
  if (modifica) {
    if (!esPeticionMismoOrigen(request)) {
      return { ok: false, respuesta: errorJson("Origen no permitido.", 403) };
    }
    const tipo = request.headers.get("content-type") ?? "";
    if (request.method !== "DELETE" && !tipo.startsWith("application/json")) {
      return { ok: false, respuesta: errorJson("Se esperaba JSON.", 415) };
    }
  }

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, respuesta: errorJson("No autorizado.", 401) };
  }

  const { data: esAdmin, error } = await supabase.rpc("es_admin");
  if (error || esAdmin !== true) {
    if (error) console.error("[api] es_admin:", error.message);
    return { ok: false, respuesta: errorJson("No tienes permiso.", 403) };
  }

  return { ok: true, supabase };
}

/** Lee el cuerpo JSON con un límite de tamaño. */
export async function leerJson(request: Request): Promise<unknown> {
  const largo = Number(request.headers.get("content-length") ?? 0);
  if (largo > LIMITES.cuerpoJson) return null;
  const texto = await request.text().catch(() => "");
  if (!texto || texto.length > LIMITES.cuerpoJson) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}
