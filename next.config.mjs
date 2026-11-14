/**
 * Cabeceras de seguridad para todas las respuestas. La Content Security
 * Policy (con nonce por petición) se define en src/proxy.ts.
 */
const cabecerasSeguridad = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // No anunciar el framework en cada respuesta.
  poweredByHeader: false,

  images: {
    // El sitio solo optimiza imágenes propias (el logo). Sin dominios
    // remotos, el optimizador no puede usarse como proxy hacia terceros.
    remotePatterns: [],
  },

  async headers() {
    return [
      { source: "/:path*", headers: cabecerasSeguridad },
      {
        // El panel y la API no deben indexarse ni guardarse en cachés.
        source: "/(admin|api)/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
