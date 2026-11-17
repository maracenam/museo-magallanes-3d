import * as cheerio from "cheerio";
import { limpiarFicha } from "@/lib/ficha";
import type { ResultadoPrescrapper } from "@/lib/types";
import { esUrlImagen, esUrlSurdoc } from "@/lib/seguridad";

const TIEMPO_MAXIMO_MS = 10_000;
const TAMANO_MAXIMO = 3_000_000; // bytes de HTML
const REDIRECCIONES_MAXIMAS = 3;

/**
 * Descarga una página de SURDOC sin salir nunca de surdoc.cl: las
 * redirecciones se siguen a mano y cada destino se vuelve a validar
 * (evita SSRF hacia la red interna del servidor). Con límite de tiempo y
 * de tamaño para que una respuesta enorme o lenta no tumbe el servidor.
 */
async function descargarDeSurdoc(url: string): Promise<string> {
  let actual = url;
  for (let salto = 0; salto <= REDIRECCIONES_MAXIMAS; salto++) {
    if (!esUrlSurdoc(actual)) throw new Error("Destino fuera de SURDOC");

    const respuesta = await fetch(actual, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
    });

    if (respuesta.status >= 300 && respuesta.status < 400) {
      const destino = respuesta.headers.get("location");
      if (!destino) throw new Error("Redirección sin destino");
      actual = new URL(destino, actual).toString();
      continue;
    }
    if (!respuesta.ok) {
      throw new Error(`SURDOC respondió con estado ${respuesta.status}`);
    }
    const tipo = respuesta.headers.get("content-type") ?? "";
    if (!tipo.includes("text/html")) throw new Error("SURDOC no entregó HTML");

    const declarado = Number(respuesta.headers.get("content-length") ?? 0);
    if (declarado > TAMANO_MAXIMO)
      throw new Error("Respuesta demasiado grande");

    // Lectura por partes para cortar si el tamaño real supera el límite.
    const lector = respuesta.body?.getReader();
    if (!lector) return "";
    const partes: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await lector.read();
      if (done) break;
      total += value.byteLength;
      if (total > TAMANO_MAXIMO) {
        await lector.cancel();
        throw new Error("Respuesta demasiado grande");
      }
      partes.push(value);
    }
    return new TextDecoder().decode(Buffer.concat(partes));
  }
  throw new Error("Demasiadas redirecciones");
}

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Campos que esperamos encontrar en una ficha SURDOC completa.
 * El prescrapper no bloquea nada si faltan: solo los reporta como
 * "campos_faltantes" para que el administrador los revise y complete
 * manualmente antes de publicar. Es una verificación manual asistida,
 * no una validación automática estricta.
 */
const CAMPOS_ESPERADOS = [
  "Título",
  "Institución",
  "Colección",
  "Clasificación",
  "Objeto",
  "Creador",
  // SURDOC los publica juntos como "Técnica / Material".
  "Material",
  "Técnica",
  "Dimensiones",
  "Procedencia",
  "Descripción",
  "Estado de conservación",
  "Número de registro",
];

const PALABRAS_CLAVE_ETIQUETA = [
  "institución",
  "registro",
  "inventario",
  "clasificación",
  "colección",
  "objeto",
  "creador",
  "dimensiones",
  "técnica",
  "material",
  "ubicación",
  "título",
  "descripción",
  "conservación",
  "lugar",
  "ingreso",
  "procedencia",
  "registrador",
  "adquisición",
];

/**
 * Convierte la ruta de la imagen en URL absoluta y solo la acepta si es
 * https de SURDOC (nunca data:, javascript: ni otros dominios).
 */
function normalizarUrlImagen(src: string): string | null {
  let url: string;
  try {
    url = new URL(src.trim(), "https://www.surdoc.cl/").toString();
  } catch {
    return null;
  }
  return esUrlImagen(url) ? url : null;
}

