import { NextResponse } from "next/server";
import { errorInterno, errorJson, exigirAdmin, leerJson } from "@/lib/api";
import { esUuid, validarPieza } from "@/lib/seguridad";

interface Contexto {
  params: Promise<{ id: string }>;
}

/** GET /api/piezas/:id — detalle para el panel de administración. */
export async function GET(request: Request, { params }: Contexto) {
  const { id } = await params;
  const acceso = await exigirAdmin(request, { modifica: false });
  if (!acceso.ok) return acceso.respuesta;
  if (!esUuid(id)) return errorJson("Pieza no encontrada.", 404);

  const { data, error } = await acceso.supabase
    .from("piezas")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return errorInterno("leer pieza", error);
  if (!data) return errorJson("Pieza no encontrada.", 404);
  return NextResponse.json(
    { pieza: data },
    { headers: { "Cache-Control": "no-store" } }
  );
}

/**
 * PUT /api/piezas/:id
 * Edita la ficha o cambia el estado publicada/oculta. Solo se aceptan los
 * campos de la pieza, ya validados.
 */
export async function PUT(request: Request, { params }: Contexto) {
  const { id } = await params;
  const acceso = await exigirAdmin(request, { modifica: true });
  if (!acceso.ok) return acceso.respuesta;
  if (!esUuid(id)) return errorJson("Pieza no encontrada.", 404);

  const validacion = validarPieza(await leerJson(request), true);
  if (!validacion.ok) return errorJson(validacion.error, 400);

  const { data, error } = await acceso.supabase
    .from("piezas")
    .update(validacion.datos)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) return errorInterno("editar pieza", error);
  if (!data) return errorJson("Pieza no encontrada.", 404);
  return NextResponse.json({ pieza: data });
}

/** DELETE /api/piezas/:id — elimina definitivamente una pieza del catálogo. */
export async function DELETE(request: Request, { params }: Contexto) {
  const { id } = await params;
  const acceso = await exigirAdmin(request, { modifica: true });
  if (!acceso.ok) return acceso.respuesta;
  if (!esUuid(id)) return errorJson("Pieza no encontrada.", 404);

  const { error } = await acceso.supabase.from("piezas").delete().eq("id", id);
  if (error) return errorInterno("eliminar pieza", error);
  return NextResponse.json({ ok: true });
}
