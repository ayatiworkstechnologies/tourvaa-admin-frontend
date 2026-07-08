"use client";

import Link from "next/link";
import { useState } from "react";
import axios from "axios";
import { LuArrowRight as ArrowRight, LuBanknote as Banknote, LuBriefcase as Briefcase, LuCircleCheckBig as CheckCircle2, LuLayoutDashboard as LayoutDashboard, LuStar as Star, LuUsers as Users } from "react-icons/lu";
import PhoneInput from "@/components/ui/PhoneInput";
import api from "@/lib/api/client";
import { combinePhone, mobileHelp, normalizeEmail, passwordHelp, validateEmail, validateMobile, validatePassword } from "@/lib/utils/validators";

const perks = [
  { icon: Briefcase, title: "Full Catalogue Access", desc: "Book any tour on behalf of your customers at wholesale pricing." },
  { icon: Banknote, title: "8–15% Commission", desc: "Earn on every confirmed booking. Tiers upgrade as volume grows." },
  { icon: LayoutDashboard, title: "Agent Dashboard", desc: "Track all bookings, commissions, and client communications." },
  { icon: Users, title: "Co-branded Tools", desc: "Unique booking links and ready-made marketing materials." },
];

const stats = [
  { value: "15%", label: "Max Commission" },
  { value: "20+", label: "Tours to Resell" },
  { value: "Monthly", label: "Payout Cycle" },
  { value: "1-day", label: "Approval Time" },
];

const tiers = [
  { range: "1–10 bookings/mo", rate: "8%", color: "bg-slate-100 text-slate-600" },
  { range: "11–30 bookings/mo", rate: "11%", color: "bg-emerald-50 text-emerald-700" },
  { range: "31+ bookings/mo", rate: "15%", color: "bg-emerald-100 text-emerald-800" },
];

const INPUT = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-zinc-950 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100";
const LABEL = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400";

export default function JoinAgentPage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "", experience: "", password: "", confirmPassword: "" });
  const [phoneCountryCode, setPhoneCountryCode] = useState("+91");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateEmail(form.email)) { setError("Enter a valid email address."); return; }
    if (!validatePassword(form.password)) { setError(passwordHelp); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    const phone = form.phone ? combinePhone(phoneCountryCode, form.phone) : "";
    if (phone && !validateMobile(phone)) { setError(mobileHelp); return; }
    setSubmitting(true);
    try {
      await api.post("/auth/register/agent", { name: form.name, email: normalizeEmail(form.email), phone, password: form.password });
      setSent(true);
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.detail || "Agent registration failed." : "Agent registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F8FC] pb-24">

      {/* hero */}
      <section className="relative overflow-hidden bg-[#0A0F1E] py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.12),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-5 md:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-400">
            <Briefcase size={13} /> Agent / Reseller Programme
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight tracking-tight text-white md:text-5xl">
            Sell tours. Earn on<br />
            <span className="text-emerald-400">every booking.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/55">
            Join Tourvaa as a verified travel agent or reseller. Access our full catalogue of curated tours, book for your customers, and earn commissions through one clean dashboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#apply" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-400">
              Apply Now <ArrowRight size={14} />
            </a>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-white/65 transition-all hover:border-white/25 hover:text-white">
              Already an agent? Login
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
              <h2 className="text-2xl font-black text-zinc-950">Agent benefits</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {perks.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Icon size={20} />
                    </div>
                    <p className="font-bold text-zinc-950">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-black text-zinc-950">Commission tiers</h2>
              <p className="mt-2 text-sm text-slate-500">Tiers are reviewed quarterly and upgraded automatically as you grow.</p>
              <div className="mt-4 space-y-2.5">
                {tiers.map(({ range, rate, color }) => (
                  <div key={range} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Star size={14} className="text-emerald-500" />
                      <span className="text-sm font-semibold text-zinc-950">{range}</span>
                    </div>
                    <span className={`rounded-lg px-3 py-1 text-sm font-black ${color}`}>{rate}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400">Payouts processed monthly to your registered bank or payment method.</p>
            </div>
          </div>

          {/* Right: form */}
          <div id="apply" className="scroll-mt-24">
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              {sent ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                    <CheckCircle2 size={34} className="text-emerald-500" />
                  </div>
                  <p className="mt-4 text-xl font-black text-zinc-950">Application received!</p>
                  <p className="mt-2 text-sm text-slate-500">Please verify your email, then wait for admin approval. We typically review within 1 business day.</p>
                  <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-600">
                    Back to Home
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="text-lg font-black text-zinc-950">Apply as an agent</h2>
                    <p className="mt-1 text-sm text-slate-400">Takes less than 3 minutes. We'll be in touch within 24 hours.</p>
                  </div>
                  <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={LABEL}>Full Name</label>
                        <input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" className={INPUT} />
                      </div>
                      <div>
                        <label className={LABEL}>Email</label>
                        <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@agency.com" className={INPUT} />
                      </div>
                    </div>
                    <div>
                      <label className={LABEL}>Agency / Company Name</label>
                      <input required value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Your agency name" className={INPUT} />
                    </div>
                    <PhoneInput countryCode={phoneCountryCode} number={form.phone} onCountryCodeChange={setPhoneCountryCode} onNumberChange={(v) => set("phone", v)} />
                    <div>
                      <label className={LABEL}>Your experience</label>
                      <textarea required rows={3} value={form.experience} onChange={(e) => set("experience", e.target.value)} placeholder="How long in travel? What markets? Monthly booking volume?" className={`${INPUT} resize-none`} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={LABEL}>Password</label>
                        <input required type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Min 8 characters" className={INPUT} />
                      </div>
                      <div>
                        <label className={LABEL}>Confirm Password</label>
                        <input required type="password" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} placeholder="Re-enter password" className={INPUT} />
                      </div>
                    </div>
                    {error && (
                      <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
                    )}
                    <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-white transition-all hover:bg-emerald-600 disabled:opacity-55">
                      {submitting ? "Submitting…" : <><span>Submit Application</span> <ArrowRight size={15} /></>}
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
