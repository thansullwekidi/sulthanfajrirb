import type { MetadataRoute } from "next";

const BASE_URL = "https://www.sulthanfajrirb.my.id";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${BASE_URL}/cv`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8
    },
    {
      url: `${BASE_URL}/kontak`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.6
    }
  ];
}
