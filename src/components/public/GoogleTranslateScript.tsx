"use client";

import Script from "next/script";

export default function GoogleTranslateScript() {
  return (
    <>
      <div id="google_translate_element" aria-hidden="true" />
      <Script
        id="google-translate-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            function googleTranslateElementInit() {
              try {
                if (window.google && window.google.translate) {
                  new window.google.translate.TranslateElement({
                    pageLanguage: 'en',
                    autoDisplay: false
                  }, 'google_translate_element');
                }
              } catch(e) {
                console.warn('Translate init error:', e);
              }
            }
          `,
        }}
      />
      <Script
        id="google-translate-script"
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
}
