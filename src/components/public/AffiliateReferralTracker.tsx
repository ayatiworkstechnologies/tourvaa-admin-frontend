"use client";

import { useEffect } from "react";
import { storeReferralCode } from "@/lib/utils/affiliateReferral";

const TRACKED_KEY_PREFIX = "tourvaa_affiliate_ref_tracked_";

export default function AffiliateReferralTracker() {
  useEffect(() => {
    const refCode = new URLSearchParams(window.location.search).get("ref")?.trim();
    if (!refCode) return;

    // Stored immediately with the default window so the ref code is never
    // lost if the click-tracking request below is slow/fails; re-stored
    // with the link's real configured window once that request resolves.
    storeReferralCode(refCode);
    const trackedKey = `${TRACKED_KEY_PREFIX}${refCode}`;
    if (window.sessionStorage.getItem(trackedKey)) return;

    window.sessionStorage.setItem(trackedKey, "1");
    void fetch(`/api/affiliates/track/${encodeURIComponent(refCode)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    }).then(async (response) => {
      const body = await response.json().catch(() => null);
      const windowDays = body?.data?.attribution_window_days;
      if (typeof windowDays === "number" && windowDays > 0) storeReferralCode(refCode, windowDays);
    }).catch(() => {
      window.sessionStorage.removeItem(trackedKey);
    });
  }, []);

  return null;
}
