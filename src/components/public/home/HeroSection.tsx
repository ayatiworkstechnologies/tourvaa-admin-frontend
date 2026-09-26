"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import PrimaryCtaButton from "@/components/public/PrimaryCtaButton";
import {
  LuCircleX as CircleX,
  LuGlobe as Globe,
  LuHeartHandshake as HeartHandshake,
  LuMessageSquare as MessageSquare,
  LuStar as Star,
} from "react-icons/lu";
import RichText from "./RichText";
import { list, useSectionCopy } from "./useSectionCopy";
import { useSectionVisibility } from "./sectionVisibility";
import MarketingImage from "@/components/public/MarketingImage";
import HeroFilterBar from "@/components/public/HeroFilterBar";
import {
  CmsBanner,
  fetchContentBlock,
  fetchHomepageBanners,
  fetchPublicCountries,
  HeroExtrasBlock,
  PublicCountry,
} from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";

export interface HeroSectionProps {
  initialBanners?: CmsBanner[];
  initialHeroExtras?: Partial<HeroExtrasBlock>;
  initialCountries?: PublicCountry[];
}

export default function HeroSection({
  initialBanners,
  initialHeroExtras,
  initialCountries,
}: HeroSectionProps) {
  const [banners, setBanners] = useState<CmsBanner[]>(initialBanners || []);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [heroExtras, setHeroExtras] = useState<Partial<HeroExtrasBlock>>(
    initialHeroExtras || {},
  );
  const [searchCountries, setSearchCountries] = useState<PublicCountry[]>(
    initialCountries || [],
  );
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  const [showOfferBanner, setShowOfferBanner] = useState(true);
  const shown = useSectionVisibility();

  const DEFAULT_TRUST_ITEMS = [
    {
      id: "operators",
      Icon: Globe,
      iconColor: "text-sky-500",
      content: (
        <span>
          Shop <strong className="font-semibold text-slate-950">2,500+</strong>{" "}
          handpicked operators
        </span>
      ),
    },
    {
      id: "trustpilot",
      Icon: Star,
      iconColor: "text-emerald-500 fill-emerald-500",
      content: (
        <span>
          <strong className="font-semibold text-slate-950">4.8 stars</strong> on{" "}
          <span className="font-black text-emerald-600">Trustpilot</span>{" "}
          <span className="text-slate-500 font-normal">(15,000+ reviews)</span>
        </span>
      ),
    },
    {
      id: "support",
      Icon: MessageSquare,
      iconColor: "text-pub-accent",
      content: (
        <span>
          <strong className="font-semibold text-slate-950">24/7</strong>{" "}
          customer support
        </span>
      ),
    },
    {
      id: "experiences",
      Icon: HeartHandshake,
      iconColor: "text-sky-500",
      content: (
        <span>
          <strong className="font-semibold text-slate-950">500k+</strong>{" "}
          experiences shared by travelers
        </span>
      ),
    },
  ];

  // CMS > Home Page > Slogans replaces the defaults above when it has entries.
  const customSlogans = list(useSectionCopy("slogans").items);
  const SLOGAN_ICONS = [
    { Icon: Globe, iconColor: "text-sky-500" },
    { Icon: Star, iconColor: "text-emerald-500 fill-emerald-500" },
    { Icon: MessageSquare, iconColor: "text-pub-accent" },
    { Icon: HeartHandshake, iconColor: "text-sky-500" },
  ];
  const TRUST_ITEMS = customSlogans.length
    ? customSlogans.map((t, i) => ({
        id: `slogan-${i}`,
        ...SLOGAN_ICONS[i % SLOGAN_ICONS.length],
        content: (
          <span>
            <RichText
              value={t}
              strongClassName="font-semibold text-slate-950"
            />
          </span>
        ),
      }))
    : DEFAULT_TRUST_ITEMS;

  const [trustIndex, setTrustIndex] = useState(0);
  const [animState, setAnimState] = useState<"visible" | "exit" | "enter">(
    "visible",
  );

  useEffect(() => {
    let enterTimer: NodeJS.Timeout | null = null;
    let visibleTimer: NodeJS.Timeout | null = null;

    const timer = setInterval(() => {
      // 1. Slide up and fade out current item
      setAnimState("exit");

      enterTimer = setTimeout(() => {
        // 2. Switch to next item and position it below baseline
        setTrustIndex((prev) => (prev + 1) % TRUST_ITEMS.length);
        setAnimState("enter");

        // 3. Smoothly animate new item into place
        visibleTimer = setTimeout(() => {
          setAnimState("visible");
        }, 40);
      }, 350);
    }, 3500);

    return () => {
      clearInterval(timer);
      if (enterTimer) clearTimeout(enterTimer);
      if (visibleTimer) clearTimeout(visibleTimer);
    };
  }, [TRUST_ITEMS.length]);

  // Fast independent data loading if not preloaded
  useEffect(() => {
    let active = true;

    if (!initialBanners?.length) {
      fetchHomepageBanners()
        .then((data) => {
          if (active && data?.length) setBanners(data);
        })
        .catch(() => {});
    }

    if (!initialCountries?.length) {
      fetchPublicCountries()
        .then((data) => {
          if (active && data?.length) setSearchCountries(data);
        })
        .catch(() => {});
    }

    if (!initialHeroExtras || Object.keys(initialHeroExtras).length === 0) {
      fetchContentBlock<HeroExtrasBlock>("hero_extras")
        .then((res) => {
          if (active && res?.data) setHeroExtras(res.data);
        })
        .catch(() => {});
    }

    return () => {
      active = false;
    };
  }, [initialBanners, initialCountries, initialHeroExtras]);

  const banner = banners[bannerIndex];
  const heroImage = banner?.image
    ? mediaUrl(banner.image)
    : "/images/hero-1.jpg";
  const heroVideo = banner?.video ? mediaUrl(banner.video) : null;

  // Video banner advances on its own "ended" event so it always plays in full
  useEffect(() => {
    if (banners.length < 2 || heroVideo) return;
    const timer = window.setInterval(
      () => setBannerIndex((index) => (index + 1) % banners.length),
      7000,
    );
    return () => window.clearInterval(timer);
  }, [banners.length, heroVideo]);

  const heroTitle = banner?.title || "Endless destinations. One easy search.";

  const heroOfferText =
    heroExtras.offer_text !== undefined
      ? heroExtras.offer_text
      : "Global Getaways 2026: Up To 50% Off – Limited Availability, Book Today!";
  const heroOfferCtaUrl = heroExtras.offer_cta_url?.trim() || "/deals";
  const heroOfferCtaText = heroExtras.offer_cta_text?.trim() || "";

  return (
    <>
      {/* Contained Hero Section */}
      <div className="relative z-30 mx-auto max-w-[1480px] px-3 pt-3 pb-4 sm:px-5 sm:pb-6">
        <section className="relative flex min-h-[520px] w-full flex-col items-center justify-between rounded-[20px] p-4 text-center text-white shadow-[0_12px_40px_rgba(15,23,42,0.12)] sm:min-h-[540px] sm:p-6">
          {/* Background image/video & gradient overlay */}
          <div className="absolute inset-0 overflow-hidden rounded-[20px] pointer-events-none">
            {heroVideo ? (
              <video
                key={heroVideo}
                src={heroVideo}
                poster={heroImage}
                autoPlay
                loop={banners.length < 2}
                onEnded={
                  banners.length > 1
                    ? () =>
                        setBannerIndex((index) => (index + 1) % banners.length)
                    : undefined
                }
                muted
                playsInline
                className="h-full w-full object-cover object-center"
              />
            ) : (
              <MarketingImage
                fill
                sizes="100vw"
                preload
                key={heroImage}
                src={heroImage}
                alt={banner?.title || "Scenic mountain lake landscape"}
                className="h-full w-full object-cover object-center scale-105 transition-transform duration-1000"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/50" />
          </div>

          {/* Hero Top & Center Content */}
          <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center pt-2 sm:pt-4 pb-2">
            <h1
              key={heroTitle}
              className="animate-fade-up max-w-4xl text-2xl sm:text-4xl md:text-[40px] font-semibold tracking-tight text-white leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
            >
              {heroTitle}
            </h1>

            {banner?.subtitle && (
              <p className="animate-fade-up delay-100 mx-auto mt-2 max-w-xl text-xs sm:text-sm text-white/90 drop-shadow">
                {banner.subtitle}
              </p>
            )}

            {banner?.cta_text && banner?.cta_url && (
              <PrimaryCtaButton
                href={banner.cta_url}
                size="sm"
                className="animate-fade-up delay-100 mt-3"
              >
                {banner.cta_text}
              </PrimaryCtaButton>
            )}

            {/* Filter Search Bar */}
            <div className="mt-4 sm:mt-5 w-full relative z-50 transition-all duration-300">
              <HeroFilterBar
                countries={searchCountries}
                onPanelOpenChange={setSearchPanelOpen}
              />
            </div>
          </div>

          {/* Bottom Offer Capsule */}
          {showOfferBanner && heroOfferText && (
            <div
              className={`relative z-10 w-full max-w-[1020px] mx-auto mt-2 transition-all duration-200 ${
                searchPanelOpen
                  ? "opacity-0 pointer-events-none invisible"
                  : "opacity-100"
              }`}
            >
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/35 bg-white/10 px-4 py-2 text-xs text-white shadow-[0_10px_32px_rgba(15,23,42,0.18)] ring-1 ring-white/10 backdrop-blur-xl transition-all sm:px-6 sm:py-2.5 sm:text-sm">
                <div className="flex items-center gap-2 shrink-0">
                  <Globe size={15} className="text-white/80 shrink-0" />
                  <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white">
                    {heroExtras.offer_label?.trim() || "OFFER"}
                  </span>
                </div>
                {heroOfferCtaUrl ? (
                  <Link
                    href={heroOfferCtaUrl}
                    className="min-w-0 flex-1 text-center font-semibold text-white truncate sm:text-clip text-xs sm:text-[13px] hover:underline"
                  >
                    {heroOfferText}
                    {heroOfferCtaText && (
                      <span className="ml-1.5 font-bold text-white/90">
                        {heroOfferCtaText} →
                      </span>
                    )}
                  </Link>
                ) : (
                  <p className="min-w-0 flex-1 text-center font-semibold text-white truncate sm:text-clip text-xs sm:text-[13px]">
                    {heroOfferText}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setShowOfferBanner(false)}
                  aria-label="Dismiss offer"
                  className="shrink-0 p-0.5 text-white/70 transition-colors hover:text-white cursor-pointer"
                >
                  <CircleX size={16} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Sub-hero Trust Indicator with Dynamic Auto Animation (CMS > Home Page > Slogan switch) */}
      {shown("slogan") && (
      <div
        className="mx-auto max-w-[1400px] px-5 py-5 sm:py-6 overflow-hidden flex items-center justify-center min-h-[52px]"
        aria-label="Tourvaa trust highlights"
      >
        <div className="relative flex items-center justify-center min-h-[36px] w-full max-w-3xl mx-auto overflow-hidden">
          {(() => {
            const currentItem = TRUST_ITEMS[trustIndex % TRUST_ITEMS.length];
            const Icon = currentItem.Icon;
            return (
              <div
                key={trustIndex}
                className={`inline-flex items-center justify-center gap-2.5 sm:gap-3 text-base sm:text-lg md:text-[19px] font-semibold text-slate-800 tracking-tight select-none ${
                  animState === "visible"
                    ? "opacity-100 translate-y-0 transition-all duration-500 ease-out"
                    : animState === "exit"
                      ? "opacity-0 -translate-y-3.5 transition-all duration-350 ease-in pointer-events-none"
                      : "opacity-0 translate-y-3.5 transition-none pointer-events-none"
                }`}
              >
                <Icon
                  size={22}
                  className={`${currentItem.iconColor} shrink-0`}
                />
                {currentItem.content}
              </div>
            );
          })()}
        </div>
      </div>
      )}
    </>
  );
}
