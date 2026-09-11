"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  LuGlobe as Globe,
  LuSparkles as Sparkles,
  LuStar as Star,
  LuX as X,
} from "react-icons/lu";
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

  const heroRating =
    heroExtras.rating !== undefined ? Number(heroExtras.rating) : 4.5;
  const heroReviewCount =
    heroExtras.review_count !== undefined
      ? Number(heroExtras.review_count)
      : 522;
  const heroReviewSource =
    heroExtras.review_source !== undefined
      ? heroExtras.review_source
      : "Ayatiworks";
  const heroOfferText =
    heroExtras.offer_text !== undefined
      ? heroExtras.offer_text
      : "Global Getaways 2026: Up To 50% Off – Limited Availability, Book Today!";
  const heroOfferCtaUrl = heroExtras.offer_cta_url?.trim() || "";
  const heroOfferCtaText = heroExtras.offer_cta_text?.trim() || "";

  const subHeroText =
    ((heroExtras as Record<string, unknown>).sub_hero_text as string) ||
    "Explore handpicked tours from trusted travel partners and book your next adventure with confidence.";

  return (
    <>
      {/* Contained Hero Section */}
      <div className="relative z-30 mx-auto max-w-[1400px] px-5 pt-3 pb-4 sm:pb-6">
        <section className="relative flex min-h-[480px] w-full flex-col justify-between items-center rounded-[20px] p-4 sm:p-6 text-center text-white shadow-[0_12px_40px_rgba(15,23,42,0.12)]">
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
              <Link
                href={banner.cta_url}
                className="animate-fade-up delay-100 mt-3 inline-flex items-center gap-2 rounded-full bg-pub-accent px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-lg transition hover:brightness-110"
              >
                {banner.cta_text}
              </Link>
            )}

            {/* Filter Search Bar */}
            <div className="mt-4 sm:mt-5 w-full relative z-50 transition-all duration-300">
              <HeroFilterBar
                countries={searchCountries}
                onPanelOpenChange={setSearchPanelOpen}
              />
            </div>

            {/* Social Proof / Traveller Rating */}
            <div
              className={`mt-3 sm:mt-4 flex flex-wrap items-center justify-center gap-1.5 text-xs sm:text-sm text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)] relative z-10 transition-all duration-200 ${
                searchPanelOpen
                  ? "opacity-0 pointer-events-none invisible"
                  : "opacity-100"
              }`}
            >
              <span className="font-normal text-white/95">
                Tourvaa travellers rate us
              </span>
              <span className="font-semibold text-white">Excellent</span>
              <span className="inline-flex items-center gap-0.5 mx-1">
                <Star
                  size={14}
                  className="fill-pub-secondary text-pub-secondary"
                />
                <Star
                  size={14}
                  className="fill-pub-secondary text-pub-secondary"
                />
                <Star
                  size={14}
                  className="fill-pub-secondary text-pub-secondary"
                />
                <Star
                  size={14}
                  className="fill-pub-secondary text-pub-secondary"
                />
                <Star size={14} className="fill-white/40 text-white/60" />
              </span>
              <span className="font-bold text-white">
                {heroRating.toFixed(1)}
              </span>
              <span className="text-white/90">
                {`out of 5 based on ${heroReviewCount.toLocaleString()} reviews on ${heroReviewSource}`}
              </span>
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
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/20 bg-slate-950/40 backdrop-blur-md px-4 sm:px-6 py-2 text-xs sm:text-sm text-white shadow-xl transition-all">
                <div className="flex items-center gap-2 shrink-0">
                  <Globe size={14} className="text-white/80 shrink-0" />
                  <span className="rounded-md bg-pub-accent px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-white">
                    OFFER
                  </span>
                </div>
                {heroOfferCtaUrl ? (
                  <Link
                    href={heroOfferCtaUrl}
                    className="min-w-0 flex-1 text-center font-semibold text-white truncate sm:text-clip text-xs sm:text-[13px] hover:underline"
                  >
                    {heroOfferText}
                    {heroOfferCtaText && (
                      <span className="ml-1.5 font-black text-pub-secondary">
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
                  className="shrink-0 rounded-full p-1 text-white/70 transition-colors hover:bg-white/20 hover:text-white cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Sub-hero Trust Indicator */}
      <div className="mx-auto max-w-[1400px] px-5 pt-1 pb-4 text-center">
        <p className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
          <Sparkles
            size={16}
            className="text-[#3B82F6] shrink-0 fill-[#3B82F6]/20"
          />
          <span>{subHeroText}</span>
        </p>
      </div>
    </>
  );
}
