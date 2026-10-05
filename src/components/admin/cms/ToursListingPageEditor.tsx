"use client";

import PageEditor, { type PageEditorSection } from "./PageEditor";

const SECTIONS: PageEditorSection[] = [
  {
    key: "listing",
    label: "Tours listing content",
    tabs: ["tours-listing"],
    preview: "tours",
  },
];

// The global public tours page has one CMS content block, but it still uses
// the shared PageEditor so administrators get the same responsive live
// preview controls as the Home and Country Pages editors.
export default function ToursListingPageEditor() {
  return (
    <PageEditor
      sections={SECTIONS}
      previewTitle="Live Tours page"
      previewSrc={() => "/tours"}
    />
  );
}
