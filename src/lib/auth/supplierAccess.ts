import type { AuthUser } from "@/types/auth";

const SUPPLIER_OPERATIONAL_ROUTES = [
  "/supplier/tours",
  "/supplier/bookings",
  "/supplier/departures",
  "/supplier/calendar",
  "/supplier/earnings",
  "/supplier/payouts",
  "/supplier/payments",
  "/supplier/reports",
  "/supplier/team",
];

export function supplierApprovalStatus(user?: AuthUser | null) {
  return String(user?.supplier_approval_status ?? user?.approval_status ?? "PENDING").toUpperCase();
}

export function isApprovedSupplier(user?: AuthUser | null) {
  return supplierApprovalStatus(user) === "APPROVED";
}

export function isSupplierOperationalRoute(pathname: string) {
  return SUPPLIER_OPERATIONAL_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function canAccessSupplierRoute(user: AuthUser | null | undefined, pathname: string) {
  const userType = String(user?.user_type ?? "").toUpperCase();
  const accountStatus = String(user?.account_status ?? "ACTIVE").toUpperCase();
  const isSupplier = userType === "SUPPLIER" || user?.role?.slug === "supplier";
  if (!isSupplier || accountStatus !== "ACTIVE" || user?.email_verified === false) return false;
  return !isSupplierOperationalRoute(pathname) || isApprovedSupplier(user);
}
