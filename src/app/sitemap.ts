import type { MetadataRoute } from "next";

import { SITE_URL } from "@/config/site";
import { getAllPosts } from "@/lib/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, lastModified: new Date() },
    ...getAllPosts().map((p) => ({
      url: `${SITE_URL}blog/${p.slug}/`,
      lastModified: new Date(p.date),
    })),
  ];
}
