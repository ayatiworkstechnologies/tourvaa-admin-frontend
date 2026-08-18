"use client";

// Shared "Save X% today" discount display, styled after the on-the-go-tours.com
// reference: a red badge plus a struck-through original price next to the
// discounted one. Reused on tour cards (as a badge on the image) and on the
// tour detail page (as a banner + struck price). Driven entirely by
// discount_percentage/original_price_per_person/discounted_price_per_person,
// which the backend only populates when a tour has an active TourDiscount -
// including a date-ranged one for a low-season month, so this same style
// applies automatically whenever one is configured.

export type DiscountInfo = {
  discount_percentage?: number | null;
  original_price_per_person?: number | null;
  discounted_price_per_person?: number | null;
};

export function hasActiveDiscount(tour: DiscountInfo): boolean {
  return Boolean(tour.discount_percentage && tour.discount_percentage > 0 && tour.original_price_per_person != null && tour.discounted_price_per_person != null);
}

/** Small red corner badge for a tour card image, e.g. "30% OFF". */
export function DiscountCardBadge({ percentage }: { percentage: number }) {
  return (
    <span className="absolute right-3 top-3 rounded-full bg-red-600 px-3 py-1.5 text-xs font-black text-white shadow-md">
      {percentage}% OFF
    </span>
  );
}

/** Larger "Save up to X% today" banner pill for the tour detail page. */
export function DiscountBanner({ percentage }: { percentage: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-red-600 px-5 py-2 text-sm font-black text-white shadow-md">
      Save {percentage}% today
    </span>
  );
}

/** Struck-through original price next to the discounted price, e.g. "$2,260pp $1,130pp". */
export function DiscountPriceLine({
  original,
  discounted,
  currency,
  format,
  suffix = "pp",
  size = "md",
}: {
  original: number;
  discounted: number;
  currency: string;
  format: (amount: number, currency?: string) => string;
  suffix?: string;
  size?: "sm" | "md" | "lg";
}) {
  const originalClass = size === "lg" ? "text-lg" : size === "sm" ? "text-xs" : "text-sm";
  const discountedClass = size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-xl";
  return (
    <span className="flex flex-col">
      <s className={`${originalClass} font-semibold text-red-400`}>{format(original, currency)}{suffix}</s>
      <b className={`${discountedClass} font-black text-slate-950`}>{format(discounted, currency)}<span className="text-xs font-semibold text-slate-400">{suffix}</span></b>
    </span>
  );
}
