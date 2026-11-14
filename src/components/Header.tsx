import Image from "next/image";
import { Menu, Search } from "lucide-react";

const SITIO = "https://www.museodemagallanes.gob.cl";

/** Menú principal del sitio del museo, en el mismo orden. */
const MENU = [
  { label: "Inicio", href: `${SITIO}/` },
  { label: "¿Qué necesitas?", href: `${SITIO}/servicios` },
  { label: "Colecciones digitales", href: `${SITIO}/colecciones` },
  { label: "Colección 3D", href: "/", actual: true },
  { label: "Multimedia", href: `${SITIO}/multimedia` },
  { label: "Noticias", href: `${SITIO}/noticias` },
  { label: "Publicaciones", href: `${SITIO}/publicaciones` },
  {
    label: "Exposiciones temporales",
    href: `${SITIO}/exposiciones-temporales`,
  },
];

function EnlacesMenu({ movil = false }: { movil?: boolean }) {
  return (
    <ul
      className={
        movil
          ? "flex flex-col border-t border-white/15"
          : "flex items-stretch justify-between"
      }
    >
      {MENU.map((item) => (
        <li
          key={item.label}
          className={movil ? "border-b border-white/15" : ""}
        >
          <a
            href={item.href}
            aria-current={item.actual ? "page" : undefined}
            className={[
              "flex h-full items-center text-[0.9rem] leading-tight text-[#F3F3F3] transition-colors hover:bg-white/10 hover:text-white",
              movil ? "px-4 py-3.5" : "max-w-[9.5rem] px-4 py-4",
              item.actual
                ? "font-semibold text-white shadow-[inset_0_-3px_0_#E0701E]"
                : "",
            ].join(" ")}
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * Header público: replica el encabezado de museodemagallanes.gob.cl
 * (logo oficial + buscador sobre blanco y menú principal en barra negra),
 * para que esta área se sienta parte del sitio del museo.
 *
 * IMPORTANTE: por seguridad, aquí NO hay enlace al panel de administración.
 * El equipo del museo ingresa escribiendo o guardando en favoritos la URL
 * /admin/login — ver "Acceso del administrador" en el README.
 */
export function Header({ busquedaActual }: { busquedaActual?: string }) {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-black"
      >
        Saltar al contenido
      </a>

      <header className="bg-white">
        <div className="mx-auto flex max-w-sitio items-center justify-between gap-4 px-4 py-3 sm:py-4">
          <a href={`${SITIO}/`} className="shrink-0">
            <Image
              src="/logo-museo.png"
              alt="Museo Regional de Magallanes, ir al sitio del museo"
              width={364}
              height={128}
              priority
              className="h-14 w-auto sm:h-[72px]"
            />
          </a>

          <form
            action="/"
            method="GET"
            role="search"
            className="relative hidden sm:block"
          >
            <label htmlFor="busqueda-header" className="sr-only">
              Busca en la colección 3D
            </label>
            <input
              id="busqueda-header"
              type="search"
              name="q"
              defaultValue={busquedaActual}
              placeholder="Busca"
              className="h-10 w-48 appearance-none rounded-none border border-museo-linea bg-white pl-3 pr-10 text-[0.9rem] text-black placeholder:text-museo-suave focus:border-museo-borde focus:outline-none focus-visible:outline-2 focus-visible:outline-museo-acento lg:w-56"
            />
            <button
              type="submit"
              aria-label="Buscar"
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-museo-suave hover:text-black"
            >
              <Search size={18} strokeWidth={2.25} aria-hidden />
            </button>
          </form>
        </div>
      </header>

      <nav aria-label="Menú principal" className="bg-museo-negro">
        {/* Escritorio */}
        <div className="mx-auto hidden min-h-16 max-w-sitio px-0 lg:block">
          <EnlacesMenu />
        </div>

        {/* Móvil y tablet */}
        <details className="group lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 text-[0.9rem] font-semibold text-white">
            Menú principal
            <Menu size={22} aria-hidden />
          </summary>
          <EnlacesMenu movil />
        </details>
      </nav>
    </>
  );
}
