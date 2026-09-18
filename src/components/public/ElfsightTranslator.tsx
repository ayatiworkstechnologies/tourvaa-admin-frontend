"use client";

import Script from "next/script";

/** Elfsight app id for the Website Translator widget. */
const ELFSIGHT_APP_ID = "4a8eaaa9-dd7a-4a41-b8d2-fc4afb0c4e89";

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
export default function ElfsightTranslator() {
  return (
    <>
      <Script src="https://elfsightcdn.com/platform.js" strategy="afterInteractive" />
      <div className={`elfsight-app-${ELFSIGHT_APP_ID}`} data-elfsight-app-lazy />
    </>
  );
}
