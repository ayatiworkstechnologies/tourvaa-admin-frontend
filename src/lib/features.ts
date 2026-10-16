// The affiliate programme is live. This flag controls the public portal,
// referral tracking, and affiliate-specific administration surfaces.
export const AFFILIATE_ENABLED = true;

export function isAffiliatePath(pathname: string) {
  return (
    pathname === "/affiliate" ||
    pathname.startsWith("/affiliate/") ||
    pathname === "/affiliate-portal" ||
    pathname.startsWith("/affiliate-portal/") ||

    pathname === "/admin/affiliates" ||
    pathname.startsWith("/admin/affiliates/") ||
    pathname === "/admin/cms/affiliate-portal" ||
    pathname.startsWith("/admin/cms/affiliate-portal-")
  );
}
