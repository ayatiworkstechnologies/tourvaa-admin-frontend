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
} from "react-icons/lu";

import AboutReveal from "@/components/public/AboutReveal";
import { subscribeNewsletter } from "@/lib/api/publicClient";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";

const categories = [
  { title: "Visa & Passport Info", text: "Key entry requirements and validity guidelines for every continent.", image: "/images/about/priya.jpg", href: "#popular-advice" },
  { title: "Health & Vaccinations", text: "Stay safe on the trail with region-specific medical advisories.", image: "/images/about/local-guide.jpg", href: "#popular-advice" },
  { title: "Travel Insurance", text: "Comprehensive protection tailored specifically for active pursuits.", image: "/images/destination-alpine.jpg", href: "#popular-advice" },
  { title: "Packing Guides", text: "Gear checklists and light-packing strategies for different climates.", image: "/images/hero-3.jpg", href: "#popular-advice" },
  { title: "Money & Currency", text: "Expert tips on local tipping, banking, and safe cash management.", image: "/images/destination-desert.jpg", href: "#popular-advice" },
  { title: "Safety Tips", text: "Essential general advice for worry-free expedition mapping.", image: "/images/hero-1.jpg", href: "#travel-essentials" },
];

const articles = [
  { category: "VISAS & PASSPORTS", title: "Your Complete Guide to Travel Visas & Entry Requirements", text: "Everything you need to know about visa applications, passport validity, and border entry requirements for popular destinations.", image: "/images/hero-2.jpg", href: "/blogs/solo-travel-guide" },
  { category: "TRAVEL INSURANCE", title: "Why Travel Insurance Is Non-Negotiable in 2026", text: "From medical emergencies to trip cancellations, learn what your policy should cover and how to choose the right plan.", image: "/images/destination-alpine.jpg", href: "/blogs/solo-travel-guide" },
  { category: "HEALTH & SAFETY", title: "Essential Vaccinations & Health Tips for International Travel", text: "A country-by-country guide to recommended vaccines, medications, and health precautions before you fly.", image: "/images/about/local-guide.jpg", href: "/blogs/top-5-monsoon-destinations" },
  { category: "MONEY & CURRENCY", title: "Managing Money Abroad: Cards, Cash & Currency Exchange", text: "Smart strategies for handling finances overseas including the best travel cards and avoiding hidden fees.", image: "/images/destination-desert.jpg", href: "/blogs/solo-travel-guide" },
];

const essentials = [
  { icon: UserRoundCheck, title: "Passport Checklist", text: "Ensure minimum 6 months validity from your scheduled return date." },
  { icon: CloudSun, title: "Weather Guidance", text: "Review peak seasonality guides and tailored climate checklists." },
  { icon: Languages, title: "Local Etiquette", text: "Understand specific custom rules, clothing notes, and photography taboos." },
  { icon: ShieldCheck, title: "Emergency Contacts", text: "Immediate travel-risk hotlines and embassy directories always on call." },
];

function delay(milliseconds: number) {
  return { "--reveal-delay": `${milliseconds}ms` } as CSSProperties;
}

