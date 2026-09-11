"use client";

import { useEffect, useRef } from "react";
import { smoothScrollTo } from "./smoothScrollTo";

export interface AutoSlideOptions {
  /** CSS selector matching one card, used to measure the scroll step. */
  cardSelector: string;
  /** Delay between auto-advances, in ms. */
  intervalMs?: number;
  /** Skip wiring up entirely while false (e.g. still loading, or empty). */
  enabled?: boolean;
}

/**
 * Auto-advances a horizontally-scrolling carousel right-to-left (i.e.
 * scrollLeft increases, revealing the next cards) on an interval, looping
 * back to the start at the end. Pauses on any user interaction with the
 * carousel - hover, touch, or pointer down - and resumes shortly after,
 * so autoplay never fights a manual scroll/drag/arrow-click gesture.
 */
export function useAutoSlide(
  scrollRef: React.RefObject<HTMLDivElement | null>,
  { cardSelector, intervalMs = 3500, enabled = true }: AutoSlideOptions,
) {
  const pausedRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resume shortly after interaction ends, rather than instantly, so a
  // sequence of quick manual clicks/swipes doesn't immediately restart
  // autoplay mid-gesture. Exposed so callers (e.g. the manual prev/next
  // arrow buttons, which sit outside the scrollable element itself) can
  // pause autoplay on their own interactions too.
  const notifyInteraction = () => {
    pausedRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, 2500);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !enabled) return;

    const pause = () => {
      pausedRef.current = true;
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
    const scheduleResume = notifyInteraction;

    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", scheduleResume);
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchend", scheduleResume);
    el.addEventListener("pointerdown", pause);
    window.addEventListener("pointerup", scheduleResume);

    const timer = setInterval(() => {
      if (pausedRef.current) return;
      const firstCard = el.querySelector<HTMLElement>(cardSelector);
      const gap = 20; // 1.25rem gap-5, matches every carousel's gap-5
      const step = firstCard ? firstCard.offsetWidth + gap : 320;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - step / 2;
      smoothScrollTo(el, atEnd ? 0 : el.scrollLeft + step, 700);
    }, intervalMs);

    return () => {
      clearInterval(timer);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", scheduleResume);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", scheduleResume);
      el.removeEventListener("pointerdown", pause);
      window.removeEventListener("pointerup", scheduleResume);
    };
  }, [scrollRef, cardSelector, intervalMs, enabled]);

  return { notifyInteraction };
}
