"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from "react";
import { LuArrowRight as ArrowRight } from "react-icons/lu";
import { NewsletterBannerBlock, fetchContentBlock, subscribeNewsletter } from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";

export interface HomeNewsletterBannerProps {
  initialData?: Partial<NewsletterBannerBlock>;
  badge?: string;
  heading?: string;
  subtitle?: string;
  image?: string;
}

export default function HomeNewsletterBanner({
  initialData,
  badge: propBadge,
  heading: propHeading,
  subtitle: propSubtitle,
  image: propImage,
}: HomeNewsletterBannerProps) {
  const [data, setData] = useState<Partial<NewsletterBannerBlock>>(initialData || {});

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setData(initialData);
      return;
    }

    let active = true;
    fetchContentBlock<NewsletterBannerBlock>("newsletter_banner")
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

  const badge = propBadge || data.badge || "Special Offers";
  const heading = propHeading || data.heading || "Get Exclusive Deals & Travel Updates";
  const subtitle =
    propSubtitle ||
    data.subtitle ||
    "Subscribe to Tourvaa's newsletter for secret sales, handpicked itineraries, and member-only discounts delivered straight to your inbox.";
  const image =
    propImage || (data.image ? mediaUrl(data.image) : "/images/register.png");

  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || subscribing) return;

    try {
      setSubscribing(true);
      setMessage(null);
      await subscribeNewsletter(email.trim());
      setMessage({
        type: "success",
        text: "Thank you for registering! Special offers and updates are on their way.",
      });
      setEmail("");
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Registration failed. Please try again.",
      });
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <section className="w-full my-3 sm:my-5">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-8">
        <div className="group relative w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-sm transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:shadow-xl">
          {/* Background image & gradient overlay */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={image}
              alt={heading}
              className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-106"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-slate-950/45" />
          </div>

          {/* Foreground content */}
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 p-5 sm:p-7 lg:p-9 min-h-[160px]">
            {/* Left Content */}
            <div className="max-w-xl text-left">
              {badge && (
                <span className="inline-flex items-center rounded-full bg-[#E4572E] px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-xs">
                  {badge}
                </span>
              )}
              <h2 className="mt-2.5 text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                {heading}
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm md:text-[14px] text-white/90 font-medium leading-relaxed max-w-lg">
                {subtitle}
              </p>
            </div>

            {/* Right Registration / Newsletter Form */}
            <div className="w-full lg:max-w-md">
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
              >
                <div className="relative flex-1">
                  <input
                    type="email"
                    required
                    placeholder="Enter Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 sm:h-12 w-full rounded-xl border border-white/30 bg-black/25 backdrop-blur-md px-4 text-sm text-white placeholder:text-white/70 focus:border-[#E4572E] focus:ring-2 focus:ring-[#E4572E]/40 focus:bg-black/50 focus:outline-none transition-all duration-200 shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  disabled={subscribing}
                  className="group/btn h-11 sm:h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1527] px-6 sm:px-7 text-sm sm:text-base font-bold text-white shadow-lg transition-all duration-200 hover:bg-[#15233C] hover:shadow-xl hover:-translate-y-0.5 active:scale-95 whitespace-nowrap disabled:opacity-60 cursor-pointer"
                >
                  <span>{subscribing ? "Registering..." : "Register"}</span>
                  <ArrowRight
                    size={16}
                    className="text-[#E4572E] stroke-[2.5] transition-transform duration-200 group-hover/btn:translate-x-1"
                  />
                </button>
              </form>

              {message && (
                <p
                  className={`mt-2 text-xs font-bold ${
                    message.type === "success"
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {message.text}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
