import Link from "next/link";
import { ChevronRight, ImageOff } from "lucide-react";
import type { Pieza } from "@/lib/types";
import { tituloDePieza } from "@/lib/ficha";

/**
 * Tarjeta de pieza con el formato de las tarjetas de
 * museodemagallanes.gob.cl/colecciones: imagen, título en negrita, línea
 * fina y enlace "Ve más". La fotografía se muestra completa (sin recorte)
 * sobre fondo neutro, porque son objetos patrimoniales.
 */
export function PieceCard({ pieza }: { pieza: Pieza }) {
  const titulo = tituloDePieza(pieza);
  const objeto = pieza.ficha["Objeto"];
  const detalle = [objeto !== titulo && objeto, pieza.ficha["Colección"]]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="group relative flex flex-col">
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-museo-superficie">
        {pieza.imagen_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pieza.imagen_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain p-3 transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <span className="flex flex-col items-center gap-2 text-xs text-museo-suave">
            <ImageOff size={28} strokeWidth={1.5} aria-hidden />
            Sin fotografía
          </span>
        )}
      </div>

      <h2 className="mt-3 text-lg font-bold leading-snug text-black">
        <Link
          href={`/piezas/${pieza.id}`}
          className="after:absolute after:inset-0 group-hover:underline"
        >
          {titulo}
        </Link>
      </h2>
      {detalle && <p className="mt-1 text-sm text-museo-cuerpo">{detalle}</p>}

      <p
        aria-hidden
        className="mt-3 flex items-center gap-1 border-t border-museo-linea pt-2 text-sm font-bold text-black"
      >
        Ve más
        <ChevronRight
          size={16}
          strokeWidth={2.75}
          className="transition-transform duration-300 ease-out group-hover:translate-x-0.5"
        />
      </p>
    </article>
  );
}
