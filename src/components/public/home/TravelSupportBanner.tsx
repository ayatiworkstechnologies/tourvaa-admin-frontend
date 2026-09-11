"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LuArrowRight as ArrowRight } from "react-icons/lu";
import { TravelSupportBlock, fetchContentBlock } from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";

export interface TravelSupportBannerProps {
  initialData?: Partial<TravelSupportBlock>;
  eyebrow?: string;
  heading?: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  image?: string;
}

export default function TravelSupportBanner({
  initialData,
  eyebrow: propEyebrow,
  heading: propHeading,
  subtitle: propSubtitle,
  ctaText: propCtaText,
  ctaUrl: propCtaUrl,
  image: propImage,
}: TravelSupportBannerProps) {
  const [data, setData] = useState<Partial<TravelSupportBlock>>(initialData || {});

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setData(initialData);
      return;
    }

    let active = true;
    fetchContentBlock<TravelSupportBlock>("travel_support")
      .then((res) => {
        if (active && res?.data) {
          setData(res.data);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [initialData]);

  const eyebrow = propEyebrow || data.eyebrow || "Offer Ends Soon";
  const heading = propHeading || data.heading || "24/7 Travel Support";
  const subtitle =
    propSubtitle ||
    data.subtitle ||
    "From booking questions to on-trip assistance, our travel support team is here to make your Tourvaa journey smooth, simple and stress-free.";
  const ctaText = propCtaText || data.cta_text || "Explore Deals";
  const ctaUrl = propCtaUrl || data.cta_url || "/tours?sort=price_asc";
  const image =
    propImage || (data.image ? mediaUrl(data.image) : "/images/offer.png");

  return (
    <section className="group relative w-full overflow-hidden my-3 sm:my-5 py-6 sm:py-8 md:py-9 bg-white border-y border-slate-200/60 shadow-2xs min-h-[190px] sm:min-h-[220px] md:min-h-[240px] flex items-center">
      {/* Full panoramic background image - left aligned so agents remain clearly in frame */}
      <img
        src={image}
        alt={heading}
        className="absolute inset-0 h-full w-full object-cover object-left md:object-[left_center] transition-transform duration-700 ease-out group-hover:scale-[1.01]"
      />

      {/* Subtle responsive wash ensuring readability without obscuring agents */}
      <div className="absolute inset-0 bg-white/70 sm:bg-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-white/20 sm:via-40% sm:to-white/80 pointer-events-none" />

      {/* Foreground Content Aligned to the Right Half */}
      <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col items-start justify-center ml-auto max-w-lg lg:max-w-xl text-left py-1">
          {/* Eyebrow / Offer Ends Soon Badge */}
          <span className="inline-flex items-center rounded-full bg-[#E4572E] px-3 py-0.5 text-[11px] sm:text-xs font-semibold text-white shadow-xs">
            {eyebrow}
          </span>

          {/* Heading */}
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 leading-tight">
            {heading}
          </h2>

          {/* Subtitle */}
          <p className="mt-2 text-xs sm:text-sm md:text-[14px] leading-relaxed text-slate-600 font-normal max-w-lg">
            {subtitle}
          </p>

          {/* Action Button */}
          <Link
            href={ctaUrl}
            className="group/btn mt-4 sm:mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1527] px-6 sm:px-7 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-white shadow-md transition-all duration-200 hover:bg-[#15233C] hover:shadow-xl hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <span>{ctaText}</span>
            <ArrowRight
              size={15}
              className="text-[#E4572E] stroke-[2.5] transition-transform duration-200 group-hover/btn:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
