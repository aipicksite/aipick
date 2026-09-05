import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/tools-export"],
        disallow: ["/admin", "/dashboard", "/account", "/api/", "/auth/"],
      },
    ],
    sitemap: "https://aipick.site/sitemap.xml",
  };
}
