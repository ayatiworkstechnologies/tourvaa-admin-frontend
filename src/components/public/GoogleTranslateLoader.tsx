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

      {/* Must run before the widget does. Google Translate rewrites text
          nodes into <font> wrappers directly in the DOM; React then tries to
          remove/insert around nodes that are no longer where its fiber tree
          expects, and throws NotFoundError ("insertBefore ... not a child of
          this node"), which takes the whole page down. Making these two DOM
          methods no-op instead of throwing when the parent no longer matches
          is the standard mitigation - React recovers on its next render. */}
      {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document -- must run before React hydrates */}
      <Script id="google-translate-react-guard" strategy="beforeInteractive">
        {`
          (function () {
            if (typeof Node !== "function" || !Node.prototype || Node.prototype.__tvTranslateGuard) return;
            Node.prototype.__tvTranslateGuard = true;
            var removeChild = Node.prototype.removeChild;
            Node.prototype.removeChild = function (child) {
              if (child.parentNode !== this) return child;
              return removeChild.apply(this, arguments);
            };
            var insertBefore = Node.prototype.insertBefore;
            Node.prototype.insertBefore = function (newNode, referenceNode) {
              if (referenceNode && referenceNode.parentNode !== this) return newNode;
              return insertBefore.apply(this, arguments);
            };
          })();
        `}
      </Script>

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
