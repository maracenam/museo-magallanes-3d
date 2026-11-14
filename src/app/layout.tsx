import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { EnlaceAuth } from "@/components/EnlaceAuth";

export const metadata: Metadata = {
  title: {
    default: "Colección digital 3D | Museo Regional de Magallanes",
    template: "%s | Colección digital 3D | Museo Regional de Magallanes",
  },
  description:
    "Colección digital 3D del Museo Regional de Magallanes: modelos tridimensionales interactivos junto a la ficha oficial de cada pieza.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Leer las cabeceras hace que cada página se genere por petición, lo
  // que permite que Next.js firme sus scripts con el nonce de la CSP
  // (ver src/proxy.ts).
  await headers();

  return (
    <html lang="es">
      <head>
        {/*
          Open Sans: la tipografía del sitio oficial del museo
          (museodemagallanes.gob.cl). Se carga como enlace normal (no
          next/font) para no depender de acceso a internet durante el build.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <EnlaceAuth />
        {children}
      </body>
    </html>
  );
}
