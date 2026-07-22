const TOKEN_KEY = "tourvaa_token";
const LEGACY_USER_KEY = "tourvaa_user";

export function getStoredTokenSafe() {
  return null;
}

export function getToken() {
  return getStoredTokenSafe();
}

export function setToken(token: string) {
  void token;
  clearSession();
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
}

export function isAuthenticated() {
  return false;
}
