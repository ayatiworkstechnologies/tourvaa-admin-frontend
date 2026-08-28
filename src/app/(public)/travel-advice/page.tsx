"use client";

/* eslint-disable @next/next/no-img-element */

import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuCloudSun as CloudSun,
  LuHeartPulse as HeartPulse,
  LuLanguages as Languages,
  LuMapPinned as MapPinned,
  LuPlaneTakeoff as PlaneTakeoff,
  LuShieldCheck as ShieldCheck,
  LuUserRoundCheck as UserRoundCheck,
  LuSparkles as Sparkles,
  LuCircleArrowRight as CircleArrowRight,
} from "react-icons/lu";

import AboutReveal from "@/components/public/AboutReveal";
import { subscribeNewsletter } from "@/lib/api/publicClient";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";

const categories = [
  {
    title: "Visa & Passport Info",
    text: "Key entry requirements and validity guidelines for every continent.",
    image: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
    href: "/blogs",
  },
  {
    title: "Health & Vaccinations",
    text: "Stay safe on the trail with region-specific medical advisories.",
    image: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=800&q=80",
    href: "/blogs",
  },
  {
    title: "Travel Insurance",
    text: "Comprehensive protection tailored specifically for active pursuits.",
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80",
    href: "/blogs",
  },
  {
    title: "Packing Guides",
    text: "Gear checklists and light-packing strategies for different climates.",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    href: "/blogs",
  },
  {
    title: "Money & Currency",
    text: "Expert tips on local tipping, banking, and safe cash management.",
    image: "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=800&q=80",
    href: "/blogs",
  },
  {
    title: "Safety Tips",
    text: "Essential general advice for worry-free expedition mapping.",
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80",
    href: "/blogs",
  },
];

const articles = [
  {
    category: "VISAS & PASSPORTS",
    title: "Your Complete Guide to Travel Visas & Entry Requirements",
    text: "Everything you need to know about visa applications, passport validity, and border entry requirements for popular destinations.",
    image: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
    href: "/blogs",
  },
  {
    category: "TRAVEL INSURANCE",
    title: "Why Travel Insurance Is Non-Negotiable in 2026",
    text: "From medical emergencies to trip cancellations, learn what your policy should cover and how to choose the right plan.",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
    href: "/blogs",
  },
  {
    category: "HEALTH & SAFETY",
    title: "Essential Vaccinations & Health Tips for International...",
    text: "A country-by-country guide to recommended vaccines, medications, and health precautions before you fly.",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80",
    href: "/blogs",
  },
  {
    category: "MONEY & CURRENCY",
    title: "Managing Money Abroad: Cards, Cash & Currency Exch...",
    text: "Smart strategies for handling finances overseas including the best travel cards and avoiding hidden fees.",
    image: "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=800&q=80",
    href: "/blogs",
  },
];

const essentials = [
  {
    icon: UserRoundCheck,
    title: "Passport Checklist",
    text: "Ensure minimum 6 months validity from your scheduled return date.",
  },
  {
    icon: CloudSun,
    title: "Weather Guidance",
    text: "Review peak seasonality guides and tailored climate checklists.",
  },
  {
    icon: Languages,
    title: "Local Etiquette",
    text: "Understand specific custom rules, clothing notes, and photography taboos.",
  },
  {
    icon: ShieldCheck,
    title: "Emergency Contacts",
    text: "Immediate travel-risk hotlines and embassy directories always on call.",
  },
];

function delay(milliseconds: number) {
  return { "--reveal-delay": `${milliseconds}ms` } as CSSProperties;
}

