"use client";

import Script from "next/script";

/**
 * Loads the Google Translate widget that actually performs the translation.
 *
 * The language picker (LanguageCurrencySelector) only sets the `googtrans`
 * cookie and calls `TranslateElement.getInstance().setLanguage()`,
 * and globals.css already hides the widget's banner and parks
 * `#google_translate_element` offscreen - but nothing ever loaded the script or
 * rendered that container, so selecting a language set the cookie, reloaded the
 * page, and translated nothing.
 *
 * `autoDisplay: false` keeps Google from popping its own banner, since the site
 * drives language entirely through its own UI.
 */
export default function GoogleTranslateLoader() {
  return (
    <>
      {/* Styled offscreen by globals.css - the widget must exist in the DOM
          for Google's script to attach to, but is never shown. */}
      <div id="google_translate_element" aria-hidden="true" />

      <Script id="google-translate-init" strategy="afterInteractive">
        {`
          window.googleTranslateElementInit = function () {
            if (!window.google || !window.google.translate || !window.google.translate.TranslateElement) return;
            new window.google.translate.TranslateElement(
              { pageLanguage: "en", autoDisplay: false },
              "google_translate_element"
            );
          };
        `}
      </Script>

      <Script
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
}
