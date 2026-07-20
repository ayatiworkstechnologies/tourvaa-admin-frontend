import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/pageMetadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/agent/",
        "/supplier/",
        "/customer/",
        "/affiliate/",
        "/booking/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
