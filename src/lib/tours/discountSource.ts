import type { TourDiscount } from "@/lib/api/services/tourDetailService";

/**
 * Resolve which pricing stage owns a discount.
 *
 * Creation history is authoritative because older admin-created offers were
 * persisted with the legacy funded_by=SUPPLIER value. This mirrors the
 * backend's discounts._discount_source resolution order.
 */
export function isTourvaaDiscount(discount: TourDiscount): boolean {
  if (discount.added_by === "admin") return true;
  if (discount.added_by === "supplier") return false;
  if (discount.funded_by === "TOURVAA") return true;
  if (discount.funded_by === "SUPPLIER") return false;

  const name = (discount.discount_name || "").toLowerCase();
  if (name.includes("tourvaa")) return true;
  if (name.includes("supplier")) return false;
  return false;
}

/** Combine sequential supplier and Tourvaa percentage reductions. */
export function combinedDiscountPercent(
  supplierPercent: number,
  tourvaaPercent: number,
): number {
  const supplierFactor = 1 - Math.max(0, supplierPercent) / 100;
  const tourvaaFactor = 1 - Math.max(0, tourvaaPercent) / 100;
  return Math.round((1 - supplierFactor * tourvaaFactor) * 10000) / 100;
}
