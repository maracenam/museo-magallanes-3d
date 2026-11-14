import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export interface Miga {
  label: string;
  href?: string;
}

/**
 * Estructura común del sitio público, igual a una página interna de
 * museodemagallanes.gob.cl: encabezado, migas de pan, título con línea
 * naranja a todo el ancho, contenido y pie negro.
 */
export function PaginaPublica({
  titulo,
  migas,
  busquedaActual,
  children,
}: {
  titulo: string;
  migas: Miga[];
  busquedaActual?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-[0.9rem] leading-relaxed text-museo-cuerpo">
      <Header busquedaActual={busquedaActual} />

      <main id="contenido" tabIndex={-1} className="flex-1 focus:outline-none">
        <div className="mx-auto max-w-sitio px-4">
          <nav aria-label="Migas de pan" className="pt-4 sm:pt-5">
            <ol className="flex flex-wrap items-center gap-x-1 text-xs text-museo-suave">
              <li>
                <a
                  href="https://www.museodemagallanes.gob.cl/"
                  className="hover:text-black hover:underline"
                >
                  Inicio
                </a>
              </li>
              {migas.map((miga) => (
                <li key={miga.label} className="flex items-center gap-x-1">
                  <span aria-hidden>/</span>
                  {miga.href ? (
                    <Link
                      href={miga.href}
                      className="hover:text-black hover:underline"
                    >
                      {miga.label}
                    </Link>
                  ) : (
                    <span aria-current="page">{miga.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <h1 className="mt-8 text-balance border-b-2 border-museo-acento pb-3 text-[2rem] font-bold leading-[1.1] text-black sm:mt-10 sm:text-5xl sm:leading-none">
            {titulo}
          </h1>

          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
