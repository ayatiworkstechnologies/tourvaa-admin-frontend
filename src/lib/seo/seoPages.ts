/** Public pages whose <title>/meta description can be overridden from
 * Admin > Website CMS > SEO & Meta Tags. Stored in the `page_seo` content
 * block as { [path]: { title, description, keywords } }; an empty field falls back to
 * the built-in copy in PAGE_METADATA. Shared by the admin editor (client)
 * and cmsMetadataFor (server). */
export const PAGE_SEO_BLOCK_KEY = "page_seo";

export const SEO_TITLE_LIMIT = 60;
export const SEO_DESCRIPTION_LIMIT = 160;
export const SEO_KEYWORDS_LIMIT = 255;

export type PageSeoOverride = { title?: string; description?: string; keywords?: string };
export type PageSeoMap = Record<string, PageSeoOverride>;

export const EDITABLE_SEO_PAGES: { path: string; label: string; group: string }[] = [
  { path: "/", label: "Home Page", group: "Main pages" },
  { path: "/tours", label: "Browse Tours", group: "Main pages" },
  { path: "/destinations", label: "Destinations", group: "Main pages" },
  { path: "/deals", label: "Deals & Specials", group: "Main pages" },
  { path: "/blogs", label: "Blogs / Travel Guides", group: "Main pages" },
  { path: "/about", label: "About Us", group: "Main pages" },
  { path: "/contact", label: "Contact Us", group: "Main pages" },
  { path: "/travel-advice", label: "Travel Advice", group: "Help & information" },
  { path: "/help-centre", label: "Help Centre", group: "Help & information" },
  { path: "/terms", label: "Terms & Conditions", group: "Legal" },
  { path: "/privacy-policy", label: "Privacy Policy", group: "Legal" },
  { path: "/cookie-policy", label: "Cookie Policy", group: "Legal" },
  { path: "/cancellation-policy", label: "Cancellation Policy", group: "Legal" },
  { path: "/accessibility", label: "Accessibility", group: "Legal" },
  { path: "/supplier-portal", label: "Supplier Portal", group: "Partner pages" },
  { path: "/agent-portal", label: "Agent Portal", group: "Partner pages" },
  { path: "/affiliate-portal", label: "Affiliate Portal", group: "Partner pages" },

];

/** Collapses newlines/extra spaces so a pasted multi-line SEO text renders
 * as one clean meta description. */
export function cleanMetaText(value: string | null | undefined): string {
  return (value || "").replace(/\s+/g, " ").trim();
}
