import React from "react";
import Link from "next/link";
import { LuCompass as Compass, LuRefreshCw as RefreshCw, LuFolderOpen as FolderOpen } from "react-icons/lu";
import Loader from "@/components/ui/Loader";

// Single Tour Card Shimmer Skeleton
export function PublicTourCardSkeleton() {
  return <div className="rounded-2xl border border-slate-100 bg-white p-4"><Loader label="Loading tour..." compact /></div>;
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
  return <div className="flex h-[340px] items-center justify-center rounded-2xl border border-slate-100 bg-white sm:h-[370px]"><Loader label="Loading destination..." compact /></div>;
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
