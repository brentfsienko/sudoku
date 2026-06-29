import type { MetadataRoute } from "next";
import { SEO_ROUTES, absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const site = absoluteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/reset-password"],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
