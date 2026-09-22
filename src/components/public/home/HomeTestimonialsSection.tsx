"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useRef, useState } from "react";
import { useSectionCopy, text } from "./useSectionCopy";
import {
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuStar as Star,
  LuX as X,
} from "react-icons/lu";
import { fetchCustomerReviews } from "@/lib/api/publicClient";
import { CURATED_REVIEWS, mapReview, ReviewItem } from "./homeTypes";
import { smoothScrollTo } from "./smoothScrollTo";

export interface HomeTestimonialsSectionProps {
  initialReviews?: ReviewItem[];
  loading?: boolean;
}

export default function HomeTestimonialsSection({
  initialReviews,
  loading: initialLoading,
}: HomeTestimonialsSectionProps) {
  const copy = useSectionCopy("testimonials_section");
  const [reviews, setReviews] = useState<ReviewItem[]>(
    initialReviews || CURATED_REVIEWS,
  );
  const [loading, setLoading] = useState<boolean>(
    initialLoading !== undefined ? initialLoading : false,
  );
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close modal on Escape and prevent body scroll
  useEffect(() => {
    if (!selectedReview) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedReview(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [selectedReview]);

  // Fast independent data loading
  useEffect(() => {
    if (initialReviews && initialReviews.length > 0) {
      setReviews(initialReviews);
      return;
    }

    let active = true;

    fetchCustomerReviews()
      .then((reviewResult) => {
        if (!active) return;
        if (reviewResult && reviewResult.length > 0) {
          const cmsReviews = reviewResult
            .filter((r) => r.is_active !== false)
            .map(mapReview);
          if (cmsReviews.length > 0) {
            setReviews(cmsReviews);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialReviews]);

  const move = (direction: number) => {
    const carousel = ref.current;
    if (!carousel) return;

    const card = carousel.querySelector<HTMLElement>("[data-review-card]");
    if (!card) return;

    const gap =
      Number.parseFloat(window.getComputedStyle(carousel).columnGap) || 0;
    const step = card.offsetWidth + gap;
    if (step <= 0) return;

    const currentIndex = Math.round(carousel.scrollLeft / step);
    const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
    const target = Math.max(
      0,
      Math.min(maxScrollLeft, (currentIndex + direction) * step),
    );
    smoothScrollTo(carousel, target);
  };

  const displayReviews = reviews.length > 0 ? reviews : CURATED_REVIEWS;

  return (
    <section className="relative w-full overflow-hidden py-14 sm:py-18 bg-gradient-to-b from-white via-[#FFF8EF] to-[#FDF3E4]">
      <div className="relative z-10 mx-auto max-w-[1400px] px-5">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-semibold text-slate-950 tracking-tight">
            {text(copy.title, "What Tourvaa travellers are saying")}
          </h2>
          <p className="mt-2 text-xs sm:text-sm md:text-base text-slate-500">
            {text(copy.subtitle, "Real stories and honest reviews from travellers who explored the world with Tourvaa.")}
          </p>
        </div>

        {/* Outer Carousel Container with Left and Right Arrows */}
        <div className="relative px-2 sm:px-6">
          <button
            type="button"
            aria-label="Previous reviews"
            onClick={() => move(-1)}
            className="absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition-all duration-200 hover:border-pub-secondary hover:text-pub-secondary hover:scale-110 active:scale-90 cursor-pointer"
          >
            <ChevronLeft size={18} className="stroke-[2.2]" />
          </button>

          <button
            type="button"
            aria-label="Next reviews"
            onClick={() => move(1)}
            className="absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition-all duration-200 hover:border-pub-secondary hover:text-pub-secondary hover:scale-110 active:scale-90 cursor-pointer"
          >
            <ChevronRight size={18} className="stroke-[2.2]" />
          </button>

          <div
            ref={ref}
            className="no-scrollbar flex snap-x snap-mandatory scroll-px-2 scroll-smooth touch-pan-x gap-5 overflow-x-auto overscroll-x-contain px-2 py-2"
          >
            {loading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    data-review-card
                    className="w-[calc(100%-1rem)] max-w-[300px] sm:w-[360px] sm:max-w-none shrink-0 snap-start animate-pulse rounded-3xl border border-slate-100 bg-white p-7 shadow-sm"
                  >
                    <div className="h-6 w-8 rounded bg-slate-100 mb-4" />
                    <div className="h-4 w-full rounded-full bg-slate-100" />
                    <div className="mt-2 h-4 w-4/5 rounded-full bg-slate-100" />
                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100" />
                        <div className="space-y-1.5">
                          <div className="h-3 w-20 rounded bg-slate-100" />
                          <div className="h-2.5 w-14 rounded bg-slate-100" />
                        </div>
                      </div>
                      <div className="h-3 w-16 rounded bg-slate-100" />
                    </div>
                  </div>
                ))
              : displayReviews.map((review, index) => {
                  const isLongQuote = Boolean(review.quote && review.quote.length > 100);

                  return (
                    <article
                      key={`${review.name}-${index}`}
                      data-review-card
                      className="group w-[calc(100%-1rem)] max-w-[290px] sm:w-[350px] sm:max-w-none lg:w-[370px] shrink-0 snap-start flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 text-left shadow-xs transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:border-slate-300 hover:shadow-lg hover:-translate-y-1.5"
                    >
                      <div>
                        <span className="block text-slate-300 text-3xl sm:text-4xl font-serif leading-none select-none mb-3 transition-colors duration-200 group-hover:text-amber-400">
                          “
                        </span>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal line-clamp-4">
                          “{review.quote}”
                        </p>
                        {isLongQuote && (
                          <button
                            type="button"
                            onClick={() => setSelectedReview(review)}
                            className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-pub-primary hover:text-blue-700 transition cursor-pointer group/btn"
                          >
                            <span>Read more</span>
                            <span className="transition-transform duration-200 group-hover/btn:translate-x-0.5">
                              →
                            </span>
                          </button>
                        )}
                      </div>

                      <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {review.image ? (
                            <img
                              src={review.image}
                              alt={review.name}
                              className="h-10 w-10 shrink-0 rounded-full object-cover shadow-sm border border-slate-100 transition-transform duration-200 group-hover:scale-105"
                            />
                          ) : (
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1478f2] text-xs font-bold text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
                              {review.initials}
                            </span>
                          )}
                          <div className="min-w-0">
                            <h3 className="truncate text-xs sm:text-sm font-semibold text-slate-900 transition-colors duration-200 group-hover:text-pub-secondary">
                              {review.name}
                            </h3>
                            <p className="truncate text-[11px] text-slate-400">
                              {review.city}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0 text-[#e85d26]">
                          {Array.from({ length: review.rating || 5 }).map(
                            (_, i) => (
                              <Star
                                key={i}
                                size={13}
                                className="fill-[#e85d26] text-[#e85d26]"
                              />
                            ),
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
          </div>
        </div>
      </div>

      {/* Testimonial Full Quote Popup Modal */}
      {selectedReview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs"
          onClick={() => setSelectedReview(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="testimonial-popup-name"
            className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedReview(null)}
              aria-label="Close review popup"
              className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Quote icon & Rating */}
            <div className="flex items-center justify-between mb-4 pr-10">
              <span className="text-amber-400 text-4xl sm:text-5xl font-serif leading-none select-none">
                “
              </span>
              <div className="flex items-center gap-1 text-[#e85d26]">
                {Array.from({ length: selectedReview.rating || 5 }).map(
                  (_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className="fill-[#e85d26] text-[#e85d26]"
                    />
                  ),
                )}
              </div>
            </div>

            {/* Full Quote */}
            <div className="max-h-[55vh] overflow-y-auto pr-2">
              <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal whitespace-pre-line">
                “{selectedReview.quote}”
              </p>
            </div>

            {/* Author details */}
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-3.5 min-w-0">
                {selectedReview.image ? (
                  <img
                    src={selectedReview.image}
                    alt={selectedReview.name}
                    className="h-12 w-12 shrink-0 rounded-full object-cover shadow-sm border border-slate-100"
                  />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1478f2] text-sm font-bold text-white shadow-sm">
                    {selectedReview.initials}
                  </span>
                )}
                <div className="min-w-0">
                  <h3
                    id="testimonial-popup-name"
                    className="truncate text-sm sm:text-base font-bold text-slate-900"
                  >
                    {selectedReview.name}
                  </h3>
                  <p className="truncate text-xs text-slate-500">
                    {selectedReview.city || selectedReview.tourName || "Verified Traveller"}
                  </p>
                </div>
              </div>

              {selectedReview.tourName && (
                <span className="hidden sm:inline-block rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600 truncate max-w-[170px]">
                  {selectedReview.tourName}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

