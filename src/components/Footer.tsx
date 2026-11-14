/**
 * Pie de página: replica el bloque inferior negro de museodemagallanes.gob.cl
 * con los datos de contacto públicos del museo.
 */
export function Footer() {
  return (
    <footer className="mt-20 bg-museo-negro text-[0.9rem] leading-relaxed text-[#B5B5B5]">
      <div className="mx-auto max-w-sitio px-4 py-10">
        <address className="not-italic">
          <p>
            Dirección: Magallanes 949, Punta Arenas, Chile.{" "}
            <a
              href="https://www.google.com/maps/search/?api=1&query=Museo+Regional+de+Magallanes"
              className="text-white underline-offset-4 hover:underline"
            >
              Ver mapa
            </a>
          </p>
          <p>
            Tel:{" "}
            <a
              href="tel:+56612242049"
              className="text-white underline-offset-4 hover:underline"
            >
              +56 61 224 2049
            </a>{" "}
            <span aria-hidden>|</span> E-mail:{" "}
            <a
              href="mailto:museo.magallanes@museoschile.gob.cl"
              className="break-all text-white underline-offset-4 hover:underline"
            >
              museo.magallanes@museoschile.gob.cl
            </a>
          </p>
        </address>
        <p className="mt-1">
          <a
            href="https://www.museodemagallanes.gob.cl/"
            className="text-white underline-offset-4 hover:underline"
          >
            Museo Regional de Magallanes
          </a>{" "}
          <span aria-hidden>|</span> Servicio Nacional del Patrimonio Cultural
        </p>
        <p className="mt-6 text-[0.8rem]">
          © Servicio Nacional del Patrimonio Cultural
        </p>
      </div>
    </footer>
  );
}
