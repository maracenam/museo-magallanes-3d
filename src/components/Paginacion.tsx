import Link from "next/link";

interface Props {
  pagina: number;
  paginas: number;
  /** Término de búsqueda vigente, para conservarlo al cambiar de página. */
  termino?: string;
}

/** Dirección del catálogo para una página, conservando la búsqueda. */
function enlace(pagina: number, termino?: string): string {
  const params = new URLSearchParams();
  if (termino) params.set("q", termino);
  if (pagina > 1) params.set("pagina", String(pagina));
  const consulta = params.toString();
  return consulta ? `/?${consulta}` : "/";
}

/**
 * Qué números mostrar: siempre la primera, la última y las vecinas de la
 * actual; los tramos omitidos se marcan con "…" (null). Con pocas páginas
 * se muestran todas. Ej.: página 6 de 20 → 1 … 5 6 7 … 20.
 */
function numerosVisibles(pagina: number, paginas: number): (number | null)[] {
  if (paginas <= 7) return Array.from({ length: paginas }, (_, i) => i + 1);

  const visibles = new Set([1, paginas, pagina - 1, pagina, pagina + 1]);
  // Cerca de un extremo se completan cinco seguidas para que la barra no
  // cambie de ancho al avanzar.
  if (pagina <= 4) for (let n = 2; n <= 5; n++) visibles.add(n);
  if (pagina >= paginas - 3)
    for (let n = paginas - 4; n < paginas; n++) visibles.add(n);

  const orden = [...visibles]
    .filter((n) => n >= 1 && n <= paginas)
    .sort((a, b) => a - b);

  const resultado: (number | null)[] = [];
  orden.forEach((n, i) => {
    if (i > 0 && n - orden[i - 1] > 1) resultado.push(null);
    resultado.push(n);
  });
  return resultado;
}

const BASE =
  "flex h-11 min-w-11 items-center justify-center border px-3 text-[0.9rem]";
const ACTIVO = `${BASE} border-museo-borde bg-white text-black transition-colors hover:border-black hover:bg-black hover:text-white`;
const INACTIVO = `${BASE} border-museo-linea text-museo-suave`;

/** Navegación entre páginas del catálogo. No se muestra si hay una sola. */
export function Paginacion({ pagina, paginas, termino }: Props) {
  if (paginas <= 1) return null;

  return (
    <nav aria-label="Páginas de la colección" className="mt-12">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          {pagina > 1 ? (
            <Link
              href={enlace(pagina - 1, termino)}
              rel="prev"
              className={ACTIVO}
            >
              Anterior
            </Link>
          ) : (
            <span aria-disabled="true" className={INACTIVO}>
              Anterior
            </span>
          )}
        </li>

        {numerosVisibles(pagina, paginas).map((n, i) =>
          n === null ? (
            <li
              key={`omitidas-${i}`}
              aria-hidden="true"
              className="px-1 text-museo-suave"
            >
              …
            </li>
          ) : n === pagina ? (
            <li key={n}>
              <span
                aria-current="page"
                className={`${BASE} border-black bg-black font-semibold text-white`}
              >
                <span className="sr-only">Página </span>
                {n}
              </span>
            </li>
          ) : (
            <li key={n}>
              <Link href={enlace(n, termino)} className={ACTIVO}>
                <span className="sr-only">Página </span>
                {n}
              </Link>
            </li>
          )
        )}

        <li>
          {pagina < paginas ? (
            <Link
              href={enlace(pagina + 1, termino)}
              rel="next"
              className={ACTIVO}
            >
              Siguiente
            </Link>
          ) : (
            <span aria-disabled="true" className={INACTIVO}>
              Siguiente
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
