"use client";

import { useEffect, useState } from "react";
import { useCurrency } from "@/hooks/useCurrency";
import {
  ExternalCampaignSource,
  ExternalExperience,
  ExternalSearchResult,
  ExternalToursConfig,
  fetchExternalToursConfig,
  searchExternalExperiences,
  viatorCurrency,
} from "@/lib/api/externalTours";
import ExternalExperienceCard, { ExternalExperienceCardSkeleton } from "./ExternalExperienceCard";
import PoweredByViator from "./PoweredByViator";

type Placement = "show_on_destination_pages" | "show_on_itinerary" | "show_on_homepage";

/**
 * "Things to do in X · Powered by Viator" strip, shown next to (never mixed
 * into) Tourvaa's own tours. Renders nothing when the admin has switched
 * this placement off, the destination isn't mapped, Viator is down, or
 * there are no results - it must never break the host page.
 */
export default function ExternalExperiencesSection({
  placement,
  source,
  destination,
  location,
  country,
  limit = 4,
  variant = "section",
  title,
  subtitle,
}: {
  placement: Placement;
  source: ExternalCampaignSource;
  destination?: string;
  location?: string;
  country?: string;
  limit?: number;
  variant?: "section" | "compact";
  title?: (name: string) => string;
  subtitle?: string;
}) {
  const { code } = useCurrency();
  const currency = viatorCurrency(code);
  const [config, setConfig] = useState<ExternalToursConfig | null>(null);
  const [result, setResult] = useState<ExternalSearchResult | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "hidden">("loading");

  useEffect(() => {
    let active = true;
    fetchExternalToursConfig().then((cfg) => {
      if (!active) return;
      setConfig(cfg);
      if (!cfg?.[placement]) setState("hidden");
    });
    return () => {
      active = false;
    };
  }, [placement]);

  useEffect(() => {
    if (!config?.[placement] || !(destination || location || country)) return;
    let active = true;
    setState("loading");
    searchExternalExperiences({ destination, location, country, page_size: limit, sort: "rating", currency, source })
      .then((res) => {
        if (!active) return;
        setResult(res);
        setState(res.items.length ? "ready" : "hidden");
      })
      .catch(() => {
        if (active) setState("hidden");
      });
    return () => {
      active = false;
    };
  }, [config, placement, destination, location, country, limit, currency, source]);

  if (state === "hidden" || !config?.[placement]) return null;

  const name = result?.destination.name || location || country || "";
  const heading = title ? title(name) : `Things to Do in ${name}`;
  const items: ExternalExperience[] = result?.items ?? [];

  if (variant === "compact") {
    return (
      <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-slate-900">Looking for something to do?</p>
            <p className="text-xs text-slate-600">
              {subtitle ?? `Explore day tours and experiences${name ? ` in ${name}` : ""}.`}
            </p>
          </div>
          <PoweredByViator />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {state === "loading"
            ? Array.from({ length: Math.min(limit, 3) }).map((_, i) => <ExternalExperienceCardSkeleton key={i} />)
            : items.slice(0, limit).map((item) => <ExternalExperienceCard key={item.id} item={item} source={source} />)}
        </div>
      </div>
    );
  }

  return (
    <section className="w-full py-10 sm:py-14" aria-label={heading}>
      <div className="mx-auto max-w-[1400px] px-5">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{state === "loading" && !name ? "Things to Do" : heading}</h2>
              <PoweredByViator />
            </div>
            <p className="mt-1.5 text-sm text-slate-600">
              {subtitle ?? "Day tours and activities from our travel partner - booked and paid for on Viator."}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {state === "loading"
            ? Array.from({ length: limit }).map((_, i) => <ExternalExperienceCardSkeleton key={i} />)
            : items.slice(0, limit).map((item) => <ExternalExperienceCard key={item.id} item={item} source={source} />)}
        </div>
      </div>
    </section>
  );
}
