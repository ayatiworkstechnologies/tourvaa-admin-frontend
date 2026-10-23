"use client";

import { useMemo, useState } from "react";
import {
  LuX as X,
  LuSparkles as Sparkles,
  LuMapPin as MapPin,
  LuClock as Clock,
  LuUsers as Users,
  LuCircleCheck as CheckCircle2,
  LuCircleAlert as AlertCircle,
  LuSmartphone as Smartphone,
  LuMonitor as Monitor,
  LuShieldCheck as ShieldCheck,
  LuCompass as Compass,
} from "react-icons/lu";
import type { StepStatus } from "./steps";

type Tour = Record<string, unknown>;

export function LiveTourPreview({
  tour,
  isOpen,
  onClose,
  statuses,
  counts,
}: {
  tour: Tour | null;
  isOpen: boolean;
  onClose: () => void;
  statuses: Record<number, StepStatus>;
  counts: Record<string, number>;
}) {
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");

  const title = String(tour?.title || "").trim() || "Untitled Tour Experience";
  const subtitle = String(tour?.subtitle || "").trim();
  const bannerImage = String(tour?.banner_image || tour?.cover_image || "").trim();
  const days = Number(tour?.number_of_days || 1);
  const currency = String(tour?.currency || "USD").toUpperCase();
  const startLocation = String(tour?.start_location || "").trim();
  const maxGroupSize = tour?.max_group_size ? Number(tour.max_group_size) : null;

  // Calculate Tour Readiness Score
  const readiness = useMemo(() => {
    let score = 0;
    const tips: string[] = [];

    // Title & duration (20 pts)
    if (tour?.title && days >= 1) {
      score += 20;
    } else {
      tips.push("Add a compelling tour title and duration in Step 01");
    }

    // Location & Category (15 pts)
    if (tour?.country_id && tour?.category_id) {
      score += 15;
    } else {
      tips.push("Set the country and category in Step 02");
    }

    // Itinerary (20 pts)
    if ((counts.itineraries ?? 0) >= 1) {
      score += 20;
    } else {
      tips.push("Add day-by-day itinerary plans in Step 03");
    }

    // Pricing (20 pts)
    if ((counts.pricing ?? 0) >= 1) {
      score += 20;
    } else {
      tips.push("Add at least one active pricing tier in Step 04");
    }

    // Calendar / departures (10 pts)
    if ((counts.calendar ?? 0) >= 1) {
      score += 10;
    } else {
      tips.push("Generate departure dates or schedules in Step 05");
    }

    // Media / Photos (15 pts)
    if (bannerImage || (counts.gallery ?? 0) >= 1) {
      score += 15;
    } else {
      tips.push("Upload cover & gallery images in Step 09 to attract travelers");
    }

    let badge = "Getting Started";
    let color = "text-amber-600 bg-amber-50 border-amber-200";
    if (score >= 90) {
      badge = "Market Ready";
      color = "text-emerald-700 bg-emerald-50 border-emerald-300";
    } else if (score >= 60) {
      badge = "Looking Great";
      color = "text-blue-700 bg-blue-50 border-blue-200";
    } else if (score >= 35) {
      badge = "In Progress";
      color = "text-indigo-700 bg-indigo-50 border-indigo-200";
    }

    const completedStepsCount = Object.values(statuses).filter((s) => s === "complete").length;

    return { score, tips: tips.slice(0, 3), badge, color, completedStepsCount };
  }, [tour, days, counts, bannerImage, statuses]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="live-preview-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="relative flex flex-col w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 transition-all animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 id="live-preview-title" className="text-base font-bold text-slate-900">
                Live Tour Card Preview
              </h2>
              <p className="text-xs text-slate-500">
                Real-time preview of how travellers see your tour on Tourvaa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Device Switcher */}
            <div className="hidden sm:inline-flex items-center rounded-xl bg-white p-1 border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setDeviceView("desktop")}
                aria-label="Desktop view"
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  deviceView === "desktop"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Monitor size={13} />
                <span>Card</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceView("mobile")}
                aria-label="Mobile view"
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  deviceView === "mobile"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Smartphone size={13} />
                <span>Mobile</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close live preview"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Tour Readiness Gauge */}
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 sm:p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-white shadow-xs border border-slate-200">
                  <span className="text-base font-black text-slate-900 tabular-nums">
                    {readiness.score}%
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Tour Quality Score
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${readiness.color}`}>
                      {readiness.badge}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      ({readiness.completedStepsCount}/11 steps complete)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {readiness.score >= 90
                      ? "Outstanding! Your tour is complete and primed for high booking conversion."
                      : "Complete the suggested steps below to maximize traveler interest."}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            {readiness.tips.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Suggested Next Steps:
                </p>
                {readiness.tips.map((tip) => (
                  <div key={tip} className="flex items-center gap-2 text-xs text-slate-700">
                    <AlertCircle size={13} className="text-blue-600 shrink-0" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Live Card Representation */}
          <div className="flex justify-center">
            <div
              className={`w-full transition-all ${
                deviceView === "mobile" ? "max-w-[340px]" : "max-w-[420px]"
              }`}
            >
              <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl hover:shadow-2xl transition duration-300">
                {/* Hero Photo / Placeholder */}
                <div className="relative h-52 sm:h-56 w-full overflow-hidden bg-gradient-to-tr from-slate-800 to-slate-900">
                  {bannerImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={bannerImage}
                      alt={title}
                      className="h-full w-full object-cover transition duration-500"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-slate-300">
                      <Compass size={36} className="text-blue-400 mb-2 animate-bounce" />
                      <p className="text-xs font-bold text-white">Cover photo pending</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Upload in Step 09 (Media) to show high-res hero imagery
                      </p>
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/30" />

                  {/* Badges on image */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white border border-white/20">
                      <Clock size={11} className="text-amber-400" />
                      {days} {days === 1 ? "Day" : "Days"}
                    </span>
                    {startLocation && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white border border-white/20">
                        <MapPin size={11} className="text-rose-400" />
                        <span className="truncate max-w-[120px]">{startLocation}</span>
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white shadow-xs">
                      <ShieldCheck size={11} />
                      Verified
                    </span>
                  </div>

                  {/* Bottom title in photo for mobile */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="text-base sm:text-lg font-black leading-snug drop-shadow-md line-clamp-2">
                      {title}
                    </h3>
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-4 sm:p-5 space-y-3.5">
                  {subtitle && (
                    <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                      {subtitle}
                    </p>
                  )}

                  {/* Quick specs */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                    {maxGroupSize && (
                      <span className="inline-flex items-center gap-1">
                        <Users size={12} className="text-blue-600" />
                        Max {maxGroupSize} guests
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      Instant booking
                    </span>
                  </div>

                  {/* Pricing line & Action CTA */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Starting from
                      </span>
                      <span className="text-lg font-black text-slate-900">
                        {(counts.pricing ?? 0) > 0 ? (
                          `From ${currency} Available`
                        ) : (
                          <span className="text-xs font-bold text-amber-600">Price in Step 04</span>
                        )}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs opacity-90 cursor-default"
                    >
                      Book Tour
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3.5 bg-slate-50 shrink-0">
          <span className="text-xs text-slate-500">
            Preview updates automatically as you save each step
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
