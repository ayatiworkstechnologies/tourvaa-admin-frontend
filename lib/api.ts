import axios from "axios";
import { clearSession, getStoredTokenSafe } from "@/lib/session";

const API_PATH_PREFIX = "/api";

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

const api = axios.create({
  baseURL: API_PATH_PREFIX,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    config.baseURL = API_PATH_PREFIX;
    config.url = normalizeApiUrl(config.url);

    const token = getStoredTokenSafe();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      clearSession();
      if (!window.location.pathname.startsWith("/login")) {
        window.dispatchEvent(
          new CustomEvent("tourvaa:toast", {
            detail: {
              type: "warning",
              message: "Your session has expired. Please log in again.",
            },
          })
        );
        window.location.assign("/login");
      }
    }

    if (typeof window !== "undefined" && error?.response?.status === 403) {
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
