"use client";

import { useState } from "react";
import Link from "next/link";
import { crearClienteRecuperacion } from "@/lib/supabase/client";

export default function PaginaRecuperar() {
  const [correo, setCorreo] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const supabase = crearClienteRecuperacion();
    const { error } = await supabase.auth.resetPasswordForEmail(correo, {
      redirectTo: `${window.location.origin}/admin/login`,
    });

    setCargando(false);

    if (error) {
      setError(
        error.status === 429
          ? "Se pidieron demasiados correos seguidos. Espera unos minutos e inténtalo de nuevo."
          : "No se pudo enviar el correo. Inténtalo de nuevo."
      );
      return;
    }

    // Mismo mensaje exista o no la cuenta, para no revelar qué correos
    // tienen acceso al panel.
    setEnviado(true);
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
          Recuperar contraseña
        </h1>

        {enviado ? (
          <p className="mt-6 text-sm text-museo-texto">
            Si <strong>{correo}</strong> tiene acceso al panel, recibirá un
            correo con un enlace para definir una contraseña nueva. Revisa
            también la carpeta de spam.
          </p>
        ) : (
          <>
            <p className="mt-4 text-sm text-museo-texto">
              Escribe tu correo y te enviaremos un enlace para definir una
              contraseña nueva.
            </p>

            <div className="mt-6">
              <label
                htmlFor="correo"
                className="mb-1 block text-sm font-medium text-museo-texto"
              >
                Correo
              </label>
              <input
                id="correo"
                type="email"
                required
                autoComplete="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full rounded-md border border-museo-medio/30 px-3 py-2 text-sm focus:border-museo-medio focus:outline-none"
              />
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={cargando}
              className="mt-6 w-full rounded-md bg-museo-oscuro py-2.5 text-sm font-semibold text-white transition hover:bg-museo-medio disabled:opacity-60"
            >
              {cargando ? "Enviando..." : "Enviar enlace"}
            </button>
          </>
        )}

        <Link
          href="/admin/login"
          className="mt-6 block text-center text-sm text-museo-medio hover:underline"
        >
          Volver a iniciar sesión
        </Link>
      </form>
    </main>
  );
}
