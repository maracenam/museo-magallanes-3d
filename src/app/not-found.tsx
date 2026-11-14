import Link from "next/link";
import { PaginaPublica } from "@/components/PaginaPublica";

export default function NoEncontrada() {
  return (
    <PaginaPublica
      titulo="No encontramos esta página"
      migas={[
        { label: "Colección digital 3D", href: "/" },
        { label: "No encontrada" },
      ]}
    >
      <p className="mt-5 max-w-[68ch]">
        Es posible que la pieza ya no esté publicada o que el enlace tenga un
        error. Puedes volver a la colección y buscarla por su nombre.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block bg-black px-8 py-3 text-white transition-colors hover:bg-museo-cuerpo"
      >
        Volver a la colección 3D
      </Link>
    </PaginaPublica>
  );
}
