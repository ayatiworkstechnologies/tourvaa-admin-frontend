import type { NextConfig } from "next";

if (process.env.NODE_ENV === "production" && !process.env.API_PROXY_TARGET) {
  throw new Error("API_PROXY_TARGET is required in production because /api/:path* proxies to the backend.");
}

const apiProxyTarget = (
  process.env.API_PROXY_TARGET || "http://127.0.0.1:8000"
).replace(/\/$/, "");
const apiProxyOrigin = new URL(apiProxyTarget).origin;

// 'unsafe-eval' is only needed for dev-mode tooling (HMR/fast refresh) -
// a production build should not require it. 'unsafe-inline' stays in both
// script-src and style-src for now: Next.js/Tailwind emit inline
// scripts/styles that would need nonce-based CSP wiring to remove safely,
// which is a larger change than this fix's scope.
// The Elfsight Website Translator widget (platform.js) loads its own
// scripts/styles from *.elfsight.com/*.elfsightcdn.com (per
// https://help.elfsight.com/article/1581 - both must be allowlisted or the
// browser silently blocks the widget and it never renders), but the actual
// phrase-translation API calls it makes at runtime go to a THIRD, distinct
// domain - phrase-translator.wu.elfsightcompute.com - discovered via a
// browser console CSP violation, not documented anywhere. Without
// *.elfsightcompute.com in connect-src the widget UI renders fine but
// picking a language silently fails to translate anything.
const elfsightHosts =
  "https://elfsight.com https://*.elfsight.com https://elfsightcdn.com https://*.elfsightcdn.com https://*.elfsightcompute.com";
const scriptSrc =
  process.env.NODE_ENV === "production"
    ? `script-src 'self' 'unsafe-inline' ${elfsightHosts};`
    : `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${elfsightHosts};`;

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
              `default-src 'self'; ${scriptSrc} style-src 'self' 'unsafe-inline' ${elfsightHosts}; img-src 'self' data: blob: https: ${apiProxyOrigin}; connect-src 'self' ${apiProxyOrigin} ${elfsightHosts} wss://elfsight.com wss://*.elfsight.com; font-src 'self' data: ${elfsightHosts}; frame-ancestors 'none';`,
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
