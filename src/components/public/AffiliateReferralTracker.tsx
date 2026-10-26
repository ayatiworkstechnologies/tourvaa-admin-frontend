"use client";

import { useEffect } from "react";
import { storeReferralCode } from "@/lib/utils/affiliateReferral";
import { AFFILIATE_ENABLED } from "@/lib/features";

const TRACKED_KEY_PREFIX = "tourvaa_affiliate_ref_tracked_";

export default function AffiliateReferralTracker() {
  useEffect(() => {
    if (!AFFILIATE_ENABLED) return;
    const url = new URL(window.location.href);
    const refCode = url.searchParams.get("ref")?.trim();
    if (!refCode) return;

    // A /r/{code} redirect already created the click and server attribution.
    // Keep its verified ref code for checkout, but do not count the redirect
    // a second time through the client tracking endpoint.
    const trackedByShortLink = url.searchParams.get("affiliate_redirect") === "1";

    // Stored immediately with the default window so the ref code is never
    // lost if the click-tracking request below is slow/fails; re-stored
    // with the link's real configured window once that request resolves.
    storeReferralCode(refCode);
    if (trackedByShortLink) {
      url.searchParams.delete("ref");
      url.searchParams.delete("affiliate_redirect");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      return;
    }
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
