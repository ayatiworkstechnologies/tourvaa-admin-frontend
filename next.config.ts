import type { NextConfig } from "next";

if (process.env.NODE_ENV === "production" && !process.env.API_PROXY_TARGET) {
  throw new Error("API_PROXY_TARGET is required in production because /api/:path* proxies to the backend.");
}

const apiProxyTarget = (
  process.env.API_PROXY_TARGET || "http://127.0.0.1:8000"
).replace(/\/$/, "");
const apiProxyOrigin = new URL(apiProxyTarget).origin;

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https: ${apiProxyOrigin}; connect-src 'self' ${apiProxyOrigin}; font-src 'self' data:; frame-ancestors 'none';`,
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  // Browser requests to /api/:path* are proxied to API_PROXY_TARGET/api/:path*.
  async rewrites() {
    return [
      {
        source: "/storage/:path*",
        destination: `${apiProxyTarget}/storage/:path*`,
      },
      {
        source: "/api/users",
        destination: `${apiProxyTarget}/api/users/`,
      },
      {
        source: "/api/users/",
        destination: `${apiProxyTarget}/api/users/`,
      },
      {
        source: "/api/roles",
        destination: `${apiProxyTarget}/api/roles/`,
      },
      {
        source: "/api/roles/",
        destination: `${apiProxyTarget}/api/roles/`,
      },
      {
        source: "/api/permissions",
        destination: `${apiProxyTarget}/api/permissions/`,
      },
      {
        source: "/api/permissions/",
        destination: `${apiProxyTarget}/api/permissions/`,
      },
      {
        source: "/api/settings",
        destination: `${apiProxyTarget}/api/settings/`,
      },
      {
        source: "/api/settings/",
        destination: `${apiProxyTarget}/api/settings/`,
      },
      {
        source: "/api/email-templates",
        destination: `${apiProxyTarget}/api/email-templates/`,
      },
      {
        source: "/api/email-templates/",
        destination: `${apiProxyTarget}/api/email-templates/`,
      },
      {
        source: "/api/public/:path*",
        destination: `${apiProxyTarget}/api/public/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
