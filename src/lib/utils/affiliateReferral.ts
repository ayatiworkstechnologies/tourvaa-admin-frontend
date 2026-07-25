const REFERRAL_KEY = "tourvaa_affiliate_ref";
const ATTRIBUTION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30-day last-click attribution

type StoredReferral = {
  code: string;
  expiresAt: number;
};

export function storeReferralCode(code: string) {
  if (typeof window === "undefined") return;
  const entry: StoredReferral = { code, expiresAt: Date.now() + ATTRIBUTION_WINDOW_MS };
  window.localStorage.setItem(REFERRAL_KEY, JSON.stringify(entry));
}

/** Returns the stored referral code if present and not expired; clears it and returns null otherwise. */
export function getActiveReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(REFERRAL_KEY);
  if (!raw) return null;
  try {
    const entry: StoredReferral = JSON.parse(raw);
    if (!entry.code || !entry.expiresAt || Date.now() > entry.expiresAt) {
      window.localStorage.removeItem(REFERRAL_KEY);
      return null;
    }
    return entry.code;
  } catch {
    // Pre-migration plain-string value (no expiry) - drop it rather than trust it forever.
    window.localStorage.removeItem(REFERRAL_KEY);
    return null;
  }
}
