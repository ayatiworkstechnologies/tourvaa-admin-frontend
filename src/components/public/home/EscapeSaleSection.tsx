"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LuArrowRight as ArrowRight } from "react-icons/lu";
import {
  CmsBanner,
  fetchContentBlock,
  fetchHomepageBanners,
  HeroExtrasBlock,
} from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";
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
    (rawExtras.deal_badge as string) || "OFFER ENDS SOON";

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
    "/tours?sort=price_asc";

  const visualBannerImage = promoBanner?.image
    ? mediaUrl(promoBanner.image)
    : "/images/destination-alpine.jpg";

  return (
    <div className="relative z-10 mx-auto max-w-[1400px] px-5 my-4 sm:my-6">
      <Reveal variant="scale-up">
        <section className="group relative w-full overflow-hidden rounded-[20px] sm:rounded-[24px] border border-slate-200/80 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
          {/* Background panoramic mountain image with smooth zoom on hover */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={visualBannerImage}
              alt={visualBannerTitle}
              className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {/* Gradient overlay for text contrast and depth */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-slate-950/20" />
          </div>

          {/* Banner content */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 lg:p-10 min-h-[170px] sm:min-h-[190px]">
            <div className="max-w-2xl text-left">
              {visualBannerBadge && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E4572E] px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-xs">
                  {visualBannerBadge}
                </span>
              )}
              <h2 className="mt-3 text-2xl sm:text-3xl lg:text-[36px] font-extrabold text-white tracking-tight leading-tight">
                {visualBannerTitle}
              </h2>
              <p className="mt-2.5 text-xs sm:text-sm md:text-[15px] text-white/90 font-medium leading-relaxed max-w-xl">
                {visualBannerSubtitle}
              </p>
            </div>

            <div className="shrink-0 flex items-center">
              <Link
                href={visualBannerCtaUrl}
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#0B1527] px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-white shadow-lg transition-all duration-200 hover:bg-[#15233C] hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
              >
                <span>{visualBannerCtaText}</span>
                <ArrowRight size={16} className="text-[#E4572E] stroke-[2.5]" />
              </Link>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
