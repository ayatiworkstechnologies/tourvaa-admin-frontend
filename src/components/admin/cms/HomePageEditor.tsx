"use client";

import PageEditor, { type PageEditorSection } from "./PageEditor";

// The homepage top to bottom - one entry per visible block, each stacking
// the CMS editors that feed it.
const HOME_SECTIONS: PageEditorSection[] = [
  { key: "top-bar", label: "Top Bar", tabs: ["trust-bar", "top-bar"] },
  { key: "hero", label: "Hero & Offer Strip", tabs: ["banners"] },
  { key: "slogan", label: "Slogan under Search", tabs: ["slogans"] },
  { key: "top-deals", label: "Top Deals", tabs: ["tours-on-deals"] },
  { key: "favourite", label: "Favourite Countries", tabs: ["favourite-countries"] },
  { key: "about", label: "About Tourvaa", tabs: ["about-section"] },
  { key: "trending", label: "Trending Tours", tabs: ["popular-tours"] },
  { key: "blog", label: "Blog Card", tabs: ["blog-teaser"] },
  { key: "handpicked", label: "Handpicked Tours", tabs: ["handpicked-tours", "handpicked-heading"] },
  { key: "countries", label: "Countries Worth Exploring", tabs: ["popular-destinations", "countries-heading"] },
  { key: "testimonials", label: "Testimonials", tabs: ["testimonials-heading", "customer-reviews"] },
  { key: "airport", label: "Airport Transfers", tabs: ["airport-transfer"] },
  { key: "faq", label: "FAQ", tabs: ["faq-heading", "help-centre"] },
  { key: "support", label: "Support Card", tabs: ["travel-support"] },
  { key: "offers", label: "Special Offers Card", tabs: ["newsletter-banner"] },
];

export default function HomePageEditor() {
  return <PageEditor sections={HOME_SECTIONS} previewTitle="Live homepage" previewSrc={() => "/"} />;
}
