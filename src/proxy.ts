import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ES_DESARROLLO = process.env.NODE_ENV !== "production";

function origenSupabase(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return "";
  }
}

/**
 * Content Security Policy con nonce por petición: el navegador solo
 * ejecuta los scripts que Next.js firma con el nonce, así un XSS no puede
 * inyectar código. Cada recurso externo está limitado a su dominio.
 */
function construirCsp(nonce: string): string {
  const supabase = origenSupabase();
  const supabaseWs = supabase.replace(/^https:/, "wss:");
  const directivas = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${ES_DESARROLLO ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' data: blob: https://www.surdoc.cl https://surdoc.cl ${supabase}`,
    "frame-src https://sketchfab.com",
    `connect-src 'self' ${supabase} ${supabaseWs}${ES_DESARROLLO ? " ws:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // Solo el propio sitio y el sitio del museo pueden insertar esta
    // página en un iframe (protección contra clickjacking).
    "frame-ancestors 'self' https://www.museodemagallanes.gob.cl https://museodemagallanes.gob.cl",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
  ];
  if (!ES_DESARROLLO) directivas.push("upgrade-insecure-requests");
  return directivas.join("; ").replace(/\s{2,}/g, " ");
}

/**
 * Se ejecuta en cada petición de página:
 *  1. Genera el nonce y la CSP.
 *  2. En /admin exige una sesión de un administrador de la lista blanca
 *     (excepto /admin/login y /admin/recuperar).
 */
export async function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = construirCsp(nonce);

  const cabeceras = new Headers(request.headers);
  cabeceras.set("x-nonce", nonce);
  cabeceras.set("Content-Security-Policy", csp);

  const conCsp = (respuesta: NextResponse) => {
    respuesta.headers.set("Content-Security-Policy", csp);
    return respuesta;
  };

  const { pathname } = request.nextUrl;
  const response = NextResponse.next({ request: { headers: cabeceras } });
  if (!pathname.startsWith("/admin")) return conCsp(response);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Tener sesión no basta: la cuenta debe estar en la lista blanca de
  // administradores (función es_admin() en la base). Si la consulta
  // falla, se trata como no administrador (falla cerrado).
  let esAdmin = false;
  if (user) {
    const { data, error } = await supabase.rpc("es_admin");
    esAdmin = !error && data === true;
  }

  const esLogin = pathname === "/admin/login";
  // Pedir el correo de recuperación tiene que funcionar sin sesión.
  const esPublica = esLogin || pathname === "/admin/recuperar";

  if (!esAdmin && !esPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = user ? "?acceso=denegado" : "";
    return conCsp(NextResponse.redirect(url));
  }

  if (esAdmin && esLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return conCsp(NextResponse.redirect(url));
  }

  return conCsp(response);
}

export const config = {
  matcher: [
    {
      // Todo menos archivos estáticos (no ejecutan scripts).
      source: "/((?!_next/static|_next/image|favicon.ico|logo-museo.png).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
