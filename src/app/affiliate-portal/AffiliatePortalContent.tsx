"use client";

import Image from "next/image";
import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuChartColumn as BarChart3,
  LuCircleCheckBig as CheckCircle2,
  LuLink2 as Link2,
  LuMegaphone as Megaphone,
  LuWallet as Wallet,
  LuZap as Zap,
} from "react-icons/lu";
import PartnerPortalFooter from "@/components/public/portal/PartnerPortalFooter";
import PageUnavailable from "@/components/public/PageUnavailable";
import { useContentBlock } from "@/hooks/useContentBlock";

const DEFAULT_PERKS = [
  { icon: Link2, title: "Your own referral link", description: "Receive a personal tracking link that works across your website, newsletters, and social channels." },
  { icon: Wallet, title: "Commission on bookings", description: "Earn commission for every eligible booking attributed to your referral link, with no listing cost." },
  { icon: BarChart3, title: "Clear performance data", description: "Track clicks, conversions, commissions, and payout progress from one affiliate workspace." },
  { icon: Zap, title: "Campaign-ready assets", description: "Use approved banners, copy, and links to share tours with your audience quickly and consistently." },
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
  heading: "Share better travel. Earn on every booking.",
  subtitle: "Introduce your audience to bookable Tourvaa experiences and earn commission through one simple, trackable partner link.",
  primary_cta_text: "Become an Affiliate",
};

const DEFAULT_CTA = {
  heading: "Ready to earn from your travel audience?",
  subtitle: "Apply in a few minutes, then create links and monitor performance from your affiliate workspace.",
  cta_text: "Become an Affiliate",
};

const PERK_ICONS = DEFAULT_PERKS.map((perk) => perk.icon);

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

  if (hero.is_active === false) return <PageUnavailable />;

  const stats = statsBlock.items?.length
    ? statsBlock.items.map((item) => [item.title || "", item.detail || ""] as const)
    : DEFAULT_STATS;
  const perks = perksBlock.items?.length
    ? perksBlock.items.map((item, index) => ({
        icon: PERK_ICONS[index % PERK_ICONS.length],
        title: item.title || "",
        description: item.description || "",
      }))
    : DEFAULT_PERKS;
  const idealFor = idealForBlock.items?.length ? idealForBlock.items : DEFAULT_IDEAL_FOR;

  return (
    <>
      <main className="overflow-x-hidden bg-white text-pub-fg">
        <section id="overview" className="mx-auto max-w-[1380px] px-4 pt-4 scroll-mt-24 sm:px-6 sm:pt-6">
          <div className="relative min-h-[470px] overflow-hidden rounded-[24px] bg-pub-primary px-6 py-10 sm:min-h-[520px] sm:rounded-[32px] sm:px-12 sm:py-12">
            <Image src="/images/hero-2.jpg" alt="Coastal travel destination" fill priority sizes="(max-width: 768px) 100vw, 1380px" className="object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/68 to-slate-950/30" />
            <div className="relative z-10 flex min-h-[390px] max-w-2xl flex-col justify-center text-white sm:min-h-[424px]">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm"><Megaphone size={14} /> Tourvaa Affiliate Programme</div>
              <h1 className="mt-6 max-w-xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">{hero.heading || DEFAULT_HERO.heading}</h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/85 sm:text-base sm:leading-7">{hero.subtitle || DEFAULT_HERO.subtitle}</p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href="/affiliate-portal/login?tab=register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-pub-accent px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-pub-accent/90 active:scale-[0.98]">{hero.primary_cta_text || DEFAULT_HERO.primary_cta_text} <ArrowRight size={16} /></Link>
                <Link href="/affiliate-portal/login" className="inline-flex items-center justify-center rounded-xl border border-white/35 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-[0.98]">Affiliate sign in</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-6 max-w-[1380px] px-4 sm:mt-8 sm:px-6">
          <div className="rounded-2xl bg-pub-primary p-6 text-white shadow-md sm:p-8">
            <div className="grid grid-cols-1 divide-y divide-white/15 text-center sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {stats.map(([title, detail], index) => <div key={`${title}-${index}`} className="px-4 py-3 sm:py-0"><p className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</p><p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-pub-accent">{detail}</p></div>)}
            </div>
          </div>
          <div className="mt-3 flex flex-col items-center justify-between gap-2 px-2 text-xs sm:flex-row"><p className="font-medium text-pub-muted">For travel creators, publishers, and audience-led communities.</p><div className="flex items-center gap-4 font-semibold"><Link href="/supplier-portal" className="text-pub-secondary transition hover:underline">List tours</Link><Link href="/agent-portal" className="text-pub-secondary transition hover:underline">Book for clients</Link></div></div>
        </section>

        <section id="benefits" className="mx-auto mt-16 max-w-[1180px] px-4 scroll-mt-28 sm:mt-20 sm:px-6">
          <div className="max-w-2xl"><h2 className="text-2xl font-semibold tracking-tight text-pub-fg sm:text-3xl">{perksBlock.heading || "A partner programme built for sharing"}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-pub-muted">Everything you need to share relevant travel experiences and understand the results of your referrals.</p></div>
          <div className="mt-9 grid gap-x-12 gap-y-2 sm:grid-cols-2">
            {perks.map(({ icon: Icon, title, description }) => <article key={title} className="border-t border-pub-border py-6"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pub-secondary/10 text-pub-secondary"><Icon size={20} /></span><h3 className="mt-4 text-base font-bold tracking-tight text-pub-fg">{title}</h3><p className="mt-2 text-sm leading-6 text-pub-muted">{description}</p></article>)}
          </div>
        </section>

        <section className="mt-16 bg-pub-bg py-16 sm:mt-20 sm:py-20">
          <div className="mx-auto grid max-w-[1180px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="relative min-h-[300px] overflow-hidden rounded-2xl sm:min-h-[360px]"><Image src="/images/hero-3.jpg" alt="Travel destination surrounded by turquoise water" fill sizes="(max-width: 1024px) 100vw, 520px" className="object-cover" /></div>
            <div><h2 className="text-2xl font-semibold tracking-tight text-pub-fg sm:text-3xl">{idealForBlock.heading || "Designed for travel storytellers"}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-pub-muted">Build referral content around the channels and communities you already manage.</p><ul className="mt-7 grid gap-3 sm:grid-cols-2">{idealFor.map((item) => <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-pub-fg"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-pub-secondary" aria-hidden="true" /><span>{item}</span></li>)}</ul></div>
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-[1180px] px-4 sm:mt-20 sm:px-6">
          <div className="rounded-2xl bg-pub-primary px-6 py-12 text-center text-white sm:px-12 sm:py-16">
            <Megaphone className="mx-auto text-pub-accent" size={26} aria-hidden="true" />
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">{cta.heading || DEFAULT_CTA.heading}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/80">{cta.subtitle || DEFAULT_CTA.subtitle}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3"><Link href="/affiliate-portal/login?tab=register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-pub-accent px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-pub-accent/90 active:scale-[0.98]">{cta.cta_text || DEFAULT_CTA.cta_text} <ArrowRight size={16} /></Link><Link href="/affiliate-portal/login" className="inline-flex items-center justify-center rounded-xl border border-white/35 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10 active:scale-[0.98]">Affiliate sign in</Link></div>
            <p className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-white/75"><span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-pub-accent" />No listing fees</span><span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-pub-accent" />Support when you need it</span><span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-pub-accent" />Secure partner payouts</span></p>
          </div>
        </section>
      </main>
      <PartnerPortalFooter portal="affiliate" />
    </>
  );
}
