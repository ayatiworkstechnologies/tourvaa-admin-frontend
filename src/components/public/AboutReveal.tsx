"use client";

import { useEffect, useRef } from "react";

import styles from "./AboutReveal.module.css";

export default function AboutReveal({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => { item.dataset.visible = "true"; });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).dataset.visible = "true";
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -40px" },
    );

    items.forEach((item) => observer.observe(item));
    // IntersectionObserver can be throttled during restored tabs, print mode, or
    // automated full-page capture. Never leave page content permanently hidden.
    const revealFallback = window.setTimeout(() => {
      items.forEach((item) => { item.dataset.visible = "true"; });
    }, 2500);

    return () => {
      window.clearTimeout(revealFallback);
      observer.disconnect();
    };
  }, []);

  return <div ref={rootRef} className={styles.root}>{children}</div>;
}
