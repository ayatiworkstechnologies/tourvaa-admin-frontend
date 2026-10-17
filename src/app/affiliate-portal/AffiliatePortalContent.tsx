"use client";

import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuChartColumn as BarChart3,
  LuCircleCheckBig as CheckCircle2,
  LuLink2 as Link2,
  LuMegaphone as Megaphone,
  LuSparkles as Sparkles,
  LuWallet as Wallet,
  LuZap as Zap,
} from "react-icons/lu";
import { useContentBlock } from "@/hooks/useContentBlock";
import PageUnavailable from "@/components/public/PageUnavailable";

const DEFAULT_PERKS = [
  { icon: Link2, title: "Unique Referral Link", description: "Get a personal tracking link to share across all your channels." },
  { icon: Wallet, title: "Commission on Every Booking", description: "Earn on every booking that comes through your link. No cap." },
  { icon: BarChart3, title: "Live Analytics", description: "Real-time dashboard showing clicks, conversions, and earnings." },
  { icon: Zap, title: "Ready-made Assets", description: "Banners, copy, and social content ready for you to use instantly." },
] as const;

const DEFAULT_STATS = [
  ["No minimum", "Bookings required"],
  ["Monthly", "Payout cycle"],
  ["Fast", "Link activation"],
] as const;

const DEFAULT_IDEAL_FOR = [
  "Travel bloggers and content creators",
  "YouTube and Instagram travel accounts",
  "Travel-focused newsletters and email lists",
  "Comparison websites and travel guides",
  "Podcasters covering travel and lifestyle",
] as const;

const DEFAULT_HERO = {
  is_active: true,
  heading: "Promote great travel. Earn while you do.",
  subtitle: "Share Tourvaa tours with your audience - on your blog, social media, or email list - and earn commission on every booking that comes through your unique link.",
  primary_cta_text: "Become an Affiliate",
};

const DEFAULT_CTA = {
  heading: "Ready to start earning?",
  subtitle: "Registration takes a few minutes. Get your referral link as soon as your account is approved.",
  cta_text: "Become an Affiliate",
};

const PERK_ICONS = DEFAULT_PERKS.map((p) => p.icon);

type StatItem = { title?: string; detail?: string };
type StatsBlock = { items?: StatItem[] };
type PerkItem = { title?: string; description?: string };
type PerksBlock = { heading?: string; items?: PerkItem[] };
type IdealForBlock = { heading?: string; items?: string[] };

export default function AffiliatePortalContent() {
  const hero = useContentBlock("affiliate_portal_hero", DEFAULT_HERO);
  const statsBlock = useContentBlock<StatsBlock>("affiliate_portal_stats", {});
  const perksBlock = useContentBlock<PerksBlock>("affiliate_portal_perks", {});
  const idealForBlock = useContentBlock<IdealForBlock>("affiliate_portal_ideal_for", {});
  const cta = useContentBlock("affiliate_portal_cta", DEFAULT_CTA);

  if (hero.is_active === false) {
    return <PageUnavailable />;
  }

  const stats = statsBlock.items?.length
    ? statsBlock.items.map((it) => [it.title || "", it.detail || ""] as const)
    : DEFAULT_STATS;
  const perks = perksBlock.items?.length
    ? perksBlock.items.map((it, i) => ({ icon: PERK_ICONS[i % PERK_ICONS.length], title: it.title || "", description: it.description || "" }))
    : DEFAULT_PERKS;
  const idealFor = idealForBlock.items?.length ? idealForBlock.items : DEFAULT_IDEAL_FOR;

  return (
    <main className="overflow-hidden bg-white text-slate-900">
      <section id="overview" className="relative isolate overflow-hidden bg-[#24143b] text-white">
        <div className="pointer-events-none absolute -right-16 -top-24 h-96 w-96 rounded-full bg-purple-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-fuchsia-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 pb-28 pt-20 sm:px-8 sm:pb-32 sm:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur">
            <Megaphone size={14} /> Tourvaa Affiliate Programme
          </span>
          <h1 className="mt-7 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
            {hero.heading || DEFAULT_HERO.heading}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
            {hero.subtitle || DEFAULT_HERO.subtitle}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/affiliate-portal/login?tab=register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-purple-800 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
              {hero.primary_cta_text || DEFAULT_HERO.primary_cta_text} <ArrowRight size={16} />
            </Link>
            <Link href="/affiliate-portal/login" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20">
              Affiliate Login
            </Link>
          </div>
        </div>
      </section>

      {/* Cross-portal banner */}
      <div className="bg-purple-900/10 border-b border-purple-100 py-3 px-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-600 font-medium">
            Are you a tour operator or travel agency?
          </span>
          <div className="flex items-center gap-4 font-bold">
            <Link href="/supplier-portal" className="text-emerald-700 hover:underline">
              Supplier Portal &rarr;
            </Link>
            <Link href="/agent-portal" className="text-indigo-700 hover:underline">
              Agent Portal &rarr;
            </Link>
          </div>
        </div>
      </div>

      <section className="relative z-10 mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <div className="grid overflow-hidden rounded-2xl border border-purple-100 bg-purple-50/50 sm:grid-cols-3">
          {stats.map(([title, detail], index) => (
            <div key={index} className={`px-7 py-6 text-left ${index ? "border-t border-purple-100 sm:border-l sm:border-t-0" : ""}`}>
              <p className="text-lg font-black text-slate-950">{title}</p>
              <p className="mt-1 text-xs font-semibold text-purple-700">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[.16em] text-purple-700">Why join</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{perksBlock.heading || "Why join as an affiliate?"}</h2>
        </div>
        <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {perks.map(({ icon: Icon, title, description }, index) => (
            <div key={index} className="group border-t border-purple-100 py-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-700"><Icon size={20} /></span>
              <h3 className="mt-4 text-lg font-bold text-slate-950">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-purple-50/50 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[.16em] text-purple-700">Ideal for</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{idealForBlock.heading || "Built for creators and publishers"}</h2>
          </div>
          <div className="mt-10 rounded-2xl border border-purple-100 bg-white p-7 sm:p-10">
            <ul className="space-y-4">
              {idealFor.map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-50"><span className="h-2 w-2 rounded-full bg-purple-500" /></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl overflow-hidden px-4 py-20 text-center sm:px-6">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-200/60 blur-3xl" />
        <div className="relative rounded-2xl border border-purple-100 bg-purple-50 px-6 py-14 sm:py-16">
          <Sparkles className="mx-auto mb-4 text-purple-600" size={24} />
          <h2 className="text-3xl font-black tracking-tight text-slate-950">{cta.heading || DEFAULT_CTA.heading}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            {cta.subtitle || DEFAULT_CTA.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/affiliate-portal/login?tab=register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:-translate-y-0.5 hover:bg-purple-800 hover:shadow-xl">
              {cta.cta_text || DEFAULT_CTA.cta_text} <ArrowRight size={16} />
            </Link>
            <Link href="/affiliate-portal/login" className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-white px-6 py-3.5 text-sm font-bold text-purple-700 transition hover:bg-purple-50">
              Already an affiliate? Sign in
            </Link>
          </div>
          <p className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500">
            {["No listing fees", "Human onboarding support", "Secure partner payouts"].map((item) => (
              <span key={item} className="flex items-center gap-2"><CheckCircle2 size={15} className="text-purple-600" />{item}</span>
            ))}
          </p>
        </div>
      </section>
    </main>
  );
}
