"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LuArrowRight as ArrowRight } from "react-icons/lu";
import {
  CmsBanner,
  fetchContentBlock,
  fetchHomepageBanners,
  HeroExtrasBlock,
} from "@/lib/api/publicClient";
import { Reveal } from "./HomeHelpers";

export interface EscapeSaleSectionProps {
  promoBanner?: CmsBanner | null;
  heroExtras?: Partial<HeroExtrasBlock>;
  maxDiscount?: number;
}

export default function EscapeSaleSection({
  promoBanner: initialPromoBanner,
  heroExtras: initialHeroExtras,
  maxDiscount = 60,
}: EscapeSaleSectionProps) {
  const [promoBanner, setPromoBanner] = useState<CmsBanner | null | undefined>(
    initialPromoBanner,
  );
  const [heroExtras, setHeroExtras] = useState<Partial<HeroExtrasBlock>>(
    initialHeroExtras || {},
  );

  useEffect(() => {
    let active = true;

    if (initialPromoBanner === undefined) {
      fetchHomepageBanners()
        .then((banners) => {
          if (active && banners && banners.length > 1) {
            setPromoBanner(banners[1]);
          }
        })
        .catch(() => {});
    }

    if (!initialHeroExtras || Object.keys(initialHeroExtras).length === 0) {
      fetchContentBlock<HeroExtrasBlock>("hero_extras")
        .then((res) => {
          if (active && res?.data) {
            setHeroExtras(res.data);
          }
        })
        .catch(() => {});
    }

    return () => {
      active = false;
    };
  }, [initialPromoBanner, initialHeroExtras]);

  const rawExtras = (heroExtras || {}) as Record<string, unknown>;

  const visualBannerBadge =
    (rawExtras.deal_badge as string) || "Offer Ends Soon";

  const visualBannerTitle =
    promoBanner?.title ||
    (rawExtras.deal_title as string) ||
    `Big Adventures. Smaller Prices. Save up to ${maxDiscount}% off.`;

  const visualBannerSubtitle =
    promoBanner?.subtitle ||
    (rawExtras.deal_subtitle as string) ||
    "Explore handpicked tours at special prices and make your next journey one to remember.";

  const visualBannerCtaText =
    promoBanner?.cta_text ||
    (rawExtras.deal_cta_text as string) ||
    "Explore Deals";

  const visualBannerCtaUrl =
    promoBanner?.cta_url ||
    (rawExtras.deal_cta_url as string) ||
    "/deals";

  return (
    <div className="relative z-10 mx-auto max-w-[1400px] px-5 pt-6 pb-2 sm:pt-8 sm:pb-3">
      <Reveal variant="scale-up">
        <section className="group relative w-full overflow-hidden rounded-[20px] sm:rounded-[24px] bg-pub-bg border border-pub-border p-6 sm:p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs transition-all">
          <div className="max-w-2xl text-left">
            {visualBannerBadge && (
              <span className="inline-flex items-center rounded-full bg-pub-accent px-3.5 py-1 text-[11px] sm:text-xs font-semibold text-white shadow-2xs">
                {visualBannerBadge}
              </span>
            )}
            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-[34px] font-semibold text-slate-900 tracking-tight leading-tight">
              {visualBannerTitle}
            </h2>
            <p className="mt-2 text-xs sm:text-sm md:text-[15px] text-slate-600 font-normal leading-relaxed max-w-xl">
              {visualBannerSubtitle}
            </p>
          </div>

          <div className="shrink-0 flex items-center">
            <Link
              href={visualBannerCtaUrl}
              className="inline-flex items-center gap-2 rounded-xl bg-pub-primary hover:bg-pub-primary-dark active:scale-95 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all cursor-pointer"
            >
              <span>{visualBannerCtaText}</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>

        {/* Category Filter Pills Row (as shown in design reference) */}
        <div className="mt-5 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {["All Deals", "Wild Safari", "Cruise Tours", "Weekend Gateway", "Family Holidays"].map((category, index) => {
              const isActive = index === 0;
              return (
                <Link
                  key={category}
                  href={isActive ? "/deals" : `/deals?search=${encodeURIComponent(category)}`}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-pub-accent text-white shadow-2xs"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-2xs"
                  }`}
                >
                  {category}
                </Link>
              );
            })}
          </div>

          <Link
            href="/deals"
            className="shrink-0 text-xs sm:text-sm font-semibold text-pub-accent hover:underline flex items-center gap-1.5 whitespace-nowrap ml-auto"
          >
            <span>View all deals</span>
            <ArrowRight size={14} className="stroke-[2.5]" />
          </Link>
        </div>
      </Reveal>
    </div>
  );
}

