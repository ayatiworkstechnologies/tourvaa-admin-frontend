const TOKEN_KEY = "tourvaa_token";
const LEGACY_USER_KEY = "tourvaa_user";

export function getStoredTokenSafe() {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getToken() {
  return getStoredTokenSafe();
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem(LEGACY_USER_KEY);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
}

export function isAuthenticated() {
  return Boolean(getStoredTokenSafe());
}
