import { NextResponse } from "next/server";
import { errorInterno, errorJson, exigirAdmin, leerJson } from "@/lib/api";
import { validarPieza } from "@/lib/seguridad";

/**
 * GET /api/piezas
 * Panel de administración: lista TODAS las piezas (publicadas y ocultas).
 * Exige sesión de administrador; RLS lo exige también en la base.
 */
export async function GET(request: Request) {
  const acceso = await exigirAdmin(request, { modifica: false });
  if (!acceso.ok) return acceso.respuesta;

  const { data, error } = await acceso.supabase
    .from("piezas")
    .select("*")
    .order("creado_en", { ascending: false });

  if (error) return errorInterno("listar piezas", error);
  return NextResponse.json(
    { piezas: data },
    { headers: { "Cache-Control": "no-store" } }
  );
}

/**
 * POST /api/piezas
 * Guarda una pieza nueva tras la revisión manual de la ficha. Todos los
 * campos se validan (dominios permitidos, formatos y tamaños) antes de
 * llegar a la base.
 */
export async function POST(request: Request) {
  const acceso = await exigirAdmin(request, { modifica: true });
  if (!acceso.ok) return acceso.respuesta;

  const validacion = validarPieza(await leerJson(request), false);
  if (!validacion.ok) return errorJson(validacion.error, 400);
  const datos = validacion.datos;

  const { data, error } = await acceso.supabase
    .from("piezas")
    .insert({
      ...datos,
      imagen_url: datos.imagen_url ?? null,
      campos_faltantes: datos.campos_faltantes ?? [],
      titulo: datos.titulo ?? datos.ficha?.["Título"] ?? null,
      estado: datos.estado ?? "oculta",
    })
    .select()
    .single();

  if (error) return errorInterno("crear pieza", error);
  return NextResponse.json({ pieza: data }, { status: 201 });
}
