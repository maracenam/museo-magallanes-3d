import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente solo para pedir el correo de recuperación de contraseña.
 *
 * Usa el flujo "implicit" a propósito: así el enlace del correo funciona
 * aunque se abra en otro navegador o dispositivo distinto del que lo
 * pidió (el flujo PKCE del cliente normal exige que sea el mismo). No
 * guarda sesión; la sesión la establece <EnlaceAuth /> al volver.
 */
export function crearClienteRecuperacion() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "implicit",
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}

/**
 * Cliente de Supabase para usar en componentes del navegador ("use client").
 * Usa la clave pública (anon) — respeta las políticas RLS de la tabla.
 */
export function crearClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
