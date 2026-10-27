"use client";

import { useEffect } from "react";
import Script from "next/script";

/** Elfsight app id for the Website Translator widget. */
const ELFSIGHT_APP_ID = "4a8eaaa9-dd7a-4a41-b8d2-fc4afb0c4e89";
const SHADOW_STYLE_ID = "tourvaa-translator-elevation";

/**
 * Elfsight Website Translator.
 *
 * Unlike the Google Translate integration this replaces, Elfsight ships its
 * own language picker UI - it is not driven by the site's own header
 * dropdown, so nothing here reads or writes the `googtrans` cookie.
 *
 * Note that platform.js and the widget's runtime calls must be allowed by the
 * Content-Security-Policy in next.config.ts, or the widget loads and then
 * silently renders nothing.
 */
export default function ElfsightTranslator({ className = "" }: { className?: string }) {
  useEffect(() => {
    const shadowObservers: MutationObserver[] = [];
    const observedRoots = new WeakSet<ShadowRoot>();

    const installMildShadow = () => {
      // Elfsight changes its generated host/class names between widget
      // releases. Scan open shadow hosts instead of relying on one prefix so
      // the same elevation override reaches every portal consistently.
      document
        .querySelectorAll<HTMLElement>("[class*='elfsight'], [class*='eapps'], [class*='eapp']")
        .forEach((host) => {
          const root = host.shadowRoot;
          if (!root) return;

          const ensureStyle = () => {
            if (root.getElementById(SHADOW_STYLE_ID)) return;
            const style = document.createElement("style");
            style.id = SHADOW_STYLE_ID;
            style.textContent = `
              :host {
                filter: none !important;
                box-shadow: none !important;
              }

              [class^="background__Container"],
              [class*=" background__Container"],
              [class^="Background__Container"],
              [class*=" Background__Container"] {
                box-shadow: 0 2px 7px rgba(15, 23, 42, 0.13) !important;
                filter: none !important;
              }
            `;
            root.prepend(style);
          };

          ensureStyle();
          if (!observedRoots.has(root)) {
            observedRoots.add(root);
            const observer = new MutationObserver(ensureStyle);
            observer.observe(root, { childList: true });
            shadowObservers.push(observer);
          }
        });
    };

    installMildShadow();
    const documentObserver = new MutationObserver(installMildShadow);
    documentObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      documentObserver.disconnect();
      shadowObservers.forEach((observer) => observer.disconnect());
    };
  }, []);

  return (
    <>
      <Script src="https://elfsightcdn.com/platform.js" strategy="afterInteractive" />
      <div className={`elfsight-app-${ELFSIGHT_APP_ID} ${className}`.trim()} data-elfsight-app-lazy />
    </>
  );
}
