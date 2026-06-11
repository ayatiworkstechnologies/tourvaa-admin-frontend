import axios from "axios";

const getApiBaseUrl = () => {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL || "/api";

  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    configuredUrl.startsWith("http:")
  ) {
    return "/api";
  }

  return configuredUrl;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("tourvaa_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export default api;
