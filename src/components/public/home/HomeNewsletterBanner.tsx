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

  const badge = propBadge || data.badge || "Special Offer";
  const heading = propHeading || data.heading || "Get $50 Off Your Next Trip!";
  const subtitle =
    propSubtitle ||
    data.subtitle ||
    "Subscribe to our newsletter for exclusive deals, insider tips, and travel inspiration.";
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
    <section className="w-full my-4 sm:my-6">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-8">
        <div className="group relative w-full overflow-hidden rounded-[20px] sm:rounded-[24px] bg-[#FFF8F6] border border-pub-accent/25 p-6 sm:p-8 lg:p-10 shadow-xs transition-all">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left Content */}
            <div className="max-w-xl text-left">
              {badge && (
                <span className="inline-flex items-center rounded-full bg-pub-accent px-3.5 py-1 text-[11px] sm:text-xs font-semibold text-white shadow-2xs">
                  {badge}
                </span>
              )}
              <h2 className="mt-2.5 text-2xl sm:text-3xl lg:text-[32px] font-semibold text-slate-900 tracking-tight leading-tight">
                {heading}
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 font-normal leading-relaxed max-w-lg">
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
                    className="h-11 sm:h-12 w-full rounded-lg border border-pub-accent/25 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-pub-accent transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={subscribing}
                  className="h-11 sm:h-12 inline-flex items-center justify-center gap-2 rounded-lg bg-pub-primary hover:bg-pub-primary-dark active:scale-95 px-6 sm:px-7 text-sm font-bold text-white shadow-sm transition-all whitespace-nowrap disabled:opacity-60 cursor-pointer"
                >
                  <span>{subscribing ? "Registering..." : "Register"}</span>
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </button>
              </form>

              {message && (
                <p
                  className={`mt-2 text-xs font-semibold ${
                    message.type === "success"
                      ? "text-emerald-600"
                      : "text-rose-600"
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

