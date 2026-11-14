import Link from "next/link";
import { PaginaPublica } from "@/components/PaginaPublica";
import { PieceCard } from "@/components/PieceCard";
import { listarPiezasPublicadas } from "@/lib/piezas";

export const revalidate = 60; // refresca el catálogo cada minuto

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function PaginaInicio({ searchParams }: Props) {
  const { q } = await searchParams;
  const termino = q?.trim() || undefined;
  const piezas = await listarPiezasPublicadas(termino);

  return (
    <PaginaPublica
      titulo="Colección digital 3D"
      migas={[{ label: "Colección digital 3D" }]}
      busquedaActual={termino}
    >
      <p className="mt-5 max-w-[68ch]">
        Recorre las piezas del Museo Regional de Magallanes en tres dimensiones:
        gira, acerca y observa cada objeto en detalle, junto a su ficha de
        registro oficial.
      </p>

      <form action="/" method="GET" role="search" className="mt-6">
        <label
          htmlFor="busqueda"
          className="block py-2 font-semibold text-black"
        >
          Busca una pieza
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <input
            id="busqueda"
            type="search"
            name="q"
            defaultValue={termino}
            placeholder="Ingresa el nombre de la pieza..."
            className="h-[50px] w-full min-w-0 appearance-none sm:flex-1 rounded-none border border-museo-borde bg-white px-4 text-base text-black placeholder:text-museo-suave sm:text-[0.9rem]"
          />
          <button
            type="submit"
            className="h-[50px] bg-black px-12 text-[0.9rem] text-white transition-colors hover:bg-museo-cuerpo"
          >
            Busca
          </button>
        </div>
      </form>

      <section aria-labelledby="resultados" className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="resultados" className="sr-only">
            Piezas
          </h2>
          <p role="status" className="text-museo-suave">
            {termino ? (
              <>
                {piezas.length === 1
                  ? "1 pieza encontrada"
                  : `${piezas.length} piezas encontradas`}{" "}
                para «{termino}»
              </>
            ) : piezas.length === 1 ? (
              "1 pieza en la colección"
            ) : (
              `${piezas.length} piezas en la colección`
            )}
          </p>
          {termino && (
            <Link href="/" className="font-semibold text-black underline">
              Ver toda la colección
            </Link>
          )}
        </div>

        {piezas.length === 0 ? (
          <div className="mt-6 border border-museo-acentoClaro bg-museo-acentoClaro/[0.04] p-6">
            <p className="font-semibold text-black">
              {termino
                ? "No encontramos piezas con ese nombre."
                : "Aún no hay piezas publicadas en la colección 3D."}
            </p>
            <p className="mt-1">
              {termino
                ? "Prueba con otra palabra, por ejemplo el tipo de objeto, o revisa la colección completa."
                : "Pronto se sumarán los primeros modelos. Mientras tanto, puedes visitar las colecciones digitales del museo."}
            </p>
            {!termino && (
              <a
                href="https://www.museodemagallanes.gob.cl/colecciones"
                className="mt-3 inline-block font-semibold text-black underline"
              >
                Ir a Colecciones digitales
              </a>
            )}
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {piezas.map((pieza) => (
              <li key={pieza.id}>
                <PieceCard pieza={pieza} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </PaginaPublica>
  );
}
