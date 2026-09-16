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
  const ctaUrl = propCtaUrl || data.cta_url || "/deals";
  const image =
    propImage || (data.image ? mediaUrl(data.image) : "/images/offer.png");

  return (
    <section className="group relative w-full overflow-hidden my-3 sm:my-5 py-8 sm:py-10 md:py-12 bg-white flex items-center min-h-[210px] sm:min-h-[240px]">
      {/* Full panoramic background image - left aligned so agents remain clearly in frame */}
      <img
        src={image}
        alt={heading}
        className="absolute inset-0 h-full w-full object-cover object-left md:object-[left_center] transition-transform duration-700 ease-out group-hover:scale-[1.01]"
      />

      {/* Subtle responsive wash ensuring readability without obscuring agents */}
      <div className="absolute inset-0 bg-white/75 sm:bg-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-white/40 sm:via-35% sm:to-white/95 pointer-events-none" />

      {/* Foreground Content Aligned to the Right Half */}
      <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col items-start justify-center ml-auto max-w-lg lg:max-w-xl text-left py-1">
          {/* Eyebrow / Offer Ends Soon Badge */}
          <span className="inline-flex items-center rounded-full bg-[#DF6951] px-3.5 py-1 text-[11px] sm:text-xs font-semibold text-white shadow-2xs">
            {eyebrow}
          </span>

          {/* Heading */}
          <h2 className="mt-2.5 text-2xl sm:text-3xl lg:text-[32px] font-bold tracking-tight text-slate-950 leading-tight">
            {heading}
          </h2>

          {/* Subtitle */}
          <p className="mt-2 text-xs sm:text-sm md:text-[14px] leading-relaxed text-slate-600 font-normal max-w-md">
            {subtitle}
          </p>

          {/* Action Button */}
          <Link
            href={ctaUrl}
            className="mt-4 sm:mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0B1F3A] hover:bg-[#132c50] active:scale-95 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all cursor-pointer"
          >
            <span>{ctaText}</span>
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