export default function TravelAdvicePage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    try {
      await subscribeNewsletter(email.trim());
      setMessage("Thank you — travel tips are on their way!");
      setEmail("");
    } catch (err: unknown) {
      setMessage(getApiErrorMessage(err));
    }
  }

  return (
    <AboutReveal>
      <main className="overflow-hidden bg-white text-[#171717]">
        <section className="relative mt-20 h-[260px] overflow-hidden sm:h-[330px] lg:h-[390px]">
          <img src="/images/destination-alpine.jpg" alt="Snow-covered mountains above a green alpine valley" className="animate-tourvaa-hero h-full w-full object-cover" />
          <div className="absolute inset-0 bg-slate-900/10" />
        </section>

        <section className="mx-auto max-w-[1320px] px-5 pb-16 pt-12 sm:px-8 lg:px-12 lg:pb-24 lg:pt-14">
          <div data-reveal>
            <h1 className="font-heading text-3xl font-black tracking-tight sm:text-4xl">Travel Advice &amp; Guides</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">Everything you need to know before you go - from visa tips to packing lists, we&apos;ve got you covered on your next global adventure.</p>
          </div>

          <div className="mt-16 lg:mt-20">
            <div data-reveal>
              <h2 className="font-heading text-2xl font-black tracking-tight sm:text-3xl">Featured Advice Categories</h2>
              <p className="mt-2 text-sm text-slate-500">Browse essential pre-departure resources curated by our expedition leaders.</p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category, index) => (
                <Link key={category.title} href={category.href} data-reveal style={delay(index * 65)} className="group relative h-[255px] overflow-hidden rounded-xl bg-slate-900 shadow-[0_12px_28px_rgba(15,23,42,.16)]">
                  <img src={category.image} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent transition group-hover:from-blue-950" />
                  <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-xl font-black">{category.title}</h3>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 transition group-hover:translate-x-1 group-hover:bg-blue-500"><ArrowRight size={17} /></span>
                    </div>
                    <p className="mt-3 max-w-sm text-sm leading-5 text-white/75">{category.text}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div id="popular-advice" className="scroll-mt-28 pt-20 lg:pt-28">
            <h2 data-reveal className="font-heading text-3xl font-black tracking-tight sm:text-4xl">Popular Travel Advice Articles</h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {articles.map((article, index) => (
                <article key={article.title} data-reveal style={delay(index * 75)} className="group flex min-h-[470px] flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,.05)] transition duration-500 hover:-translate-y-2 hover:shadow-xl">
                  <div className="h-44 overflow-hidden rounded-lg bg-slate-100">
                    <img src={article.image} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  </div>
                  <div className="flex flex-1 flex-col px-2 pb-3 pt-5">
                    <p className="text-[11px] font-black tracking-wide text-blue-600">{article.category}</p>
                    <h3 className="mt-3 text-lg font-black leading-6 text-slate-900">{article.title}</h3>
                    <p className="mt-3 line-clamp-4 text-sm leading-5 text-slate-500">{article.text}</p>
                    <Link href={article.href} className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-black text-blue-600 transition hover:gap-3">Read Article <ArrowRight size={15} /></Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div id="travel-essentials" className="scroll-mt-28 pt-20 lg:pt-28">
            <div data-reveal>
              <h2 className="font-heading text-2xl font-black tracking-tight sm:text-3xl">Travel Essentials Dashboard</h2>
              <p className="mt-2 text-sm text-slate-500">Four simple checks before setting off on your next expedition.</p>
            </div>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
              {essentials.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} data-reveal style={delay(index * 80)} className="group">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition duration-300 group-hover:-translate-y-1 group-hover:rotate-3"><Icon size={21} /></span>
                    <h3 className="mt-5 text-base font-black">{item.title}</h3>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div data-reveal className="mx-auto flex max-w-[1320px] flex-col gap-8 px-5 py-12 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-14">
            <div>
              <h2 className="font-heading text-2xl font-black tracking-tight sm:text-3xl">Get Travel Tips Straight to Your Inbox</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Subscribe to receive tactical gear updates, packing checklists, and sudden destination safety bulletins.</p>
            </div>
            <form onSubmit={subscribe} className="w-full lg:max-w-[520px]">
              <div className="flex flex-col gap-3 sm:flex-row">
                <label htmlFor="advice-email" className="sr-only">Email address</label>
                <input id="advice-email" type="email" required value={email} onChange={(event) => { setEmail(event.target.value); setMessage(""); }} placeholder="Enter your email address" className="min-h-12 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" />
                <button type="submit" className="min-h-12 rounded-lg bg-blue-600 px-8 text-sm font-black text-white shadow-lg shadow-blue-600/15 transition hover:-translate-y-0.5 hover:bg-blue-500">Subscribe</button>
              </div>
              {message && <p role="status" className="mt-2 text-sm font-semibold text-emerald-600">{message}</p>}
            </form>
          </div>
        </section>
      </main>
    </AboutReveal>
  );
}
