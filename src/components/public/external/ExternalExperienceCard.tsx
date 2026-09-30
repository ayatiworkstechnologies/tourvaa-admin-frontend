"use client";

/* eslint-disable @next/next/no-img-element -- provider CDN images, not local/optimizable assets */

import {
  LuCircleCheck as CircleCheck,
  LuClock as Clock,
  LuExternalLink as ExternalLink,
  LuMapPin as MapPin,
  LuStar as Star,
} from "react-icons/lu";
import { useCurrency } from "@/hooks/useCurrency";
import type { ExternalCampaignSource, ExternalExperience } from "@/lib/api/externalTours";
import { trackExternalClick } from "@/lib/externalTours/tracking";
import Loader from "@/components/ui/Loader";

const FALLBACK_IMAGE = "/images/tour-card-fallback.jpg";

/**
 * Card for an external (affiliate) experience. Same visual language as
 * Tourvaa's own tour cards, but the behaviour is different on purpose:
 * it links out to the provider's affiliate URL (new tab) after recording
 * a click - never to a Tourvaa tour page, cart or checkout.
 */
export default function ExternalExperienceCard({
  item,
  source,
  className = "",
}: {
  item: ExternalExperience;
  source: ExternalCampaignSource;
  className?: string;
}) {
  const { formatExact } = useCurrency();
  const reviews = item.review_count ? item.review_count.toLocaleString() : null;

  return (
    <a
      href={item.external_url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={() => trackExternalClick(item, source)}
      data-external-card
      aria-label={`${item.title} - opens on Viator in a new tab`}
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:p-2.5 ${className}`}
    >
      <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-52">
        <img
          src={item.image || FALLBACK_IMAGE}
          alt={item.title}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {item.destination?.name && (
          <span className="pointer-events-none absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-pub-accent px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-xs">
            <MapPin size={10} className="shrink-0" />
            <span className="max-w-[120px] truncate">{item.destination.name}</span>
          </span>
        )}
        {item.free_cancellation && (
          <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm">
            <CircleCheck size={12} /> Free cancellation
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 transition-colors group-hover:text-pub-accent">{item.title}</h3>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
          {item.rating != null && (
            <span className="flex items-center gap-1">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span className="font-bold text-slate-900">{item.rating.toFixed(1)}</span>
              {reviews && <span className="text-slate-500">({reviews})</span>}
            </span>
          )}
          {item.duration && (
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-sky-500" /> {item.duration}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-slate-100 pt-2.5 mt-3">
          <div className="min-w-0">
            {item.from_price != null && item.currency ? (
              <p className="flex items-baseline gap-1.5 text-slate-900">
                <span className="text-xs text-slate-500">From</span>
                {/* Viator's own price, shown as-is (no Tourvaa markup or FX). */}
                <strong className="text-sm font-bold sm:text-base">{formatExact(item.from_price, item.currency)}</strong>
              </p>
            ) : (
              <p className="text-xs text-slate-500">See price on Viator</p>
            )}
            <p className="mt-0.5 text-[10px] font-medium text-slate-400">via Viator</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-pub-primary px-3 py-2 text-xs font-bold text-white transition group-hover:opacity-90">
            View Experience <ExternalLink size={12} />
          </span>
        </div>
      </div>
    </a>
  );
}

export function ExternalExperienceCardSkeleton() {
  return <div className="rounded-2xl border border-slate-200/80 bg-white p-4"><Loader label="Loading experience..." compact /></div>;
}
