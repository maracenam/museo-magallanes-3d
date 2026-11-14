import type { MetadataRoute } from "next";

/** El panel y la API no deben aparecer en buscadores. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
  };
}
