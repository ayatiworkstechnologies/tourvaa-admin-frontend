import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/pageMetadata";

const pages: Array<{
  path: string;
  changeFrequency: "weekly" | "monthly" | "yearly";
  priority: number;
}> = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/tours", changeFrequency: "weekly", priority: 0.9 },
  { path: "/destinations", changeFrequency: "weekly", priority: 0.8 },
  { path: "/blogs", changeFrequency: "weekly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
  { path: "/join/agent", changeFrequency: "monthly", priority: 0.6 },
  { path: "/join/supplier", changeFrequency: "monthly", priority: 0.6 },
  { path: "/join/affiliate", changeFrequency: "monthly", priority: 0.6 },
  { path: "/cancellation-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/cookie-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/accessibility", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