export default function TravelAdvicePage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribing(true);
    try {
      await subscribeNewsletter(email.trim());
      setMessage("Thank you — travel tips are on their way!");
      setEmail("");
    } catch (err: unknown) {
      setMessage(getApiErrorMessage(err));
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <AboutReveal>
      <main className="overflow-hidden bg-white text-slate-900 pb-20">
        {/* Top Hero Landscape Banner */}
        <div className="mx-auto max-w-[1400px] px-5 pt-3">
          <section className="relative h-[300px] sm:h-[360px] md:h-[400px] w-full overflow-hidden rounded-[20px] bg-slate-900 shadow-md">
            <img
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80"
              alt="Misty mountain river valley landscape"
              className="animate-tourvaa-hero h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-900/15" />
          </section>
        </div>

        <div className="mx-auto max-w-[1400px] px-5 pt-10 sm:pt-14">
          {/* Main Title */}
          <div data-reveal>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Travel Advice &amp; Guides
            </h1>
            <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-slate-500 max-w-3xl font-medium">
              Everything you need to know before you go - from visa tips to packing lists, we&apos;ve got you covered on your next global adventure.
            </p>
          </div>

          {/* Featured Advice Categories (6 Cards in 3x2 Grid) */}
          <div className="mt-12 sm:mt-16">
            <div data-reveal>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                Featured Advice Categories
              </h2>
              <p className="mt-1.5 text-sm text-slate-500 font-medium">
                Browse essential pre-departure resources curated by our expedition leaders.
              </p>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category, index) => (
                <Link
                  key={category.title}
                  href={category.href}
                  data-reveal
                  style={delay(index * 60)}
                  className="group relative h-[240px] overflow-hidden rounded-[20px] bg-slate-900 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <img
                    src={category.image}
                    alt={category.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg sm:text-xl font-black">{category.title}</h3>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0B1527] text-white transition group-hover:translate-x-1 group-hover:bg-[#E4572E]">
                        <ArrowRight size={15} />
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-white/80 leading-relaxed font-normal">
                      {category.text}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Popular Travel Advice Articles (4 Cards Grid) */}
          <div className="mt-16 sm:mt-20">
            <div data-reveal>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                Popular Travel Advice Articles
              </h2>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {articles.map((article, index) => (
                <Link
                  key={article.title}
                  href={article.href}
                  data-reveal
                  style={delay(index * 60)}
                  className="group flex flex-col overflow-hidden rounded-[20px] border border-slate-100/90 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative h-44 w-full overflow-hidden rounded-[14px] bg-slate-100">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-3 flex flex-1 flex-col">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600">
                      {article.category}
                    </span>
                    <h3 className="mt-1.5 text-sm sm:text-[15px] font-extrabold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {article.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-500 line-clamp-3 leading-relaxed flex-1">
                      {article.text}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#E4572E] group-hover:underline">
                      <span>Read Article</span>
                      <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Travel Essentials Dashboard (4 Simple Checks) */}
          <div className="mt-16 sm:mt-20">
            <div data-reveal>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                Travel Essentials Dashboard
              </h2>
              <p className="mt-1.5 text-sm text-slate-500 font-medium">
                Four simple checks before setting off on your next expedition.
              </p>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {essentials.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    data-reveal
                    style={delay(index * 60)}
                    className="flex flex-col items-start rounded-[20px] border border-slate-100 bg-white p-6 shadow-sm"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0B1527] text-white shadow-xs">
                      <Icon size={20} />
                    </span>
                    <h3 className="mt-4 text-base font-extrabold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Newsletter Subscribe Banner */}
          <div data-reveal className="mt-16 sm:mt-20">
            <section className="rounded-[24px] border border-slate-100/90 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                    Get Travel Tips Straight to Your Inbox
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium">
                    Subscribe to receive tactical gear updates, packing checklists, and sudden destination safety bulletins.
                  </p>
                </div>

                <form onSubmit={subscribe} className="flex w-full max-w-md items-center gap-3">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0B1527] focus:bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={subscribing}
                    className="h-12 rounded-xl bg-[#0B1527] px-6 text-sm font-black text-white shadow-md hover:bg-[#15233C] transition disabled:opacity-60"
                  >
                    {subscribing ? "Subscribing..." : "Subscribe"}
                  </button>
                </form>
              </div>
              {message && (
                <p className="mt-3 text-xs font-bold text-emerald-600">{message}</p>
              )}
            </section>
          </div>
        </div>
      </main>
    </AboutReveal>
  );
}
