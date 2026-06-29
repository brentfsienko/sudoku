import type { MetadataRoute } from "next";
import { SEO_ROUTES, absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return SEO_ROUTES.map((route) => ({
    url: absoluteUrl(route.path === "/" ? "" : route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
