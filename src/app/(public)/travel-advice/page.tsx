"use client";

/* eslint-disable @next/next/no-img-element */

import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuCloudSun as CloudSun,
  LuLanguages as Languages,
  LuShieldCheck as ShieldCheck,
  LuUserRoundCheck as UserRoundCheck,
  LuCompass as Compass,
  LuSparkles as Sparkles,
} from "react-icons/lu";

import AboutReveal from "@/components/public/AboutReveal";
import PageUnavailable from "@/components/public/PageUnavailable";
import { subscribeNewsletter } from "@/lib/api/publicClient";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { useContentBlock } from "@/hooks/useContentBlock";

const DEFAULT_HERO = {
  is_active: true,
  badge_label: "Field-Tested Expedition Guidance",
  badge_note: "Updated Weekly",
  heading: "Essential Travel Advice & Guides",
  subtitle:
    "Everything you need to know before you embark — from border entry protocols and seasonal packing checklists to local currency tips, curated by our global tour leaders.",
  background_image:
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1800&q=80",
};

const DEFAULT_CATEGORIES = [
  {
    title: "Visa & Passport Info",
    text: "Key entry requirements, validity thresholds, and e-Visa protocols for every continent.",
    image:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
    href: "/blogs",
  },
  {
    title: "Health & Vaccinations",
    text: "Region-specific immunization checklists, altitude adaptation, and medical advisories.",
    image:
      "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=800&q=80",
    href: "/blogs",
  },
  {
    title: "Travel Insurance",
    text: "Comprehensive trip cancellation, baggage protection, and emergency medical policies.",
    image:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80",
    href: "/blogs",
  },
  {
    title: "Packing Guides",
    text: "Tactical gear checklists, lightweight layering tips, and season-specific essentials.",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    href: "/blogs",
  },
  {
    title: "Money & Currency",
    text: "Smart foreign exchange advice, local tipping customs, and travel card recommendations.",
    image:
      "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=800&q=80",
    href: "/blogs",
  },
  {
    title: "Safety & Scams",
    text: "Street safety protocols, solo traveler guidance, and verified emergency directories.",
    image:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80",
    href: "/blogs",
  },
];

const DEFAULT_ARTICLES = [
  {
    category: "VISAS & PASSPORTS",
    title: "Your Complete Guide to Travel Visas & Border Requirements",
    text: "Everything you need to know about processing times, biometric requirements, and minimum passport validity before you book.",
    image:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
    href: "/blogs",
    readTime: "6 min read",
  },
  {
    category: "TRAVEL INSURANCE",
    title: "Why Comprehensive Travel Insurance Is Essential in 2026",
    text: "From sudden trip interruptions to remote evacuation, understand the essential coverage requirements for high-altitude & active journeys.",
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
    href: "/blogs",
    readTime: "5 min read",
  },
  {
    category: "HEALTH & SAFETY",
    title: "Essential Immunizations & Travel Health Tips for Travelers",
    text: "Country-by-country recommendations for preventative medications, hydration routines, and recommended vaccinations.",
    image:
      "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80",
    href: "/blogs",
    readTime: "7 min read",
  },
  {
    category: "MONEY & CURRENCY",
    title: "Managing Finances Abroad: Cash, Digital Cards & Fees",
    text: "Proven financial strategies for remote markets, zero foreign transaction fee cards, and avoiding airport currency markups.",
    image:
      "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=800&q=80",
    href: "/blogs",
    readTime: "4 min read",
  },
];

const DEFAULT_ESSENTIALS = [
  {
    icon: UserRoundCheck,
    title: "Passport Validity",
    text: "Ensure minimum 6 months validity from your scheduled return flight.",
    tag: "Rule #1",
  },
  {
    icon: CloudSun,
    title: "Seasonal Climate",
    text: "Review regional monsoon periods, elevation chill, and daylight windows.",
    tag: "Weather",
  },
  {
    icon: Languages,
    title: "Cultural Etiquette",
    text: "Respect local dress codes, temple guidelines, and photography etiquette.",
    tag: "Respect",
  },
  {
    icon: ShieldCheck,
    title: "24/7 Embassy Hotlines",
    text: "Save local emergency numbers and offline digital copies of your passport.",
    tag: "Safety",
  },
];

