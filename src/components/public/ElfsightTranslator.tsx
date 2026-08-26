"use client";

import Script from "next/script";

// Elfsight Website Translator. Renders itself onto document.body directly
// (confirmed by testing) rather than staying inside this mount div, so its
// on-page position is controlled entirely by the Elfsight dashboard's
// widget editor (Custom CSS / placement settings there), not by anything
// here - CSS/DOM tricks from our side can't reach it. CSP allowlisting for
// elfsightcdn.com / *.elfsightcompute.com lives in next.config.ts.
export default function ElfsightTranslator() {
  return (
    <>
      <Script src="https://elfsightcdn.com/platform.js" strategy="lazyOnload" async />
      <div className="elfsight-app-4a8eaaa9-dd7a-4a41-b8d2-fc4afb0c4e89" data-elfsight-app-lazy />
    </>
  );
}
