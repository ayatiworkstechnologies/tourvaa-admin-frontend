import axios from "axios";
import { clearSession, getStoredTokenSafe, setToken } from "@/lib/session";

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

// Separate instance used only for token refresh — no interceptors, so it
// cannot trigger the retry loop.
const authAxios = axios.create({
  baseURL: API_PATH_PREFIX,
});

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function drainQueue(token: string) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

function rejectQueue(error: unknown) {
  refreshQueue.forEach((_, i, arr) => void arr);
  refreshQueue = [];
  void error;
}

function hardLogout() {
  clearSession();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
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
  async (error) => {
    const originalRequest = error?.config;

    if (error?.response?.status === 401 && typeof window !== "undefined") {
      // The refresh call itself failed — nothing left to try.
      if (originalRequest?.url?.includes("/auth/refresh-token")) {
        hardLogout();
        return Promise.reject(error);
      }

      // Already retried once — give up.
      if (originalRequest?._retry) {
        hardLogout();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // Another refresh is already in flight — queue this request.
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
            void reject;
          });
        });
      }

      isRefreshing = true;

      try {
        const currentToken = getStoredTokenSafe();
        const response = await authAxios.post(
          "/auth/refresh-token",
          {},
          { headers: { Authorization: `Bearer ${currentToken}` } }
        );
        const newToken: string = response.data?.data?.access_token;

        if (!newToken) throw new Error("no token in refresh response");

        setToken(newToken);
        drainQueue(newToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        rejectQueue(refreshError);
        isRefreshing = false;
        hardLogout();
        return Promise.reject(error);
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