function extraerImagen($: cheerio.CheerioAPI): string | null {
  const ogImage =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="og:image"]').attr("content");
  if (ogImage) return normalizarUrlImagen(ogImage);

  const claves = ["image", "foto", "main", "primary", "gallery", "responsive"];
  let candidata: string | undefined;
  $("img").each((_, el) => {
    if (candidata) return;
    const clase = ($(el).attr("class") || "").toLowerCase();
    if (claves.some((k) => clase.includes(k))) {
      candidata = $(el).attr("data-src") || $(el).attr("src");
    }
  });
  if (candidata) return normalizarUrlImagen(candidata);

  $("img").each((_, el) => {
    if (candidata) return;
    const src = $(el).attr("data-src") || $(el).attr("src") || "";
    if (
      ["/files/", "/default/", "/colecciones/"].some((p) => src.includes(p))
    ) {
      candidata = src;
    }
  });
  return candidata ? normalizarUrlImagen(candidata) : null;
}

function extraerPorFilaGenerica(
  $: cheerio.CheerioAPI,
  ficha: Record<string, string>
) {
  $("div, li").each((_, el) => {
    const clase = $(el).attr("class") || "";
    if (!/field|item-row|data-row|col-/.test(clase)) return;

    const etiquetaEl = $(el)
      .find("div, span, label, strong, b, h4, h5")
      .filter((_, e) =>
        /label|title|name|attribute|bold/.test($(e).attr("class") || "")
      )
      .first();
    const valorEl = $(el)
      .find("div, span, p, ul")
      .filter((_, e) =>
        /item|value|content|data/.test($(e).attr("class") || "")
      )
      .first();

    if (etiquetaEl.length && valorEl.length && etiquetaEl[0] !== valorEl[0]) {
      const etiqueta = etiquetaEl.text().trim().replace(/:$/, "");
      let valor = valorEl.text().replace(/\s+/g, " ").trim();
      if (valor.startsWith(etiqueta)) {
        valor = valor.slice(etiqueta.length).replace(/^[\s:]+/, "");
      }
      if (etiqueta && valor && etiqueta.length < 70) {
        ficha[etiqueta] = valor;
      }
    }
  });
}

function extraerDeTablas($: cheerio.CheerioAPI, ficha: Record<string, string>) {
  $("table").each((_, tabla) => {
    $(tabla)
      .find("tr")
      .each((_, fila) => {
        const cols = $(fila).find("th, td");
        if (cols.length === 2) {
          const clave = $(cols[0])
            .text()
            .replace(/\s+/g, " ")
            .trim()
            .replace(/:$/, "");
          const valor = $(cols[1]).text().replace(/\s+/g, " ").trim();
          if (clave && valor) ficha[clave] = valor;
        } else if (cols.length > 2) {
          for (let i = 0; i < cols.length - 1; i += 2) {
            const clave = $(cols[i])
              .text()
              .replace(/\s+/g, " ")
              .trim()
              .replace(/:$/, "");
            const valor = $(cols[i + 1])
              .text()
              .replace(/\s+/g, " ")
              .trim();
            if (clave && valor) ficha[clave] = valor;
          }
        }
      });
  });
}

function extraerDeDefiniciones(
  $: cheerio.CheerioAPI,
  ficha: Record<string, string>
) {
  $("dt").each((_, dt) => {
    const dd = $(dt).next("dd");
    if (dd.length) {
      const clave = $(dt).text().replace(/\s+/g, " ").trim().replace(/:$/, "");
      const valor = dd.text().replace(/\s+/g, " ").trim();
      if (clave && valor) ficha[clave] = valor;
    }
  });
}

