"use client";

import { LuHeart as Heart } from "react-icons/lu";
import { useTravelStore, type TravelItem } from "@/providers/TravelStoreProvider";

/**
 * The one wishlist control used everywhere.
 *
 * Card heart buttons had drifted into several different looks. This is the
 * single, deliberately background-free overlay treatment used on every card.
 * `badge` remains accepted temporarily for existing callers, but no longer
 * renders a white circular background.
 */
export default function WishlistButton({
  item,
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

  const shell = "flex h-7 w-7 items-center justify-center";

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
        size={18}
        className={`transition-colors duration-200 ${
          wishlisted
            ? "fill-red-500 text-red-500 drop-shadow-md"
            : "fill-white text-white drop-shadow-md hover:fill-red-400 hover:text-red-400"
        }`}
      />
    </button>
  );
}
