"use client";

import { useEffect, useRef } from "react";

import styles from "./AboutReveal.module.css";

export default function AboutReveal({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const observer = "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              (entry.target as HTMLElement).dataset.visible = "true";
              observer?.unobserve(entry.target);
            });
          },
          { threshold: 0.14, rootMargin: "0px 0px -40px" },
        )
      : null;

    const registerRevealItems = (scope: ParentNode) => {
      const items = Array.from(scope.querySelectorAll<HTMLElement>("[data-reveal]"));
      if (scope instanceof HTMLElement && scope.matches("[data-reveal]")) items.unshift(scope);
      items.forEach((item) => {
        if (item.dataset.visible === "true") return;
        if (observer) observer.observe(item);
        else item.dataset.visible = "true";
      });
    };

    registerRevealItems(root);

    // CMS blocks replace their fallback records after the initial fetch.
    // Observe those inserted cards too, otherwise they remain transparent and
    // look like empty grid spaces even though their content was saved.
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) registerRevealItems(node);
        });
      });
    });
    mutationObserver.observe(root, { childList: true, subtree: true });

    // IntersectionObserver can be throttled during restored tabs, print mode, or
    // automated full-page capture. Never leave page content permanently hidden.
    const revealFallback = window.setTimeout(() => {
      root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((item) => {
        item.dataset.visible = "true";
        observer?.unobserve(item);
      });
    }, 2500);

    return () => {
      window.clearTimeout(revealFallback);
      mutationObserver.disconnect();
      observer?.disconnect();
    };
  }, []);

  return <div ref={rootRef} className={styles.root}>{children}</div>;
}
