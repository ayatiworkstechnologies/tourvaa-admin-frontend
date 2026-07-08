"use client";

import Link from "next/link";
import { useState } from "react";
import axios from "axios";
import { LuArrowRight as ArrowRight, LuCircleCheckBig as CheckCircle2, LuGlobe as Globe, LuLayoutDashboard as LayoutDashboard, LuStar as Star, LuTrendingUp as TrendingUp, LuUsers as Users, LuWarehouse as Warehouse } from "react-icons/lu";
import api from "@/lib/api/client";
import PhoneInput from "@/components/ui/PhoneInput";
import LocationInput from "@/components/ui/LocationInput";
import { combinePhone, mobileHelp, normalizeEmail, passwordHelp, validateEmail, validateMobile, validatePassword } from "@/lib/utils/validators";

const perks = [
  { icon: Globe, title: "Global Reach", desc: "List your tours to thousands of travellers across India and the Middle East." },
  { icon: LayoutDashboard, title: "One Dashboard", desc: "Manage bookings, calendars, pricing, and communications in one place." },
  { icon: Users, title: "Agent Network", desc: "Get access to verified travel agents who actively resell tours." },
  { icon: TrendingUp, title: "Revenue Growth", desc: "Set flexible pricing slabs, group rates, and seasonal discounts." },
];

const steps = [
  { n: "01", title: "Submit Application", desc: "Fill in your company details and tour overview." },
  { n: "02", title: "Verification Call", desc: "Our onboarding team schedules a short call to verify your listings." },
  { n: "03", title: "Go Live", desc: "Get full dashboard access and start listing your experiences." },
];

const stats = [
  { value: "50+", label: "Monthly Travellers" },
  { value: "20+", label: "Tours Listed" },
  { value: "98%", label: "Supplier Satisfaction" },
  { value: "24h", label: "Onboarding Time" },
];

const INPUT = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-zinc-950 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-indigo-100";
const LABEL = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400";

export default function JoinSupplierPage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "", country: "", city: "", description: "", password: "", confirmPassword: "" });
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
      await api.post("/auth/register/supplier", { name: form.name, email: normalizeEmail(form.email), phone, country: form.country, city: form.city, password: form.password });
      setSent(true);
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.detail || "Supplier registration failed." : "Supplier registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F8FC] pb-24">

      {/* hero */}
      <section className="relative overflow-hidden bg-[#0A0F1E] py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.12),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-5 md:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-bold text-sky-400">
            <Warehouse size={13} /> Supplier Programme
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight tracking-tight text-white md:text-5xl">
            Reach more travellers.<br />
            <span className="text-sky-400">Manage with ease.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/55">
            Join Tourvaa as a verified tour supplier. List your experiences, manage bookings through a clean dashboard, and grow revenue through our agent and customer network.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#apply" className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-sky-400">
              Apply Now <ArrowRight size={14} />
            </a>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-white/65 transition-all hover:border-white/25 hover:text-white">
              Already a supplier? Login
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

          {/* Left: perks + steps */}
          <div className="space-y-10">
            <div>
              <h2 className="text-2xl font-black text-zinc-950">What you get as a supplier</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {perks.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Icon size={20} />
                    </div>
                    <p className="font-bold text-zinc-950">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-black text-zinc-950">How it works</h2>
              <div className="mt-5 space-y-4">
                {steps.map(({ n, title, desc }) => (
                  <div key={n} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0A0F1E] text-xs font-black text-sky-400">{n}</span>
                    <div>
                      <p className="font-bold text-zinc-950">{title}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div id="apply" className="scroll-mt-24">
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              {sent ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50">
                    <CheckCircle2 size={34} className="text-sky-500" />
                  </div>
                  <p className="mt-4 text-xl font-black text-zinc-950">Application received!</p>
                  <p className="mt-2 text-sm text-slate-500">Please verify your email, then wait for admin approval. We typically review within 1 business day.</p>
                  <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-600">
                    Back to Home
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="text-lg font-black text-zinc-950">Apply to become a supplier</h2>
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
                        <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@company.com" className={INPUT} />
                      </div>
                    </div>
                    <div>
                      <label className={LABEL}>Company / Business Name</label>
                      <input required value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Your company or trading name" className={INPUT} />
                    </div>
                    <PhoneInput countryCode={phoneCountryCode} number={form.phone} onCountryCodeChange={setPhoneCountryCode} onNumberChange={(v) => set("phone", v)} />
                    <LocationInput country={form.country} city={form.city} onCountryChange={(v) => set("country", v)} onCityChange={(v) => set("city", v)} />
                    <div>
                      <label className={LABEL}>Tell us about your tours</label>
                      <textarea required rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Types of tours, destinations, approximate booking volume…" className={`${INPUT} resize-none`} />
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
                    <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3.5 text-sm font-bold text-white transition-all hover:bg-sky-600 disabled:opacity-55">
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
