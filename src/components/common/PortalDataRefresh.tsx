"use client";

import { useEffect } from "react";
import { API_DATA_REFRESH_EVENT, API_DATA_UPDATED_EVENT } from "@/lib/api/events";
import { requestNotificationRefresh } from "@/lib/notifications/events";

/**
 * Announces successful writes to the live portal without navigating or
 * reloading the current route. Individual screens already own their data and
 * can refetch without losing filters, typed form values, or scroll position.
 * Notification badges are shared portal chrome, so refresh them centrally.
 */
export default function PortalDataRefresh() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        requestNotificationRefresh();
        window.dispatchEvent(new CustomEvent(API_DATA_UPDATED_EVENT));
      }, 120);
    };
    window.addEventListener(API_DATA_REFRESH_EVENT, refresh);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener(API_DATA_REFRESH_EVENT, refresh);
    };
  }, []);
  return null;
}
