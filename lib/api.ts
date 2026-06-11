import axios from "axios";

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

    const token = localStorage.getItem("tourvaa_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export default api;
