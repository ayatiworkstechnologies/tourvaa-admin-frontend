import { csrfHeader, type ExternalCampaignSource, type ExternalExperience } from "@/lib/api/externalTours";

const SESSION_KEY = "tourvaa_ext_session";

function sessionId(): string | undefined {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().replace(/-/g, "") : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id.slice(0, 64);
  } catch {
    return undefined;
  }
}

/**
 * Records an outbound affiliate click (Tourvaa analytics only - not a
 * booking). Fire-and-forget with keepalive so it survives the tab switching
 * to Viator; any failure is swallowed so the customer is never blocked.
 * The link itself is a normal <a target="_blank"> to the Viator URL
 * returned by the API, so query parameters (pid, mcid, campaign) are
 * preserved exactly.
 */
export function trackExternalClick(item: ExternalExperience, source: ExternalCampaignSource) {
  try {
    void fetch("/api/public/external-tours/click", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrfHeader() },
      credentials: "include",
      keepalive: true,
      body: JSON.stringify({
        provider: item.source,
        product_code: item.product_code,
        product_title: item.title.slice(0, 255),
        provider_destination_id: item.destination?.provider_destination_id ?? null,
        external_url: item.external_url,
        // Same source the search used, so it matches the URL's campaign.
        source_page: source,
        page_path: typeof window !== "undefined" ? window.location.pathname.slice(0, 255) : null,
        session_id: sessionId(),
      }),
    }).catch(() => {});
  } catch {
    // never block the outbound navigation
  }
}
