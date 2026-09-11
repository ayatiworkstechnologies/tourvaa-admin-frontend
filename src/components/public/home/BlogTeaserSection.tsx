"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuSparkles as Sparkles,
} from "react-icons/lu";
import { BlogTeaserBlock, fetchContentBlock } from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";

export interface BlogTeaserSectionProps {
  initialData?: Partial<BlogTeaserBlock>;
}

export default function BlogTeaserSection({
  initialData,
}: BlogTeaserSectionProps) {
  const [data, setData] = useState<Partial<BlogTeaserBlock>>(initialData || {});

  // Fast independent data loading
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setData(initialData);
      return;
    }

    let active = true;
    fetchContentBlock<BlogTeaserBlock>("blog_teaser")
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

  const eyebrow = data.eyebrow ?? "BLOG";
  const heading =
    data.heading ?? "Travel stories, guides and inspiration for every journey";
  const subtitle =
    data.subtitle ??
    "Explore travel guides, insider tips and inspiring stories from destinations around the world.";
  const ctaText = data.cta_text ?? "Read Stories";
  const ctaUrl = data.cta_url || "/blogs";
  const image = data.image ? mediaUrl(data.image) : "/images/img-1.png";

  return (
    <section className="relative w-full overflow-hidden my-8 sm:my-14 py-12 sm:py-20 bg-gradient-to-br from-[#FFF9EE] via-[#FDFAFB] to-[#F0F7FF] border-y border-slate-100 shadow-xs">
      {/* Top-left golden glow */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-amber-400/35 via-orange-300/20 to-transparent blur-3xl animate-float-orb" />
      {/* Bottom-right sky-blue glow */}
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-[420px] w-[420px] rounded-full bg-gradient-to-tl from-sky-400/25 via-blue-300/15 to-transparent blur-3xl animate-float-orb-alt" />

      <div className="relative z-10 mx-auto max-w-[1380px] px-5">
        <div className="group grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-5 sm:p-6 lg:p-7 shadow-xs hover:border-slate-300 hover:shadow-lg transition-all duration-300 ease-out">
          {/* Left Image: rounded-[18px] with smooth hover zoom */}
          <div className="relative h-[280px] sm:h-[340px] lg:h-[400px] w-full overflow-hidden rounded-[18px] bg-slate-100 shadow-sm">
            <img
              src={image}
              alt="Travellers with backpacks hiking on a trail"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
            />
          </div>

          {/* Right Content */}
          <div className="flex flex-col items-start justify-center py-2 px-2 sm:px-4 lg:px-6 text-left">
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#E4572E]">
              <Sparkles
                size={14}
                className="text-[#E4572E] animate-sparkle-glow"
              />
              <span>{eyebrow}</span>
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-[36px] font-extrabold leading-tight text-slate-950 tracking-tight">
              {heading}
            </h2>
            <p className="mt-4 max-w-md text-xs sm:text-sm md:text-base leading-relaxed text-slate-600 font-medium">
              {subtitle}
            </p>
            <Link
              href={ctaUrl}
              className="group/btn mt-7 inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#0B1527] px-7 py-3.5 text-sm sm:text-base font-bold text-white shadow-md transition-all duration-200 hover:bg-[#15233C] hover:shadow-xl hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <span>{ctaText}</span>
              <ArrowRight
                size={16}
                className="text-[#E4572E] stroke-[2.5] transition-transform duration-200 group-hover/btn:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
