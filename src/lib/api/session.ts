const TOKEN_KEY = "tourvaa_token";
const LEGACY_USER_KEY = "tourvaa_user";
const DOCS_CAPTURE_KEY = "tourvaa_docs_dashboard";

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
  localStorage.removeItem(DOCS_CAPTURE_KEY);
}
