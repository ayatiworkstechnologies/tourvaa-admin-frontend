import type { NextConfig } from "next";

if (process.env.NODE_ENV === "production" && !process.env.API_PROXY_TARGET) {
  throw new Error("API_PROXY_TARGET is required in production because /api/:path* proxies to the backend.");
}

const apiProxyTarget = (
  process.env.API_PROXY_TARGET || "http://127.0.0.1:8000"
).replace(/\/$/, "");
const apiProxyOrigin = new URL(apiProxyTarget).origin;

// Google Translate loads its widget from translate.google.com and
// serves translated assets from translate.googleapis.com / *.gstatic.com.
// translate.googleapis.com is also used for runtime XHR translation calls.
// fonts.googleapis.com / fonts.gstatic.com are needed if translated pages
// reference Google Fonts via the translate iframe.
const googleTranslateHosts =
  "https://translate.google.com https://translate.googleapis.com https://*.gstatic.com";
const googleFontHosts =
  "https://fonts.googleapis.com https://fonts.gstatic.com";
const scriptSrc =
  process.env.NODE_ENV === "production"
    ? `script-src 'self' 'unsafe-inline' ${googleTranslateHosts};`
    : `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${googleTranslateHosts};`;

// The Turbopack/webpack dev-mode HMR client connects back over its own
// ws://<host>:<port>/_next/webpack-hmr socket. 'self' in connect-src is
// supposed to auto-cover the ws-equivalent of the page's own origin, but
// that isn't reliable across browsers/proxies, so dev mode explicitly
// allows it (prod never serves this endpoint at all).
const devHmrHosts = "ws://localhost:* ws://127.0.0.1:*";
// The admin/agent/supplier/customer messaging inbox opens a WebSocket
// directly against the backend's public origin - Next's rewrites() proxy
// doesn't reliably support WS upgrades, so that traffic can't go through
// the same-origin /api path the rest of the app uses. NEXT_PUBLIC_WS_URL
// must be set to the backend's public wss:// origin for this to work; it
// falls back to deriving one from apiProxyOrigin for local dev only.
const publicWsUrl = (process.env.NEXT_PUBLIC_WS_URL || apiProxyOrigin.replace(/^http/, "ws")).replace(/\/$/, "");
const connectSrc =
  process.env.NODE_ENV === "production"
    ? `connect-src 'self' ${apiProxyOrigin} ${publicWsUrl} ${googleTranslateHosts};`
    : `connect-src 'self' ${apiProxyOrigin} ${publicWsUrl} ${googleTranslateHosts} ${devHmrHosts};`;

const nextConfig: NextConfig = {
  // Produces the minimal server bundle consumed by the production Docker image.
  // Static assets and public files are copied beside this bundle in Dockerfile.
  // Only set for the Docker build - Vercel has its own deployment output and
  // does not generate the trace files "standalone" mode expects, which fails
  // the build with ENOENT on .next/next-server.js.nft.json.
  ...(process.env.NEXT_OUTPUT_STANDALONE === "true" ? { output: "standalone" as const } : {}),
  skipTrailingSlashRedirect: true,
  experimental: {
    // Next 16's rewrites()/proxy layer buffers the whole request body in
    // memory before forwarding it, capped at 10MB by default - silently
    // killing the request with a bare 500 (not a clean 413) once exceeded.
    // /api/uploads/admin-asset accepts video up to 50MB
    // (MAX_ADMIN_VIDEO_SIZE in the backend's uploads router), so this must
    // stay comfortably above that or every video upload 500s before it
    // even reaches the backend.
    proxyClientMaxBodySize: "60mb",
  },
  // Next's dev-server DNS-rebinding protection only allows "localhost" by
  // default, silently dropping HMR websocket connections (and, with them,
  // hydration) when the app is opened via http://127.0.0.1:3000 instead.
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              `default-src 'self'; ${scriptSrc} style-src 'self' 'unsafe-inline' ${googleTranslateHosts} ${googleFontHosts}; img-src 'self' data: blob: https: ${apiProxyOrigin}; media-src 'self' blob: https: ${apiProxyOrigin}; ${connectSrc} font-src 'self' data: ${googleFontHosts} ${googleTranslateHosts}; frame-ancestors 'none';`,
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
      // Keep collection-create requests on the backend's slash-terminated
      // routes. The generic wildcard rewrite can drop the final slash,
      // which turns these POST requests into 405 responses.
      ...["suppliers", "agents", "affiliates"].flatMap((module) => [
        {
          source: `/api/${module}`,
          destination: `${apiProxyTarget}/api/${module}/`,
        },
        {
          source: `/api/${module}/`,
          destination: `${apiProxyTarget}/api/${module}/`,
        },
      ]),
      {
        source: "/api/public/:path*",
        destination: `${apiProxyTarget}/api/public/:path*`,
      },
      // Affiliate short-links (https://tourvaa.com/r/{code}) are served
      // directly by the backend, outside /api, so they stay short/shareable.
      {
        source: "/r/:path*",
        destination: `${apiProxyTarget}/r/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
