"use client";

import { useEffect } from "react";
import { storeReferralCode } from "@/lib/utils/affiliateReferral";

const TRACKED_KEY_PREFIX = "tourvaa_affiliate_ref_tracked_";

export default function AffiliateReferralTracker() {
  useEffect(() => {
    const refCode = new URLSearchParams(window.location.search).get("ref")?.trim();
    if (!refCode) return;

    storeReferralCode(refCode);
    const trackedKey = `${TRACKED_KEY_PREFIX}${refCode}`;
    if (window.sessionStorage.getItem(trackedKey)) return;

    window.sessionStorage.setItem(trackedKey, "1");
    void fetch(`/api/affiliates/track/${encodeURIComponent(refCode)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    }).catch(() => {
      window.sessionStorage.removeItem(trackedKey);
    });
  }, []);

  return null;
}
