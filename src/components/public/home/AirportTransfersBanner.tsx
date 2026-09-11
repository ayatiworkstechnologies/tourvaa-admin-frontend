"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from "react";
import { LuArrowRight as ArrowRight, LuPlane as Plane } from "react-icons/lu";
import { usePublicSettings } from "@/providers/PublicSettingsProvider";
import {
  AirportTransferBlock,
  fetchContentBlock,
} from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { DEFAULT_TRANSFER_FEATURES } from "./homeTypes";

export interface AirportTransfersBannerProps {
  initialData?: Partial<AirportTransferBlock>;
  eyebrow?: string;
  heading?: string;
  subtitle?: string;
  features?: string[];
  ctaText?: string;
  ctaUrl?: string;
  image?: string;
}

export default function AirportTransfersBanner({
  initialData,
  eyebrow: propEyebrow,
  heading: propHeading,
  subtitle: propSubtitle,
  features: propFeatures,
  ctaText: propCtaText,
  ctaUrl: propCtaUrl,
  image: propImage,
}: AirportTransfersBannerProps) {
  const [data, setData] = useState<Partial<AirportTransferBlock>>(
    initialData || {},
  );
  const { settings } = usePublicSettings();

  // Fast independent data loading
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setData(initialData);
      return;
    }

    let active = true;
    fetchContentBlock<AirportTransferBlock>("airport_transfer")
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

  const eyebrow = propEyebrow || data.eyebrow || "PREMIUM TRANSFER PARTNER";
  const heading = propHeading || data.heading || "Book Your Airport Transfers";
  const subtitle =
    propSubtitle ||
    data.subtitle ||
    "Effortless, reliable transfers from the world's leading airports to your hotel";
  const features =
    propFeatures ||
    (data.features?.length ? data.features : DEFAULT_TRANSFER_FEATURES);
  const ctaText = propCtaText || data.cta_text || "Book Airport Pickup";
  const image =
    propImage ||
    (data.image ? mediaUrl(data.image) : "/images/img-2.png");

  const brightlaneLink =
    propCtaUrl?.trim() ||
    data.cta_url?.trim() ||
    settings.brightlane_external_link?.trim() ||
    "https://www.brightlane.co.nz/";

  const isExternal = brightlaneLink.startsWith("http");

  return (
    <div className="relative z-10 mx-auto max-w-[1380px] px-5">
      <section className="py-6 sm:py-10">
        <div className="group grid gap-6 lg:gap-10 overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-6 sm:p-8 lg:p-10 md:grid-cols-2 md:items-center shadow-xs hover:border-slate-300 hover:shadow-lg transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]">
          <div className="flex flex-col items-start justify-center py-2 text-left">
            {/* Tag / Badge */}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#E4572E]">
              <Plane size={14} className="rotate-45" />
              <span>{eyebrow}</span>
            </div>

            {/* Heading */}
            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-[36px] font-extrabold leading-tight text-slate-950 tracking-tight">
              {heading}
            </h2>

            {/* Subtitle */}
            <p className="mt-3 text-xs sm:text-sm md:text-base leading-relaxed text-slate-600 font-medium">
              {subtitle}
            </p>

            {/* Feature Pills */}
            <div className="mt-5 flex flex-wrap gap-2">
              {(features && features.length > 0
                ? features
                : DEFAULT_TRANSFER_FEATURES
              ).map((feature) => (
                <span
                  key={feature}
                  className="rounded-full bg-[#E4572E] px-3.5 py-1 text-[11px] font-bold text-white shadow-xs transition-transform duration-200 hover:scale-105 select-none"
                >
                  {feature}
                </span>
              ))}
            </div>

            {/* CTA Button */}
            <a
              href={brightlaneLink}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              className="group/btn mt-7 inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#0B1527] px-7 py-3.5 text-sm sm:text-base font-bold text-white shadow-md transition-all duration-200 hover:bg-[#15233C] hover:shadow-xl hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <span>{ctaText}</span>
              <ArrowRight
                size={16}
                className="text-[#E4572E] stroke-[2.5] transition-transform duration-200 group-hover/btn:translate-x-1"
                aria-hidden="true"
              />
            </a>
          </div>

          {/* Right Image */}
          <a
            href={brightlaneLink}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            aria-label="Visit Brightlane Airport Transfers"
            className="relative block h-[280px] sm:h-[340px] lg:h-[380px] w-full overflow-hidden rounded-[18px] bg-slate-100 shadow-sm"
          >
            <img
              src={image}
              alt="Luxury airport chauffeur transfer in front of international arrivals terminal"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
            />
          </a>
        </div>
      </section>
    </div>
  );
}
