"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";

const LARGO_MINIMO = 12;

/**
 * Define o cambia la contraseña de quien tiene la sesión abierta.
 * Se llega aquí desde el enlace del correo de recuperación o desde
 * "Cambiar contraseña" en el panel. La ruta está bajo /admin, así que
 * src/proxy.ts ya exige una sesión válida.
 */
export default function PaginaNuevaClave() {
  const router = useRouter();
  const supabase = crearClienteNavegador();

  const [clave, setClave] = useState("");
  const [repetida, setRepetida] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (clave.length < LARGO_MINIMO) {
      setError(`La contraseña debe tener al menos ${LARGO_MINIMO} caracteres.`);
      return;
    }
    if (clave !== repetida) {
      setError("Las dos contraseñas no coinciden.");
      return;
    }

    setCargando(true);
    const { error } = await supabase.auth.updateUser({ password: clave });
    setCargando(false);

    if (error) {
      setError(
        error.code === "same_password"
          ? "La contraseña nueva debe ser distinta de la actual."
          : error.code === "weak_password"
            ? "La contraseña es demasiado débil. Prueba con una más larga."
            : "No se pudo guardar la contraseña. Inténtalo de nuevo."
      );
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-museo-oscuro px-6">
      <form
        onSubmit={manejarEnvio}
        className="w-full max-w-sm rounded-lg bg-white p-8 shadow-xl"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-museo-dorado">
          Museo Regional de Magallanes
        </p>
        <h1 className="mt-1 text-xl font-bold text-museo-oscuro">
          Definir contraseña
        </h1>

        <div className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="clave"
              className="mb-1 block text-sm font-medium text-museo-texto"
            >
              Contraseña nueva
            </label>
            <input
              id="clave"
              type="password"
              required
              autoComplete="new-password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className="w-full rounded-md border border-museo-medio/30 px-3 py-2 text-sm focus:border-museo-medio focus:outline-none"
            />
            <p className="mt-1 text-xs text-museo-texto/70">
              Mínimo {LARGO_MINIMO} caracteres.
            </p>
          </div>
          <div>
            <label
              htmlFor="repetida"
              className="mb-1 block text-sm font-medium text-museo-texto"
            >
              Repite la contraseña
            </label>
            <input
              id="repetida"
              type="password"
              required
              autoComplete="new-password"
              value={repetida}
              onChange={(e) => setRepetida(e.target.value)}
              className="w-full rounded-md border border-museo-medio/30 px-3 py-2 text-sm focus:border-museo-medio focus:outline-none"
            />
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="mt-6 w-full rounded-md bg-museo-oscuro py-2.5 text-sm font-semibold text-white transition hover:bg-museo-medio disabled:opacity-60"
        >
          {cargando ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>
    </main>
  );
}
