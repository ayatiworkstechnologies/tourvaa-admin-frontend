import type { AuthUser } from "@/types/auth";

const AFFILIATE_OPERATIONAL_ROUTES = [
  "/affiliate/referral-links",
  "/affiliate/payout-methods",
  "/affiliate/payouts",
  "/affiliate/wallet",
];

export function affiliateApprovalStatus(user?: AuthUser | null) {
  return String(user?.approval_status ?? "PENDING").toUpperCase();
}

export function isApprovedAffiliate(user?: AuthUser | null) {
  return affiliateApprovalStatus(user) === "APPROVED" && String(user?.profile_status ?? "").toLowerCase() === "active";
}

export function isAffiliateOperationalRoute(pathname: string) {
  return AFFILIATE_OPERATIONAL_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function canAccessAffiliateRoute(user: AuthUser | null | undefined, pathname: string) {
  const userType = String(user?.user_type ?? "").toUpperCase();
  const accountStatus = String(user?.account_status ?? "ACTIVE").toUpperCase();
  const isAffiliate = userType === "AFFILIATE" || user?.role?.slug === "affiliate";
  if (!isAffiliate || accountStatus !== "ACTIVE" || user?.email_verified === false) return false;
  return !isAffiliateOperationalRoute(pathname) || isApprovedAffiliate(user);
}
