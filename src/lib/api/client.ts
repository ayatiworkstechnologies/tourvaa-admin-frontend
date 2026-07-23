import axios from "axios";
import { clearSession } from "@/lib/api/session";

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

const PUBLIC_PAGE_PATHS = [
  "/",
  "/login",
  "/admin/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/verify-email",
  "/account-status",
  "/join",
  "/destinations",
  "/tours",
  "/blogs",
  "/about",
  "/contact",
  "/terms",
  "/cookie-policy",
  "/cancellation-policy",
  "/accessibility",
];

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
  return PUBLIC_PAGE_PATHS.some((publicPath) => pathname === publicPath || pathname.startsWith(`${publicPath}/`));
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
            message: "Access denied. You do not have permission for this action.",
          },
        })
      );
    }

    return Promise.reject(error);
  }
);

export default api;
