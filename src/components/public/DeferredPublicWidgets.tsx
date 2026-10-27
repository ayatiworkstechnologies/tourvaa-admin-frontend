"use client";

import { useEffect, useState, type ComponentType } from "react";

type LoadedWidgets = {
  ChatWidget: ComponentType;
  ElfsightTranslator: ComponentType | null;
};

/**
 * Chat and language translation are useful, but neither is needed to paint
 * the landing content. Loading them after initial interaction time protects
 * the hero's LCP and avoids third-party work during the critical render path.
 */
export default function DeferredPublicWidgets() {
  const [widgets, setWidgets] = useState<LoadedWidgets | null>(null);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      const shouldLoadTranslator = window.matchMedia("(min-width: 1024px)").matches;
      void Promise.all([
        import("./ChatWidget"),
        shouldLoadTranslator ? import("./ElfsightTranslator") : Promise.resolve(null),
      ]).then(([chatModule, translatorModule]) => {
        if (!active) return;
        setWidgets({
          ChatWidget: chatModule.default,
          ElfsightTranslator: translatorModule?.default ?? null,
        });
      });
    }, 4_000);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  if (!widgets) return null;

  const { ChatWidget, ElfsightTranslator } = widgets;
  return (
    <>
      {ElfsightTranslator && <ElfsightTranslator />}
      <ChatWidget />
    </>
  );
}
