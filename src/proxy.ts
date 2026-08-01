import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16 renamed the `middleware.ts`/`middleware()` convention to
// `proxy.ts`/`proxy()` - see node_modules/next/dist/docs/.../file-conventions/proxy.md.
// This is defense-in-depth alongside the client-side route guards
// (ProtectedRoute/AdminRouteGuard): those own permission-level checks and
// avoid a content flash, but with no server-side check at all, a page that
// forgets to render a guard component ships its HTML/RSC payload to an
// unauthenticated client. This only checks that a session cookie exists -
// the backend independently enforces auth/permissions on every API call.

const ACCESS_COOKIE = "tourvaa_access";

const PROTECTED_PREFIXES = ["/admin", "/customer", "/agent", "/supplier", "/affiliate"];

const PUBLIC_EXCEPTIONS = ["/admin/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_EXCEPTIONS.includes(pathname)) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  if (!isProtected) {
    return NextResponse.next();
  }

  if (request.cookies.has(ACCESS_COOKIE)) {
    return NextResponse.next();
  }

  const loginPath = pathname.startsWith("/admin") ? "/admin/login" : "/login";
  const url = new URL(loginPath, request.url);
  url.searchParams.set("redirect", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/customer/:path*", "/agent/:path*", "/supplier/:path*", "/affiliate/:path*"],
};
