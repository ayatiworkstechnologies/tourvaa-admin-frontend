// Affiliate is intentionally hidden, not removed. Keep the implementation and
// data intact so the programme can be restored without a migration.
export const AFFILIATE_ENABLED = false;

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
