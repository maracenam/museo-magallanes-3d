import { camposDeFicha } from "@/lib/ficha";

/**
 * Ficha técnica: lista de pares etiqueta/valor como el bloque
 * "Identificación" de SURDOC, separados por una línea fina.
 */
export function FichaTecnica({ ficha }: { ficha: Record<string, string> }) {
  const campos = camposDeFicha(ficha);

  if (campos.length === 0) {
    return (
      <p className="mt-3 text-museo-suave">
        Esta pieza aún no tiene ficha técnica disponible.
      </p>
    );
  }

  return (
    <dl className="mt-3 border-t border-museo-linea">
      {campos.map(([clave, valor]) => (
        <div
          key={clave}
          className="grid gap-x-6 gap-y-0.5 border-b border-museo-linea py-3 sm:grid-cols-[11rem_1fr]"
        >
          <dt className="font-semibold text-black">{clave}</dt>
          <dd className="text-museo-cuerpo">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}
