"use client";

/* eslint-disable @next/next/no-img-element */

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LuArrowRight as ArrowRight, LuSparkles as Sparkles } from "react-icons/lu";
import { CmsBlog, fetchPublicBlogs, subscribeNewsletter } from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import AboutReveal from "@/components/public/AboutReveal";

const CATEGORIES = [
  "All",
  "Destinations",
  "Travel Tips",
  "Culture",
  "Food & Drink",
  "Adventure",
  "News",
];

const CURATED_FEATURED_POST = {
  slug: "silk-road-guide-2026",
  title: "The Ultimate Guide to Exploring the Silk Road in 2026",
  category: "DESTINATIONS",
  excerpt:
    "Embark on an ancient journey across high mountain passes, remote desert outposts, and vibrant historical markets. Discover the essential routes, visa requirements, seasonal windows, and pack lists for an unforgettable expedition.",
  image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
  authorName: "Alex Mercer",
  date: "Mar 12, 2026",
  readTime: "12 min read",
};

const CURATED_LATEST_ARTICLES = [
  {
    slug: "best-time-to-visit-machu-picchu",
    title: "The Best Time to Visit Machu Picchu",
    category: "CULTURE",
    excerpt:
      "A seasonal breakdown of Peru's dry and wet seasons to help you plan the perfect trek to this iconic mountain citadel.",
    image: "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "top-10-hidden-gems-in-morocco",
    title: "Top 10 Hidden Gems in Morocco You Need to Visit",
    category: "DESTINATIONS",
    excerpt:
      "Venture beyond the medinas to discover Morocco's best-kept secrets, from blue villages to desert oases.",
    image: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "first-timers-guide-to-trekking-nepal",
    title: "A First-Timer's Guide to Trekking in Nepal",
    category: "ADVENTURE",
    excerpt:
      "Everything you need to know about permits, altitude, routes, and what to pack for your first Himalayan trek.",
    image: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "bangkok-night-markets-street-food",
    title: "Street Food Adventures: Bangkok's Best Night Markets",
    category: "FOOD & CULTURE",
    excerpt:
      "Navigate the vibrant night markets of Bangkok like a local with our insider guide to the best street food.",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "sustainable-travel-responsible-tourism",
    title: "Sustainable Travel: How to Explore Responsibly",
    category: "SUSTAINABILITY",
    excerpt:
      "Practical tips for reducing your footprint, supporting local communities, and travelling with purpose.",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "why-egypt-should-be-your-next-winter-escape",
    title: "Why Egypt Should Be Your Next Winter Escape",
    category: "DESTINATIONS",
    excerpt:
      "Sun-soaked temples, Nile cruises, and Red Sea diving - why Egypt is the perfect cold-weather getaway.",
    image: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80",
  },
];

function delay(milliseconds: number) {
  return { "--reveal-delay": `${milliseconds}ms` } as CSSProperties;
}

export default function BlogsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribing(true);
    try {
      await subscribeNewsletter(email.trim());
      setMessage("Thank you — travel stories are on their way!");
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
              src="https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=1600&q=80"
              alt="Panoramic alpine mountain vista"
              className="animate-tourvaa-hero h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-900/15" />
          </section>
        </div>

        <div className="mx-auto max-w-[1400px] px-5 pt-10 sm:pt-14">
          {/* Main Title */}
          <div data-reveal>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Tourvaa Blog
            </h1>
            <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-slate-500 max-w-3xl font-medium">
              Everything you need to know before you go - from visa tips to packing lists, we&apos;ve got you covered on your next global adventure.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div data-reveal className="mt-8 flex flex-wrap gap-2.5">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-5 py-2 text-xs font-bold transition-all duration-200 ${
                    active
                      ? "bg-[#E4572E] text-white shadow-xs"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Featured Lead Article Card */}
          <div data-reveal className="mt-10">
            <Link
              href={`/blogs/${CURATED_FEATURED_POST.slug}`}
              className="group block overflow-hidden rounded-[20px] border border-slate-100/90 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                <div className="relative h-[260px] sm:h-[320px] md:h-[360px] w-full overflow-hidden rounded-[16px] bg-slate-100">
                  <img
                    src={CURATED_FEATURED_POST.image}
                    alt={CURATED_FEATURED_POST.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>

                <div className="flex flex-col justify-center py-2 px-2 sm:px-4">
                  <span className="inline-flex w-fit items-center gap-1 rounded-md bg-sky-50 px-2.5 py-1 text-[11px] font-extrabold text-sky-700">
                    {CURATED_FEATURED_POST.category}
                  </span>

                  <h2 className="mt-3 text-2xl sm:text-3xl font-black text-slate-950 leading-tight tracking-tight group-hover:text-[#E4572E] transition-colors">
                    {CURATED_FEATURED_POST.title}
                  </h2>

                  <p className="mt-3 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                    {CURATED_FEATURED_POST.excerpt}
                  </p>

                  <div className="mt-6 flex items-center gap-3 pt-4 border-t border-slate-100">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-bold text-xs text-blue-700">
                      AM
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">{CURATED_FEATURED_POST.authorName}</p>
                      <p className="text-slate-400">{CURATED_FEATURED_POST.date} · {CURATED_FEATURED_POST.readTime}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Latest Articles (6 Cards Grid) */}
          <div className="mt-16 sm:mt-20">
            <div data-reveal>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                Latest Articles
              </h2>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {CURATED_LATEST_ARTICLES.map((article, index) => (
                <Link
                  key={article.title}
                  href={`/blogs/${article.slug}`}
                  data-reveal
                  style={delay(index * 60)}
                  className="group flex flex-col overflow-hidden rounded-[20px] border border-slate-100/90 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative h-48 w-full overflow-hidden rounded-[14px] bg-slate-100">
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
                    <h3 className="mt-1.5 text-base font-extrabold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#E4572E] transition-colors">
                      {article.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed flex-1">
                      {article.excerpt}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#E4572E] group-hover:underline">
                      <span>Read Article</span>
                      <ArrowRight size={13} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              ))}
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
