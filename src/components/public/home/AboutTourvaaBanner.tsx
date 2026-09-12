"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AboutSectionBlock, fetchContentBlock } from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { DEFAULT_ABOUT_BODY, DEFAULT_ABOUT_HEADING } from "./homeTypes";

export interface AboutTourvaaBannerProps {
  initialData?: Partial<AboutSectionBlock>;
  heading?: string;
  body?: string;
  image?: string;
  ctaText?: string;
  ctaUrl?: string;
}

const DEFAULT_ABOUT_CTA_TEXT = "Explore About Tourvaa";
const DEFAULT_ABOUT_CTA_URL = "/about";

export default function AboutTourvaaBanner({
  initialData,
  heading: propHeading,
  body: propBody,
  image: propImage,
  ctaText: propCtaText,
  ctaUrl: propCtaUrl,
}: AboutTourvaaBannerProps) {
  const [data, setData] = useState<Partial<AboutSectionBlock>>(initialData || {});

  // Fast independent data loading
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setData(initialData);
      return;
    }

    let active = true;
    fetchContentBlock<AboutSectionBlock>("about_section")
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

  const heading = propHeading || data.heading || DEFAULT_ABOUT_HEADING;
  const body = propBody || data.body || DEFAULT_ABOUT_BODY;
  const image =
    propImage || (data.image ? mediaUrl(data.image) : "/images/about-mountain.png");
  const ctaText = propCtaText || data.cta_text || DEFAULT_ABOUT_CTA_TEXT;
  const ctaUrl = propCtaUrl || data.cta_url || DEFAULT_ABOUT_CTA_URL;

  return (
    <section className="relative w-full overflow-hidden my-6 sm:my-10 py-14 sm:py-20 lg:py-24 shadow-sm">
      {/* High-res Panoramic Mountain Background */}
      <img
        src={image}
        alt="About Tourvaa - Alpine mountain landscape"
        className="absolute inset-0 h-full w-full object-full object-center"
      />
      {/* Dark gradient overlay for readability */}
      <div className="absolute inset-0 bg-black/10 backdrop-brightness-90" />

      {/* Text Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 sm:px-10 text-center text-white">
        <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-semibold tracking-tight text-white drop-shadow-md">
          {heading}
        </h2>
        <p className="mx-auto mt-4 max-w-4xl text-xs sm:text-sm md:text-[15px] leading-relaxed text-white/95 drop-shadow">
          {body}
        </p>
        <div className="mt-6 sm:mt-8">
          <Link
            href={ctaUrl}
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 shadow-md transition-all duration-300 hover:bg-pub-secondary hover:text-white hover:-translate-y-0.5"
          >
            {ctaText}
          </Link>
        </div>
      </div>
    </section>
  );
}
