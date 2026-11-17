"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { limpiarFicha } from "@/lib/ficha";
import type { Pieza } from "@/lib/types";

export default function PaginaGestionarPieza() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [pieza, setPieza] = useState<Pieza | null>(null);
  const [titulo, setTitulo] = useState("");
  const [ficha, setFicha] = useState<Record<string, string>>({});
  const [sketchfabUrl, setSketchfabUrl] = useState("");
  const [surdocUrl, setSurdocUrl] = useState("");
  const [imagenUrl, setImagenUrl] = useState<string | null>(null);
  const [camposFaltantes, setCamposFaltantes] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [revalidando, setRevalidando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/piezas/${id}`)
      .then((r) => r.json())
      .then((datos) => {
        if (datos.pieza) {
          setPieza(datos.pieza);
          // limpiarFicha quita campos duplicados que dejó el scraper
          // antiguo; se guardan limpios al presionar "Guardar cambios".
          setFicha(limpiarFicha(datos.pieza.ficha));
          setTitulo(datos.pieza.titulo || datos.pieza.ficha["Título"] || "");
          setSketchfabUrl(datos.pieza.sketchfab_url);
          setSurdocUrl(datos.pieza.surdoc_url);
          setImagenUrl(datos.pieza.imagen_url);
          setCamposFaltantes(datos.pieza.campos_faltantes ?? []);
        } else {
          setError("No se encontró la pieza.");
        }
      })
      .finally(() => setCargando(false));
  }, [id]);

  function actualizarCampo(clave: string, valor: string) {
    setFicha((prev) => ({ ...prev, [clave]: valor }));
  }

  async function guardarCambios(cambios: Partial<Pieza>) {
    setGuardando(true);
    setError(null);
    setMensaje(null);
    try {
      const res = await fetch(`/api/piezas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cambios),
      });
      const datos = await res.json();
      if (!res.ok) {
        setError(datos.error || "No se pudo guardar.");
        return;
      }
      setPieza(datos.pieza);
      setFicha(datos.pieza.ficha);
      setSketchfabUrl(datos.pieza.sketchfab_url);
      setSurdocUrl(datos.pieza.surdoc_url);
      setImagenUrl(datos.pieza.imagen_url);
      setCamposFaltantes(datos.pieza.campos_faltantes ?? []);
      setMensaje("Cambios guardados.");
    } catch {
      setError("Error de conexión al guardar.");
    } finally {
      setGuardando(false);
    }
  }

  async function revalidarConSurdoc() {
    if (!pieza) return;
    setRevalidando(true);
    setError(null);
    setMensaje(null);
    try {
      const res = await fetch("/api/surdoc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surdocUrl, sketchfabUrl }),
      });
      const datos = await res.json();
      if (!res.ok) {
        setError(datos.error || "No se pudo revalidar contra SURDOC.");
        return;
      }
      // Se muestra la ficha recién obtenida para revisión manual;
      // el administrador decide si la guarda con "Guardar cambios".
      setFicha(datos.ficha);
      setCamposFaltantes(datos.campos_faltantes ?? []);
      if (datos.imagen_url) setImagenUrl(datos.imagen_url);
      setMensaje(
        "Ficha actualizada desde SURDOC. Revísala y presiona 'Guardar cambios' para aplicarla."
      );
    } catch {
      setError("Error de conexión al revalidar con SURDOC.");
    } finally {
      setRevalidando(false);
    }
  }

  /** Guarda título, enlaces y ficha tal como están en pantalla. */
  function guardarFicha() {
    // Un campo que se deja en blanco se elimina de la ficha.
    const fichaFinal = Object.fromEntries(
      Object.entries(ficha).filter(([, valor]) => valor.trim() !== "")
    );
    return guardarCambios({
      ficha: fichaFinal,
      titulo: titulo.trim() || null,
      sketchfab_url: sketchfabUrl.trim(),
      surdoc_url: surdocUrl.trim(),
      imagen_url: imagenUrl,
      campos_faltantes: camposFaltantes.filter((campo) => !fichaFinal[campo]),
    });
  }

  async function eliminarPieza() {
    if (!confirm("¿Eliminar esta pieza definitivamente del catálogo?")) return;
    const res = await fetch(`/api/piezas/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError("No se pudo eliminar la pieza.");
    }
  }

  // Campos que SURDOC no entregó y que aún no se agregan ni se descartan.
  // "Título" no cuenta si la pieza ya tiene título propio para el catálogo.
  const pendientes = camposFaltantes.filter(
    (campo) => !(campo in ficha) && !(campo === "Título" && titulo.trim())
  );

  if (cargando)
    return <p className="text-sm text-museo-texto/60">Cargando...</p>;
  if (!pieza) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-museo-oscuro">
            {pieza.titulo || ficha["Título"] || "(sin título)"}
          </h2>
          <span
            className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
              pieza.estado === "publicada"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {pieza.estado === "publicada" ? "Publicada" : "Oculta"}
          </span>
        </div>
        <button
          onClick={() => router.push("/admin")}
          className="text-sm text-museo-medio hover:underline"
        >
          ← Volver al listado
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {pieza.estado === "publicada" ? (
          <button
            onClick={() => guardarCambios({ estado: "oculta" })}
            disabled={guardando}
            className="rounded-md border border-museo-oscuro px-4 py-2 text-sm font-semibold text-museo-oscuro hover:bg-museo-oscuro/5"
          >
            Ocultar del sitio público
          </button>
        ) : (
          <button
            onClick={() => guardarCambios({ estado: "publicada" })}
            disabled={guardando}
            className="rounded-md bg-museo-oscuro px-4 py-2 text-sm font-semibold text-white hover:bg-museo-medio"
          >
            Publicar
          </button>
        )}
        <button
          onClick={revalidarConSurdoc}
          disabled={revalidando}
          className="rounded-md border border-museo-medio px-4 py-2 text-sm font-semibold text-museo-medio hover:bg-museo-medio/5"
        >
          {revalidando ? "Consultando SURDOC..." : "Revalidar contra SURDOC"}
        </button>
        <button
          onClick={eliminarPieza}
          className="ml-auto rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
        >
          Eliminar pieza
        </button>
      </div>

      {mensaje && <p className="mt-4 text-sm text-green-700">{mensaje}</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {pendientes.length > 0 && (
        <div className="mt-6 rounded-md border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">
            Campos que SURDOC no entregó. Agrégalos a mano o descártalos si no
            aplican a esta pieza:
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {pendientes.map((campo) => (
              <li
                key={campo}
                className="flex items-center overflow-hidden rounded-full border border-amber-400 bg-white text-xs font-medium text-amber-700"
              >
                <button
                  onClick={() => actualizarCampo(campo, "")}
                  className="px-3 py-1 hover:bg-amber-100"
                >
                  + {campo}
                </button>
                <button
                  onClick={() =>
                    setCamposFaltantes((prev) =>
                      prev.filter((c) => c !== campo)
                    )
                  }
                  aria-label={`Descartar ${campo}: no aplica`}
                  title="No aplica"
                  className="border-l border-amber-300 px-2 py-1 hover:bg-amber-100"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-800/80">
            Los cambios se aplican al presionar “Guardar cambios”.
          </p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <p className="mb-2 text-sm font-semibold text-museo-oscuro">
            Fotografía
          </p>
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-md border border-museo-medio/20 bg-museo-crema">
            {imagenUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagenUrl}
                alt=""
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-xs text-museo-texto/50">
                Sin fotografía
              </span>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <label
                htmlFor="sketchfab-url"
                className="mb-1 block text-xs font-bold uppercase tracking-wide text-museo-medio"
              >
                Enlace de Sketchfab
              </label>
              <input
                id="sketchfab-url"
                type="url"
                value={sketchfabUrl}
                onChange={(e) => setSketchfabUrl(e.target.value)}
                className="w-full rounded-md border border-museo-medio/30 px-3 py-2 text-xs focus:border-museo-medio focus:outline-none"
              />
              <p className="mt-1 text-xs text-museo-texto/60">
                Cámbialo si el modelo 3D se volvió a subir a Sketchfab.
              </p>
            </div>
            <div>
              <label
                htmlFor="surdoc-url"
                className="mb-1 block text-xs font-bold uppercase tracking-wide text-museo-medio"
              >
                Enlace de SURDOC
              </label>
              <input
                id="surdoc-url"
                type="url"
                value={surdocUrl}
                onChange={(e) => setSurdocUrl(e.target.value)}
                className="w-full rounded-md border border-museo-medio/30 px-3 py-2 text-xs focus:border-museo-medio focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-museo-dorado">
              Título de la pieza (para el catálogo)
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Vasija ceremonial selk'nam"
              className="w-full rounded-md border-2 border-museo-dorado/40 px-3 py-2 text-sm font-medium focus:border-museo-dorado focus:outline-none"
            />
          </div>

          {Object.entries(ficha).map(([clave, valor]) => (
            <div key={clave}>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-museo-medio">
                {clave}
              </label>
              {valor.length > 100 ? (
                <textarea
                  value={valor}
                  onChange={(e) => actualizarCampo(clave, e.target.value)}
                  rows={Math.min(8, Math.ceil(valor.length / 90) + 1)}
                  className="w-full rounded-md border border-museo-medio/30 px-3 py-2 text-sm leading-relaxed focus:border-museo-medio focus:outline-none"
                />
              ) : (
                <input
                  type="text"
                  value={valor}
                  onChange={(e) => actualizarCampo(clave, e.target.value)}
                  className="w-full rounded-md border border-museo-medio/30 px-3 py-2 text-sm focus:border-museo-medio focus:outline-none"
                />
              )}
            </div>
          ))}
          <p className="text-xs text-museo-texto/60">
            Para quitar un campo de la ficha, déjalo en blanco y guarda.
          </p>

          <button
            onClick={guardarFicha}
            disabled={guardando}
            className="mt-2 rounded-md bg-museo-oscuro px-5 py-2.5 text-sm font-semibold text-white hover:bg-museo-medio disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
