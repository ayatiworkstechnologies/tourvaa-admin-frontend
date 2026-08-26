"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CONSENT_KEY = "tourvaa_cookie_consent";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) setVisible(true);
    } catch {
      // localStorage unavailable (private mode / blocked) - skip the banner
      // rather than risk throwing on every page load.
    }
  }, []);

  const choose = (value: "accepted" | "declined") => {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      // Choice just won't persist across reloads - not worth surfacing.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-3 z-[65] mx-auto max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:inset-x-auto sm:left-4 sm:right-auto"
    >
      <p className="text-xs leading-relaxed text-slate-600">
        We use cookies to run the site, remember your preferences, and understand how it&apos;s used. See our{" "}
        <Link href="/cookie-policy" className="font-bold text-pub-primary underline hover:text-pub-accent">
          Cookie Policy
        </Link>{" "}
        for details.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => choose("declined")}
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => choose("accepted")}
          className="flex-1 rounded-xl bg-pub-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-pub-primary-dark"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
