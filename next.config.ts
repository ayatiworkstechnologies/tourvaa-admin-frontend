import type { NextConfig } from "next";

const apiProxyTarget = (
  process.env.API_PROXY_TARGET || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
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
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
