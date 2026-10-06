"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_DATA_REFRESH_EVENT } from "@/lib/api/events";
import { requestNotificationRefresh } from "@/lib/notifications/events";

/**
 * Keeps portal server-rendered state and notification badges current after
 * any successful POST/PUT/PATCH/DELETE. A short debounce combines related
 * writes (for example profile + account updates) into a single refresh.
 */
export default function PortalDataRefresh() {
  const router = useRouter();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        requestNotificationRefresh();
        router.refresh();
      }, 120);
    };
    window.addEventListener(API_DATA_REFRESH_EVENT, refresh);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener(API_DATA_REFRESH_EVENT, refresh);
    };
  }, [router]);
  return null;
}
