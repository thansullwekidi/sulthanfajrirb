import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/cv", "/kontak", "/publikasi/"],
        disallow: ["/admin", "/api/"]
      }
    ],
    sitemap: "https://www.sulthanfajrirb.my.id/sitemap.xml"
  };
}
