"use client";

import Link from "next/link";
import { useState } from "react";
import { LuArrowRight as ArrowRight, LuChartColumn as BarChart3, LuCircleCheckBig as CheckCircle2, LuLink2 as Link2, LuMegaphone as Megaphone, LuWallet as Wallet, LuZap as Zap } from "react-icons/lu";

const perks = [
  { icon: Link2, title: "Unique Referral Link", desc: "Get a personal tracking link to share across all your channels." },
  { icon: Wallet, title: "5% Commission", desc: "Earn on every booking that comes through your link. No cap." },
  { icon: BarChart3, title: "Live Analytics", desc: "Real-time dashboard showing clicks, conversions, and earnings." },
  { icon: Zap, title: "Ready-made Assets", desc: "Banners, copy, and social content ready for you to use instantly." },
];

const stats = [
  { value: "5%", label: "Commission Rate" },
  { value: "0", label: "Minimum Bookings" },
  { value: "Monthly", label: "Payout Cycle" },
  { value: "1-day", label: "Link Activation" },
];

const idealFor = [
  "Travel bloggers and content creators",
  "YouTube and Instagram travel accounts",
  "Travel-focused newsletters and email lists",
  "Comparison websites and travel guides",
  "Podcasters covering travel and lifestyle",
];

const INPUT = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-zinc-950 outline-none transition-all focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100";
const LABEL = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400";

export default function JoinAffiliatePage() {
  const [form, setForm] = useState({ name: "", email: "", website: "", audience: "" });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const subject = `Affiliate application - ${form.name.trim()}`;
    const body = [
      `Name: ${form.name.trim()}`,
      `Email: ${form.email.trim()}`,
      `Website / social profile: ${form.website.trim() || "Not provided"}`,
      "",
      "Audience:",
      form.audience.trim(),
    ].join("\n");
    window.location.href = `mailto:hello@tourvaa.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
    setSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-[#F5F8FC] pb-24">

      {/* hero */}
      <section className="relative overflow-hidden bg-[#0A0F1E] py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.14),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-5 md:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-bold text-violet-400">
            <Megaphone size={13} /> Affiliate Programme
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight tracking-tight text-white md:text-5xl">
            Promote great travel.<br />
            <span className="text-violet-400">Earn while you do.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/55">
            Share Tourvaa tours with your audience — on your blog, social media, or email list — and earn 5% commission on every booking that comes through your unique link.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#apply" className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-violet-400">
              Apply Now <ArrowRight size={14} />
            </a>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-white/65 transition-all hover:border-white/25 hover:text-white">
              Already an affiliate? Login
            </Link>
          </div>
        </div>
      </section>

      {/* stats strip */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="grid grid-cols-2 divide-x divide-slate-100 md:grid-cols-4">
            {stats.map(({ value, label }) => (
              <div key={label} className="px-6 py-5 text-center">
                <p className="text-2xl font-black text-zinc-950">{value}</p>
                <p className="mt-0.5 text-xs text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* main content */}
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_440px]">

          {/* Left */}
          <div className="space-y-10">
            <div>
              <h2 className="text-2xl font-black text-zinc-950">Why join as an affiliate?</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {perks.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <Icon size={20} />
                    </div>
                    <p className="font-bold text-zinc-950">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-black text-zinc-950">Ideal for</h2>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <ul className="space-y-3">
                  {idealFor.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-slate-600">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-50">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 p-5">
                <p className="text-sm font-bold text-violet-800">No minimum requirement</p>
                <p className="mt-1 text-sm text-violet-700">You earn from your very first referral. There&apos;s no minimum booking threshold to unlock payouts.</p>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div id="apply" className="scroll-mt-24">
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              {sent ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50">
                    <CheckCircle2 size={34} className="text-violet-500" />
                  </div>
                  <p className="mt-4 text-xl font-black text-zinc-950">Application email prepared</p>
                  <p className="mt-2 text-sm text-slate-500">Complete and send the email in your mail application. The Tourvaa team will contact you after reviewing it.</p>
                  <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-600">
                    Back to Home
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="text-lg font-black text-zinc-950">Apply as an affiliate</h2>
                    <p className="mt-1 text-sm text-slate-400">Quick application, no commitments. Get your link within 24 hours.</p>
                  </div>
                  <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={LABEL}>Your Name</label>
                        <input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" className={INPUT} />
                      </div>
                      <div>
                        <label className={LABEL}>Email</label>
                        <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" className={INPUT} />
                      </div>
                    </div>
                    <div>
                      <label className={LABEL}>Website / Social Profile</label>
                      <input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://yourblog.com or @yourhandle" className={INPUT} />
                    </div>
                    <div>
                      <label className={LABEL}>Tell us about your audience</label>
                      <textarea required rows={4} value={form.audience} onChange={(e) => set("audience", e.target.value)} placeholder="Platform, audience size, geographic focus, travel interests…" className={`${INPUT} resize-none`} />
                    </div>
                    <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 py-3.5 text-sm font-bold text-white transition-all hover:bg-violet-600 disabled:opacity-55">
                      {submitting ? "Preparing…" : <><span>Prepare Application Email</span> <ArrowRight size={15} /></>}
                    </button>
                    <p className="text-center text-xs text-slate-400">We never share your details with third parties.</p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
