"use client";

import { LuHeart as Heart } from "react-icons/lu";
import { useTravelStore, type TravelItem } from "@/providers/TravelStoreProvider";

/**
 * The one wishlist control used everywhere.
 *
 * Card heart buttons had drifted into five different looks (icon sizes 15/18/20,
 * some bare on the image, some in a circular badge, different fill colours),
 * so they are centralised here - change the look once and every card follows.
 *
 * `overlay` is the default: a bare heart sitting on a card image, which is what
 * the tour/deal/trending cards use. `badge` puts it in a translucent circle for
 * placements where the heart would otherwise sit on busy or light artwork.
 */
export default function WishlistButton({
  item,
  variant = "overlay",
  className = "",
  wishlisted: wishlistedProp,
  onToggle,
}: {
  item: TravelItem;
  variant?: "overlay" | "badge";
  className?: string;
  /** Override the store's state - for callers that track it themselves. */
  wishlisted?: boolean;
  /** Replaces the default store toggle when the parent owns the action. */
  onToggle?: () => void;
}) {
  const { isWishlisted, toggleWishlist } = useTravelStore();
  const wishlisted = wishlistedProp ?? isWishlisted(item.id);

  const shell =
    variant === "badge"
      ? "flex h-7 w-7 items-center justify-center rounded-full bg-white/85 backdrop-blur-xs shadow-xs hover:bg-white"
      : "flex h-7 w-7 items-center justify-center";

  return (
    <button
      type="button"
      onClick={(e) => {
        // These sit inside a card-wide <Link>, so the navigation has to be
        // suppressed or toggling the heart would also open the tour.
        e.preventDefault();
        e.stopPropagation();
        if (onToggle) onToggle();
        else toggleWishlist(item);
      }}
      aria-label={
        wishlisted
          ? `Remove ${item.title} from wishlist`
          : `Add ${item.title} to wishlist`
      }
      aria-pressed={wishlisted}
      className={`z-10 ${shell} transition-transform duration-200 hover:scale-120 active:scale-90 focus:outline-none cursor-pointer ${className}`}
    >
      <Heart
        size={variant === "badge" ? 15 : 18}
        className={`transition-colors duration-200 ${
          variant === "badge"
            ? wishlisted
              ? "fill-red-500 text-red-500"
              : "fill-none text-slate-700 hover:text-red-500"
            : wishlisted
              ? "fill-red-500 text-red-500 drop-shadow-md"
              : "fill-white text-white drop-shadow-md hover:fill-red-400 hover:text-red-400"
        }`}
      />
    </button>
  );
}
