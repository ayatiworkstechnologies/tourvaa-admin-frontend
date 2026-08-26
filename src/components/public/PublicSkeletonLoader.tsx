import React from "react";
import Link from "next/link";
import {
  LuCompass as Compass,
  LuSearch as Search,
  LuRefreshCw as RefreshCw,
  LuFolderOpen as FolderOpen,
} from "react-icons/lu";

// Single Tour Card Shimmer Skeleton
export function PublicTourCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-xs">
      {/* Image container shimmer */}
      <div className="animate-shimmer relative aspect-[4/3] w-full rounded-xl bg-slate-200" />

      {/* Content lines shimmer */}
      <div className="mt-3.5 space-y-2.5 px-1 pb-2">
        {/* Destination & Duration pills */}
        <div className="flex items-center gap-2">
          <div className="animate-shimmer h-4 w-20 rounded-md bg-slate-200" />
          <div className="animate-shimmer h-4 w-16 rounded-md bg-slate-200" />
        </div>

        {/* Title */}
        <div className="animate-shimmer h-5 w-4/5 rounded-md bg-slate-200" />
        <div className="animate-shimmer h-4 w-3/5 rounded-md bg-slate-200" />

        {/* Stars & Rating */}
        <div className="animate-shimmer h-3.5 w-24 rounded bg-slate-200 mt-2" />

        {/* Pricing & CTA Button */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="space-y-1">
            <div className="animate-shimmer h-3 w-12 rounded bg-slate-200" />
            <div className="animate-shimmer h-5 w-24 rounded bg-slate-200" />
          </div>
          <div className="animate-shimmer h-9 w-24 rounded-xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

// Grid of Tour Card Skeletons
export function PublicTourGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <PublicTourCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Destination Card Skeleton
export function PublicDestinationCardSkeleton() {
  return (
    <div className="animate-shimmer relative h-[340px] sm:h-[370px] w-full overflow-hidden rounded-2xl bg-slate-200 shadow-sm" />
  );
}

// Universal Empty State Component with Modern Aesthetic
export function PublicEmptyState({
  icon: Icon = FolderOpen,
  title = "No Tours Found",
  description = "We couldn’t find any matching experiences for your search criteria. Try adjusting your destination, dates, or filters.",
  actionLabel = "Browse All Tours",
  actionHref = "/tours",
  onReset,
}: {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onReset?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/80 p-8 sm:p-12 text-center shadow-xs">
      {/* Icon Circle */}
      <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-orange-50 text-[#d95d2c] shadow-inner">
        <Icon size={32} className="shrink-0" />
      </div>

      {/* Title & Description */}
      <h3 className="mt-5 text-lg sm:text-xl font-black text-slate-950">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-xs sm:text-sm text-slate-500 leading-relaxed">
        {description}
      </p>

      {/* Action CTA */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95"
          >
            <RefreshCw size={14} />
            <span>Reset Filters</span>
          </button>
        )}
        {actionHref && (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0b1e34] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-[#163354] active:scale-95"
          >
            <Compass size={16} className="text-[#d95d2c]" />
            <span>{actionLabel}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