function extraerDeNegritas(
  $: cheerio.CheerioAPI,
  ficha: Record<string, string>
) {
  $("strong, b").each((_, el) => {
    const texto = $(el).text().trim().replace(/:$/, "");
    if (texto.length <= 2 || texto.length >= 50) return;
    const textoLower = texto.toLowerCase();
    if (!PALABRAS_CLAVE_ETIQUETA.some((k) => textoLower.includes(k))) return;

    const siguiente = el.nextSibling;
    if (siguiente && siguiente.type === "text") {
      const valor = (siguiente.data || "").trim().replace(/^[:\s]+/, "");
      if (valor && !(texto in ficha)) {
        ficha[texto] = valor;
      }
    }
  });
}

const limpiarTexto = (t: string) => t.replace(/\s+/g, " ").trim();

/**
 * Extractor específico para el HTML actual de SURDOC (sitio Drupal).
 * Los extractores genéricos de arriba toman solo el primer par
 * etiqueta/valor de cada bloque, y por eso perdían campos como
 * "Dimensiones" o "Técnica / Material". SURDOC usa dos estructuras:
 *
 *  1. <div class="form-item"><label class="form-item__label">Etiqueta</label>
 *       <div class="field-item">Valor</div></div>
 *  2. <div class="field"><div class="field-label">Etiqueta</div>
 *       <div class="field-item">Valor</div></div>
 *
 * Un "field" puede ser un grupo que contiene otros campos (por ejemplo
 * "Adquisición"); en ese caso se omite el grupo y se leen sus hijos.
 * Se ejecuta al final para que sus valores, más precisos, prevalezcan.
 */
function extraerDeSurdoc($: cheerio.CheerioAPI, ficha: Record<string, string>) {
  $(".form-item").each((_, el) => {
    const etiqueta = limpiarTexto(
      $(el).children(".form-item__label").first().text()
    );
    const valor = limpiarTexto(
      $(el).children(".field-item, .field-items").text()
    );
    if (etiqueta && valor && etiqueta.length < 70) ficha[etiqueta] = valor;
  });

  $(".field").each((_, el) => {
    const etiqueta = limpiarTexto(
      $(el).children(".field-label").first().text()
    );
    if (!etiqueta || etiqueta.length >= 70) return;

    const contenido = $(el).children(".field-item, .field-items");
    const esGrupo =
      contenido.find(".field-label").length > 0 ||
      contenido
        .find(".form-item__label")
        .toArray()
        .some((l) => limpiarTexto($(l).text()) !== "");
    if (esGrupo) {
      // Si un extractor genérico guardó el grupo como texto pegado, fuera.
      delete ficha[etiqueta];
      return;
    }

    const valor = limpiarTexto(contenido.text());
    if (valor) ficha[etiqueta] = valor;
  });
}

/**
 * Lee una ficha pública de SURDOC y extrae sus metadatos + fotografía.
 * Además calcula qué campos "esperables" no se encontraron, para que
 * el administrador los revise manualmente antes de publicar la pieza.
 */
export async function scrapearSurdoc(
  url: string
): Promise<ResultadoPrescrapper> {
  const html = await descargarDeSurdoc(url);
  const $ = cheerio.load(html);

  const bruta: Record<string, string> = {};
  extraerPorFilaGenerica($, bruta);
  extraerDeTablas($, bruta);
  extraerDeDefiniciones($, bruta);
  extraerDeNegritas($, bruta);
  extraerDeSurdoc($, bruta);

  const ficha = limpiarFicha(bruta);

  // Limpieza final: fuera valores vacíos o placeholders sin información real.
  for (const clave of Object.keys(ficha)) {
    if (!ficha[clave] || ficha[clave] === "Ver más") {
      delete ficha[clave];
    }
  }

  const imagen_url = extraerImagen($);

  const clavesEncontradas = Object.keys(ficha).map((k) => k.toLowerCase());
  const campos_faltantes = CAMPOS_ESPERADOS.filter(
    (esperado) =>
      !clavesEncontradas.some(
        (encontrada) =>
          encontrada.includes(esperado.toLowerCase()) ||
          esperado.toLowerCase().includes(encontrada)
      )
  );

  return { ficha, imagen_url, campos_faltantes };
}
