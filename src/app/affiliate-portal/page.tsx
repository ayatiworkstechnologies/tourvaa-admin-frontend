import Link from "next/link";
import type { Metadata } from "next";
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
import { metadataFor } from "@/lib/seo/pageMetadata";

export const metadata: Metadata = metadataFor("/affiliate-portal");

const PERKS = [
  { icon: Link2, title: "Unique Referral Link", description: "Get a personal tracking link to share across all your channels." },
  { icon: Wallet, title: "Commission on Every Booking", description: "Earn on every booking that comes through your link. No cap." },
  { icon: BarChart3, title: "Live Analytics", description: "Real-time dashboard showing clicks, conversions, and earnings." },
  { icon: Zap, title: "Ready-made Assets", description: "Banners, copy, and social content ready for you to use instantly." },
] as const;

const STATS = [
  ["No minimum", "Bookings required"],
  ["Monthly", "Payout cycle"],
  ["Fast", "Link activation"],
] as const;

const IDEAL_FOR = [
  "Travel bloggers and content creators",
  "YouTube and Instagram travel accounts",
  "Travel-focused newsletters and email lists",
  "Comparison websites and travel guides",
  "Podcasters covering travel and lifestyle",
] as const;

export default function AffiliatePortalLandingPage() {
  return (
    <main className="overflow-hidden bg-white text-slate-900">
      <section className="relative isolate overflow-hidden bg-purple-950 text-white">
        <div className="pointer-events-none absolute -right-16 -top-24 h-96 w-96 rounded-full bg-purple-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-fuchsia-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur">
            <Megaphone size={14} /> Tourvaa Affiliate Programme
          </span>
          <h1 className="mt-7 max-w-2xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            Promote great travel. <span className="text-purple-300">Earn while you do.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
            Share Tourvaa tours with your audience - on your blog, social media, or email list - and earn commission on every booking that comes through your unique link.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/affiliate-portal/login?tab=register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-purple-800 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
              Become an Affiliate <ArrowRight size={16} />
            </Link>
            <Link href="/affiliate-portal/login" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20">
              Affiliate Login
            </Link>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-10 max-w-6xl px-4 sm:px-6">
        <div className="grid overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-[0_25px_70px_-35px_rgba(88,28,135,.35)] sm:grid-cols-3">
          {STATS.map(([title, detail], index) => (
            <div key={title} className={`p-6 text-center ${index ? "border-t border-purple-100 sm:border-l sm:border-t-0" : ""}`}>
              <p className="text-lg font-black text-slate-950">{title}</p>
              <p className="mt-1 text-xs font-semibold text-purple-700">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-black uppercase tracking-[.16em] text-purple-700">Why join</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Why join as an affiliate?</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PERKS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="group rounded-3xl border border-slate-100 bg-slate-50/60 p-7 transition hover:border-purple-200 hover:bg-white hover:shadow-[0_24px_55px_-30px_rgba(88,28,135,.4)]">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-700"><Icon size={20} /></span>
              <h3 className="mt-4 text-sm font-black text-slate-950">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-purple-50/50 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[.16em] text-purple-700">Ideal for</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Built for creators and publishers</h2>
          </div>
          <div className="mt-10 rounded-3xl border border-purple-100 bg-white p-7 shadow-[0_10px_30px_-25px_rgba(88,28,135,.5)]">
            <ul className="space-y-4">
              {IDEAL_FOR.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-600">
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
        <div className="relative rounded-[2rem] border border-purple-100 bg-white/80 px-6 py-14 shadow-[0_30px_80px_-50px_rgba(88,28,135,.5)] backdrop-blur-sm">
          <Sparkles className="mx-auto mb-4 text-purple-600" size={24} />
          <h2 className="text-3xl font-black tracking-tight text-slate-950">Ready to start earning?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            Registration takes a few minutes. Get your referral link as soon as your account is approved.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/affiliate-portal/login?tab=register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:-translate-y-0.5 hover:bg-purple-800 hover:shadow-xl">
              Become an Affiliate <ArrowRight size={16} />
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
