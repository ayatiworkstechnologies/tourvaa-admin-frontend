"use client";

import Script from "next/script";

// Elfsight's SDK portals the widget's actual rendered UI straight to <body>
// with its own fixed positioning, regardless of where this source div sits
// in the tree - so its position here doesn't matter, it just needs to exist
// once per page. It defaults to a small pill fixed to the top-right corner
// of the viewport and its script actively reasserts that position (even a
// synchronous inline !important override gets ignored), so it can't be
// relocated from our side - only from this widget's placement setting on
// the Elfsight dashboard. PublicHeader reserves right-side clearance for it
// instead of fighting it.
export default function ElfsightTranslator() {
  return (
    <>
      <Script src="https://elfsightcdn.com/platform.js" strategy="lazyOnload" />
      <div
        className="elfsight-app-4a8eaaa9-dd7a-4a41-b8d2-fc4afb0c4e89"
        data-elfsight-app-lazy
      />
    </>
  );
}
