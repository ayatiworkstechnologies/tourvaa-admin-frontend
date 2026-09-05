"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LuX as X, LuArrowRight as ArrowRight } from "react-icons/lu";
import { CmsPromoPopup, fetchPromotionalPopups } from "@/lib/api/publicClient";

const DISMISS_KEY = "tourvaa_announcement_dismissed_id";

function isWithinValidRange(popup: CmsPromoPopup) {
  const now = Date.now();
  if (popup.valid_from && new Date(popup.valid_from).getTime() > now) return false;
  if (popup.valid_until && new Date(popup.valid_until).getTime() < now) return false;
  return true;
}

// Reuses the CMS "Promotional Popups" data (title/content/CTA) - the closest
// admin-managed content that fits a bar, even though that CMS tab is built
// for timed modal popups. display_after_seconds/display_frequency are
// intentionally ignored here since a top bar is always-on, not timed.
export default function AnnouncementBar() {
  const [popup, setPopup] = useState<CmsPromoPopup | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    fetchPromotionalPopups()
      .then((items) => {
        if (!active) return;
        const candidate = items.find((item) => item.is_active && isWithinValidRange(item));
        if (candidate) {
          setPopup(candidate);
          setDismissed(sessionStorage.getItem(DISMISS_KEY) === String(candidate.id));
        }
      })
      .catch(() => {
        /* No bar shown if the CMS call fails. */
      });
    return () => {
      active = false;
    };
  }, []);

  if (!popup || dismissed) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, String(popup.id));
    setDismissed(true);
  };

  const content = (
    <>
      <span className="font-bold">{popup.title}</span>
      {popup.content && <span className="text-white/85">{popup.content}</span>}
    </>
  );

  return (
    <div className="relative z-[60] flex items-center justify-center gap-2 bg-pub-primary px-4 py-2 text-center text-xs sm:text-sm text-white">
      {popup.cta_url ? (
        <Link href={popup.cta_url} className="flex flex-wrap items-center justify-center gap-1.5 hover:underline">
          {content}
          {popup.cta_text && (
            <span className="inline-flex items-center gap-1 font-bold text-pub-accent">
              <span>{popup.cta_text}</span>
              <ArrowRight size={13} aria-hidden="true" />
            </span>
          )}
        </Link>
      ) : (
        <span className="flex flex-wrap items-center justify-center gap-1.5">{content}</span>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-3 rounded-full p-1 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
      >
        <X size={14} />
      </button>
    </div>
  );
}
