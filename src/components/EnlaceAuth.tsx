"use client";

import { useEffect } from "react";
import { crearClienteNavegador } from "@/lib/supabase/client";

/**
 * Recibe los enlaces que Supabase Auth envía por correo (recuperar
 * contraseña, invitación, enlace de acceso).
 *
 * Supabase devuelve al visitante al sitio con la sesión en el fragmento
 * de la URL (#access_token=...&type=recovery). El servidor nunca ve ese
 * fragmento, así que este componente lo lee en el navegador, guarda la
 * sesión en las cookies y redirige:
 *  - recuperación o invitación → página para definir la contraseña
 *  - enlace de acceso          → panel
 *
 * Vive en el layout raíz porque Supabase puede devolver al visitante a
 * cualquier página (por defecto, a la portada).
 */
export function EnlaceAuth() {
  useEffect(() => {
    const fragmento = window.location.hash.slice(1);
    if (!fragmento) return;

    const params = new URLSearchParams(fragmento);

    // Enlace vencido o ya usado: Supabase lo informa en el fragmento.
    if (params.has("error_description")) {
      window.location.replace("/admin/login?enlace=vencido");
      return;
    }

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (!accessToken || !refreshToken) return;

    const tipo = params.get("type");
    const supabase = crearClienteNavegador();

    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          window.location.replace("/admin/login?enlace=vencido");
          return;
        }
        // replace() también quita el token de la barra de direcciones.
        window.location.replace(
          tipo === "recovery" || tipo === "invite"
            ? "/admin/nueva-clave"
            : "/admin"
        );
      });
  }, []);

  return null;
}
