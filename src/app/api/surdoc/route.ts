import { NextResponse } from "next/server";
import { errorJson, exigirAdmin, leerJson } from "@/lib/api";
import { scrapearSurdoc } from "@/lib/scraper/surdoc";
import { esUrlSurdoc, extraerIdSketchfab } from "@/lib/seguridad";

/**
 * POST /api/surdoc
 * Body: { surdocUrl: string, sketchfabUrl?: string }
 *
 * Ejecuta el "prescrapper": lee la ficha oficial de SURDOC para que el
 * administrador la revise antes de guardar la pieza. Solo para el
 * administrador. El servidor únicamente se conecta a https://surdoc.cl o
 * https://www.surdoc.cl (protección contra SSRF).
 */
export async function POST(request: Request) {
  const acceso = await exigirAdmin(request, { modifica: true });
  if (!acceso.ok) return acceso.respuesta;

  const cuerpo = (await leerJson(request)) as {
    surdocUrl?: unknown;
    sketchfabUrl?: unknown;
  } | null;

  if (!cuerpo?.surdocUrl) {
    return errorJson("Falta el enlace de SURDOC.", 400);
  }
  if (!esUrlSurdoc(cuerpo.surdocUrl)) {
    return errorJson(
      "El enlace debe ser una ficha de https://www.surdoc.cl.",
      400
    );
  }

  let sketchfabModelId: string | null = null;
  if (cuerpo.sketchfabUrl) {
    sketchfabModelId = extraerIdSketchfab(cuerpo.sketchfabUrl);
    if (!sketchfabModelId) {
      return errorJson(
        "El enlace de Sketchfab no es válido. Usa el enlace de la página del modelo en https://sketchfab.com.",
        400
      );
    }
  }

  try {
    const resultado = await scrapearSurdoc(cuerpo.surdocUrl);
    return NextResponse.json(
      { ...resultado, sketchfabModelId },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[api] prescrapper:", error);
    return errorJson(
      "No se pudo leer la ficha desde SURDOC. Verifica el enlace o inténtalo nuevamente.",
      502
    );
  }
}
