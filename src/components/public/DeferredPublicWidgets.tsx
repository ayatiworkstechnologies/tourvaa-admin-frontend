"use client";

import { useEffect, useState, type ComponentType } from "react";

type LoadedWidgets = {
  ChatWidget: ComponentType;
  ElfsightTranslator: ComponentType;
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
      void Promise.all([
        import("./ChatWidget"),
        import("./ElfsightTranslator"),
      ]).then(([chatModule, translatorModule]) => {
        if (!active) return;
        setWidgets({
          ChatWidget: chatModule.default,
          ElfsightTranslator: translatorModule.default,
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
      <ElfsightTranslator />
      <ChatWidget />
    </>
  );
}