type CategoryItem = { image?: string; title?: string; text?: string; href?: string };
type ArticleItem = { image?: string; category?: string; title?: string; text?: string; href?: string; readTime?: string };
type EssentialItem = { title?: string; text?: string; tag?: string };
type CategoriesBlock = { items?: CategoryItem[] };
type ArticlesBlock = { items?: ArticleItem[] };
type EssentialsBlock = { items?: EssentialItem[] };

const ESSENTIAL_ICONS = DEFAULT_ESSENTIALS.map((e) => e.icon);

function delay(milliseconds: number) {
  return { "--reveal-delay": `${milliseconds}ms` } as CSSProperties;
}

export default function TravelAdvicePage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const hero = useContentBlock("travel_advice_hero", DEFAULT_HERO);
  const categoriesBlock = useContentBlock<CategoriesBlock>("travel_advice_categories", {});
  const articlesBlock = useContentBlock<ArticlesBlock>("travel_advice_articles", {});
  const essentialsBlock = useContentBlock<EssentialsBlock>("travel_advice_essentials", {});

  const categories = categoriesBlock.items?.length
    ? categoriesBlock.items.map((it) => ({ image: it.image || "", title: it.title || "", text: it.text || "", href: it.href || "" }))
    : DEFAULT_CATEGORIES;
  const articles = articlesBlock.items?.length
    ? articlesBlock.items.map((it) => ({ image: it.image || "", category: it.category || "", title: it.title || "", text: it.text || "", href: it.href || "", readTime: it.readTime || "" }))
    : DEFAULT_ARTICLES;
  const essentials = essentialsBlock.items?.length
    ? essentialsBlock.items.map((it, i) => ({ icon: ESSENTIAL_ICONS[i % ESSENTIAL_ICONS.length], title: it.title || "", text: it.text || "", tag: it.tag || "" }))
    : DEFAULT_ESSENTIALS;

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribing(true);
    try {
      await subscribeNewsletter(email.trim());
      setMessage("Thank you — curated expedition advice is heading to your inbox!");
      setEmail("");
    } catch (err: unknown) {
      setMessage(getApiErrorMessage(err));
    } finally {
      setSubscribing(false);
    }
  }

  if (hero.is_active === false) {
    return <PageUnavailable />;
  }

  return (
    <AboutReveal>
      <main className="overflow-hidden bg-[#FAFAFC] text-slate-900 pb-24">
        {/* ── 1. Top Cinematic Hero Landscape Banner ── */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-4 sm:pt-6">
          <section className="relative min-h-[340px] sm:min-h-[400px] w-full overflow-hidden rounded-[26px] bg-[#0B1F3A] shadow-xl flex items-center">
            <img
              src={hero.background_image || DEFAULT_HERO.background_image}
              alt="Misty mountain river valley landscape"
              className="animate-tourvaa-hero absolute inset-0 h-full w-full object-cover opacity-55 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B1F3A] via-[#0B1F3A]/85 to-transparent" />

            <div className="relative z-10 max-w-3xl px-6 sm:px-12 py-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-bold text-white backdrop-blur-md shadow-xs">
                <Compass size={14} className="text-amber-400" />
                <span>{hero.badge_label || DEFAULT_HERO.badge_label}</span>
                <span className="text-white/40">•</span>
                <span className="text-white/80">{hero.badge_note || DEFAULT_HERO.badge_note}</span>
              </div>

              <h1 className="mt-4 text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight text-white font-heading leading-tight drop-shadow-md">
                {hero.heading || DEFAULT_HERO.heading}
              </h1>

              <p className="mt-3 text-sm sm:text-base leading-relaxed text-white/85 font-medium max-w-2xl">
                {hero.subtitle || DEFAULT_HERO.subtitle}
              </p>
            </div>
          </section>
        </div>

        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-12 sm:pt-16">
          {/* ── 2. Featured Advice Categories (6 Cards in 3x2 Grid) ── */}
          <div>
            <div data-reveal className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-pub-secondary">
                  ESSENTIAL TOPICS
                </span>
                <h2 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-950 font-heading">
                  Browse by Advice Category
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md">
                Comprehensive pre-departure resources crafted to ensure your international journey is seamless.
              </p>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category, index) => (
                <Link
                  key={category.title}
                  href={category.href}
                  data-reveal
                  style={delay(index * 60)}
                  className="group relative h-[250px] overflow-hidden rounded-2xl bg-slate-950 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-slate-200/40"
                >
                  <img
                    src={category.image}
                    alt={category.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg sm:text-xl font-bold font-heading">
                        {category.title}
                      </h3>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition group-hover:translate-x-1 group-hover:bg-pub-accent">
                        <ArrowRight size={15} />
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-white/80 leading-relaxed font-normal">
                      {category.text}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── 3. Popular Travel Advice Articles (4 Cards Grid) ── */}
          <div className="mt-20 sm:mt-24">
            <div data-reveal className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-pub-secondary">
                  DEEP DIVES
                </span>
                <h2 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-950 font-heading">
                  Featured Pre-Departure Articles
                </h2>
              </div>
              <Link
                href="/blogs"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-pub-secondary hover:underline"
              >
                <span>Browse All Articles</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {articles.map((article, index) => (
                <Link
                  key={article.title}
                  href={article.href}
                  data-reveal
                  style={delay(index * 60)}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-slate-300"
                >
                  <div className="relative h-44 w-full overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <span className="absolute top-2.5 right-2.5 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                      {article.readTime}
                    </span>
                  </div>
                  <div className="mt-3.5 flex flex-1 flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                      {article.category}
                    </span>
                    <h3 className="mt-1.5 text-sm sm:text-[15px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-pub-secondary transition-colors font-heading">
                      {article.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed flex-1 font-normal">
                      {article.text}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-pub-accent group-hover:underline">
                      <span>Read Full Guide</span>
                      <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── 4. Travel Essentials Dashboard (4 Simple Checks) ── */}
          <div className="mt-20 sm:mt-24">
            <div data-reveal>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-pub-secondary">
                CHECKLIST
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-950 font-heading">
                Four Essential Pre-Flight Checks
              </h2>
              <p className="mt-2 text-sm text-slate-600 font-medium">
                Mandatory checkpoints before you head to the airport for your tour.
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
                    className="flex flex-col items-start rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:border-slate-300 transition-all"
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                        <Icon size={20} />
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                        {item.tag}
                      </span>
                    </div>
                    <h3 className="mt-4 text-base font-bold text-slate-950 font-heading">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed font-normal">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 5. Newsletter Subscribe Banner ── */}
          <div data-reveal className="mt-20 sm:mt-24">
            <section className="rounded-[26px] border border-slate-200/90 bg-white p-8 sm:p-12 shadow-sm">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 mb-2">
                    <Sparkles size={13} />
                    <span>Insider Intelligence</span>
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight font-heading">
                    Get Curated Travel Bulletins in Your Inbox
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 font-medium">
                    Subscribe for tactical packing checklists, visa regulation alerts, and seasonal destination guides directly from certified tour operators.
                  </p>
                </div>

                <div className="w-full max-w-md">
                  <form
                    onSubmit={subscribe}
                    className="flex w-full items-center gap-3"
                  >
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-pub-secondary focus:bg-white focus:outline-none transition"
                    />
                    <button
                      type="submit"
                      disabled={subscribing}
                      className="h-12 rounded-xl bg-[#0B1F3A] px-6 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-slate-800 transition disabled:opacity-60 shrink-0"
                    >
                      {subscribing ? "Subscribing..." : "Join Club"}
                    </button>
                  </form>
                  {message && (
                    <p className="mt-3 text-xs font-bold text-emerald-600">
                      {message}
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </AboutReveal>
  );
}
