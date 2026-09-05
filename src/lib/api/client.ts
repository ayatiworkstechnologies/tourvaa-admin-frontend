import axios from "axios";
import { clearSession } from "@/lib/api/session";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";

const API_PATH_PREFIX = "/api";
const PUBLIC_API_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/register/customer",
  "/auth/register/supplier",
  "/auth/register/agent",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/reset-password/validate",
  "/auth/verify-email",
  "/auth/complete-registration",
  "/auth/resend-verification",
  "/auth/change-registration-email",
  "/auth/account-status",
  "/roles/public/options",
  "/countries",
  "/states",
  "/cities",
  "/public",
];

// Portal route groups that genuinely require an active session. Everything
// else (marketing pages, /tours, /wishlist, /compare, /booking, and any
// future public page) is guest-accessible, so a 401 from the silent
// session-restore check on mount must never force-redirect there - an
// explicit allowlist of public pages goes stale the moment a new public
// page is added (this is exactly what happened with /wishlist and /compare).
const PROTECTED_PAGE_PREFIXES = ["/admin", "/customer", "/supplier", "/agent", "/affiliate"];
// Auth entry points nested under an otherwise-protected prefix stay public.
const PROTECTED_PREFIX_EXCEPTIONS = ["/admin/login"];

function normalizeApiUrl(url?: string) {
  if (!url) return url;

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.pathname.startsWith(API_PATH_PREFIX)) {
      return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    }
  } catch {
    return url;
  }

  return url;
}

function getApiPath(url?: string) {
  const normalized = normalizeApiUrl(url) || "";
  const path = normalized.startsWith(API_PATH_PREFIX)
    ? normalized.slice(API_PATH_PREFIX.length)
    : normalized;
  return path.split("?")[0].split("#")[0] || "/";
}

function isPublicApiPath(url?: string) {
  const path = getApiPath(url);
  return PUBLIC_API_PATHS.some((publicPath) => path === publicPath || path.startsWith(`${publicPath}/`));
}

function isPublicPagePath(pathname: string) {
  if (PROTECTED_PREFIX_EXCEPTIONS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return true;
  }
  return !PROTECTED_PAGE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

// Double-submit CSRF: the backend sets this as a non-httponly cookie
// alongside the auth cookies (see _set_auth_cookies in routers/auth.py), we
// read it back and echo it as a header so CsrfMiddleware can confirm the
// request came from this app rather than a cross-site form/fetch.
const CSRF_COOKIE_NAME = "tourvaa_csrf";
const CSRF_HEADER_NAME = "X-CSRF-Token";
const UNSAFE_METHODS = new Set(["post", "put", "patch", "delete"]);

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

const api = axios.create({
  baseURL: API_PATH_PREFIX,
  withCredentials: true,
});

// Separate instance used only for token refresh - no interceptors, so it
// cannot trigger the retry loop.
const authAxios = axios.create({
  baseURL: API_PATH_PREFIX,
  withCredentials: true,
});

let isRefreshing = false;
let refreshQueue: Array<{ resolve: () => void; reject: (error: unknown) => void }> = [];

function drainQueue() {
  refreshQueue.forEach(({ resolve }) => resolve());
  refreshQueue = [];
}

function rejectQueue(error: unknown) {
  refreshQueue.forEach(({ reject }) => reject(error));
  refreshQueue = [];
}

function hardLogout() {
  clearSession();
  if (typeof window !== "undefined" && !isPublicPagePath(window.location.pathname)) {
    window.dispatchEvent(
      new CustomEvent("tourvaa:toast", {
        detail: {
          type: "warning",
          message: "Your session has expired. Please log in again.",
        },
      })
    );
    window.location.assign(window.location.pathname.startsWith("/admin") ? "/admin/login" : "/login");
  }
}

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    config.baseURL = API_PATH_PREFIX;
    config.url = normalizeApiUrl(config.url);

    const method = (config.method || "get").toLowerCase();
    if (UNSAFE_METHODS.has(method)) {
      const csrfToken = getCookie(CSRF_COOKIE_NAME);
      if (csrfToken) {
        config.headers = config.headers ?? {};
        config.headers[CSRF_HEADER_NAME] = csrfToken;
      }
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;

    if (error?.response?.status === 401 && typeof window !== "undefined" && !isPublicApiPath(originalRequest?.url)) {
      // The refresh call itself failed - nothing left to try.
      if (originalRequest?.url?.includes("/auth/refresh-token")) {
        hardLogout();
        return Promise.reject(error);
      }

      // Already retried once - give up.
      if (originalRequest?._retry) {
        hardLogout();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // Another refresh is already in flight - queue this request.
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: () => {
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        await authAxios.post("/auth/refresh-token", { client_type: "web-cookie" });
        drainQueue();
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        rejectQueue(refreshError);
        isRefreshing = false;
        hardLogout();
        return Promise.reject(error);
      }
    }

    const method = (originalRequest?.method || "get").toLowerCase();
    if (typeof window !== "undefined" && error?.response?.status === 403 && method !== "get") {
      window.dispatchEvent(
        new CustomEvent("tourvaa:toast", {
          detail: {
            type: "error",
            message: getApiErrorMessage(error),
          },
        })
      );
    }

    return Promise.reject(error);
  }
);

export default api;
