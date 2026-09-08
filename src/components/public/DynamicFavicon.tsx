"use client";

import { useEffect } from "react";
import { usePublicSettings } from "@/providers/PublicSettingsProvider";

/** Swaps the browser tab icon to the admin-uploaded favicon (Settings ->
 * General -> Favicon) once it's loaded. Renders nothing - it only ever
 * touches the <link rel="icon"> tag already present in the document head
 * (from app/layout.tsx's metadata), never removes it, so pages keep a
 * favicon even before settings have loaded or if none was ever uploaded. */
export default function DynamicFavicon() {
  const { settings } = usePublicSettings();
  const faviconUrl = settings.favicon?.trim() || "";

  useEffect(() => {
    if (!faviconUrl) return;
    const existing = document.querySelectorAll<HTMLLinkElement>("link[rel~='icon']");
    if (existing.length > 0) {
      existing.forEach((link) => { link.href = faviconUrl; });
    } else {
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = faviconUrl;
      document.head.appendChild(link);
    }
  }, [faviconUrl]);

  return null;
}
