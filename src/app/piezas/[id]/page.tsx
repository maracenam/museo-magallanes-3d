import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { PaginaPublica } from "@/components/PaginaPublica";
import { Viewer3D } from "@/components/Viewer3D";
import { FichaTecnica } from "@/components/FichaTecnica";
import { obtenerPiezaPublicada } from "@/lib/piezas";
import { tituloDePieza } from "@/lib/ficha";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const pieza = await obtenerPiezaPublicada(id);
  if (!pieza) return { title: "Pieza no encontrada" };

  const descripcion = pieza.ficha["Descripción"];
  return {
    title: tituloDePieza(pieza),
    description: descripcion ? descripcion.slice(0, 160) : undefined,
    openGraph: pieza.imagen_url ? { images: [pieza.imagen_url] } : undefined,
  };
}

export default async function PaginaPieza({ params }: Props) {
  const { id } = await params;
  const pieza = await obtenerPiezaPublicada(id);
  if (!pieza) notFound();

  const titulo = tituloDePieza(pieza);
  const descripcion = pieza.ficha["Descripción"];
  const objeto = pieza.ficha["Objeto"];
  const coleccion = pieza.ficha["Colección"];
  const resumen = [
    objeto !== titulo && objeto,
    coleccion && `Colección ${coleccion}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <PaginaPublica
      titulo={titulo}
      migas={[{ label: "Colección digital 3D", href: "/" }, { label: titulo }]}
    >
      {resumen && <p className="mt-3 text-museo-suave">{resumen}</p>}

      <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-10 lg:grid-cols-12">
        {/* El modelo 3D es el protagonista: va primero y más ancho. */}
        <div className="lg:col-span-7">
          <h2 className="sr-only">Modelo 3D</h2>
          <Viewer3D
            sketchfabModelId={pieza.sketchfab_model_id}
            titulo={titulo}
          />
          {pieza.sketchfab_model_id && (
            <p className="mt-2 text-sm text-museo-suave">
              Arrastra para girar la pieza y usa la rueda del mouse o dos dedos
              para acercarte.
            </p>
          )}

          {pieza.imagen_url && (
            <figure className="mt-8">
              <div className="flex aspect-[4/3] items-center justify-center bg-museo-superficie sm:aspect-[16/10]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pieza.imagen_url}
                  alt={`Fotografía de registro: ${titulo}`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-contain p-4"
                />
              </div>
              <figcaption className="mt-2 text-sm text-museo-suave">
                Fotografía de registro. Fuente: SURDOC.
              </figcaption>
            </figure>
          )}
        </div>

        <div className="lg:col-span-5">
          {descripcion && (
            <section aria-labelledby="descripcion">
              <h2 id="descripcion" className="text-lg font-bold text-black">
                Descripción
              </h2>
              <p className="mt-2 max-w-[65ch]">{descripcion}</p>
            </section>
          )}

          <section
            aria-labelledby="identificacion"
            className={descripcion ? "mt-8" : ""}
          >
            <h2 id="identificacion" className="text-lg font-bold text-black">
              Identificación
            </h2>
            <FichaTecnica ficha={pieza.ficha} />
          </section>

          <div className="mt-6 flex flex-col items-start gap-3">
            {pieza.surdoc_url && (
              <a
                href={pieza.surdoc_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-black px-6 py-3 text-white transition-colors hover:bg-museo-cuerpo"
              >
                Ver ficha oficial en SURDOC
                <ExternalLink size={16} aria-hidden />
                <span className="sr-only">(se abre en una pestaña nueva)</span>
              </a>
            )}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-semibold text-black hover:underline"
            >
              <ArrowLeft size={16} aria-hidden />
              Volver a la colección
            </Link>
          </div>
        </div>
      </div>
    </PaginaPublica>
  );
}
