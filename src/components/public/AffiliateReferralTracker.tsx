"use client";

import { useEffect } from "react";

const REFERRAL_KEY = "tourvaa_affiliate_ref";

export default function AffiliateReferralTracker() {
  useEffect(() => {
    const refCode = new URLSearchParams(window.location.search).get("ref")?.trim();
    if (!refCode) return;

    window.localStorage.setItem(REFERRAL_KEY, refCode);
    const trackedKey = `${REFERRAL_KEY}_tracked_${refCode}`;
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
