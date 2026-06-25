"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  ArrowRight, Briefcase, CheckCircle2, Clock, Globe, Link2,
  MapPin, Plane, Quote, Shield, Sparkles, Star, Users, Warehouse, Zap,
} from "lucide-react";
import FeaturedTours from "@/components/public/FeaturedTours";

/* ─── scroll-reveal hook ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("is-visible"); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

const DELAY_CLS: Record<number, string> = {
  0: "", 70: "tr-delay-70", 100: "tr-delay-100", 120: "tr-delay-120",
  140: "tr-delay-140", 200: "tr-delay-200", 210: "tr-delay-210",
  240: "tr-delay-240", 280: "tr-delay-280", 350: "tr-delay-350",
};

/* ─── reusable reveal wrapper ─── */
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal-block ${DELAY_CLS[delay] ?? ""} ${className}`}>
      {children}
    </div>
  );
}

/* ─── data ─── */
const stats = [
  { value: "50+", label: "Happy Travellers" },
  { value: "20+", label: "Curated Tours" },
  { value: "24/7", label: "Live Support" },
  { value: "4.9★", label: "Guest Rating" },
  { value: "8+", label: "Destinations" },
  { value: "98%", label: "Satisfaction" },
];

const destinations = [
  { name: "Dubai", img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=70", tours: "24 tours" },
  { name: "Goa", img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=70", tours: "18 tours" },
  { name: "Kerala", img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&q=70", tours: "31 tours" },
  { name: "Rajasthan", img: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400&q=70", tours: "22 tours" },
  { name: "Oman", img: "https://images.unsplash.com/photo-1578894382870-23f7e0ae3f56?w=400&q=70", tours: "12 tours" },
  { name: "Maldives", img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&q=70", tours: "9 tours" },
];

const steps = [
  { n: "01", icon: Globe, title: "Browse & Pick", desc: "Explore handpicked tours across India and the Gulf. Filter by destination, duration, or budget." },
  { n: "02", icon: CheckCircle2, title: "Book Securely", desc: "Reserve your spot with flexible payment options. Instant confirmation, no hidden fees." },
  { n: "03", icon: Plane, title: "Travel Freely", desc: "Your dedicated travel team handles every detail. Show up and experience the journey." },
];

const testimonials = [
  { name: "Priya Menon", role: "Kerala, India", rating: 5, text: "Booked a 7-day Rajasthan tour through Tourvaa. Everything was flawless — hotels, transport, guides. I didn't have to think once.", avatar: "PM" },
  { name: "Khalid Al-Rashid", role: "Dubai, UAE", rating: 5, text: "The Golden Triangle package was absolutely worth every dirham. The team was responsive and the itinerary was perfectly paced.", avatar: "KA" },
  { name: "Anjali Sharma", role: "Bengaluru, India", rating: 5, text: "Discovered Tourvaa on Instagram. Booked a Kerala houseboat trip on a whim — it was the best holiday I've ever had.", avatar: "AS" },
];

const partners = [
  {
    icon: Warehouse, title: "Supplier", tag: "For Tour Operators",
    desc: "List your tours, manage bookings, track payments, and reach travellers across India and the Gulf.",
    features: ["Tour & calendar management", "Booking dashboard", "Payment tracking"],
    href: "/join/supplier",
    tagCls: "bg-sky-50 text-sky-600", iconCls: "bg-sky-50 text-sky-600",
    lineCls: "bg-sky-500", textCls: "text-sky-600", dotCls: "bg-sky-100", checkClr: "#0284C7",
  },
  {
    icon: Briefcase, title: "Agent", tag: "For Travel Agents",
    desc: "Sell tours to your customer base and earn commissions on every confirmed booking.",
    features: ["Customer management", "Book on behalf", "Commission reports"],
    href: "/join/agent",
    tagCls: "bg-emerald-50 text-emerald-600", iconCls: "bg-emerald-50 text-emerald-600",
    lineCls: "bg-emerald-500", textCls: "text-emerald-600", dotCls: "bg-emerald-100", checkClr: "#059669",
  },
  {
    icon: Link2, title: "Affiliate", tag: "For Creators & Bloggers",
    desc: "Promote Tourvaa and earn referral commissions through your website or social channels.",
    features: ["Unique referral link", "Earnings dashboard", "Marketing assets"],
    href: "/join/affiliate",
    tagCls: "bg-violet-50 text-violet-600", iconCls: "bg-violet-50 text-violet-600",
    lineCls: "bg-violet-500", textCls: "text-violet-600", dotCls: "bg-violet-100", checkClr: "#7C3AED",
  },
];

const trust = [
  { icon: Shield, label: "Secure Payments" },
  { icon: Star,   label: "Verified Suppliers" },
  { icon: Zap,    label: "Instant Confirmation" },
  { icon: MapPin, label: "Local Expertise" },
  { icon: Clock,  label: "24/7 Support" },
];

/* ─── page ─── */
export default function Home() {
  return (
    <main className="overflow-x-hidden bg-white text-[#0A0A0A]">

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section className="relative flex min-h-[100svh] items-center overflow-hidden">

        {/* BG image */}
        <div className="absolute inset-0 animate-hero-img">
          <img
            src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2400&q=90"
            alt="Scenic landscape"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

        {/* Content */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-32 md:px-12 lg:px-20">
          <div className="max-w-3xl">

            <div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md animate-badge">
              <Sparkles size={11} className="text-sky-400" />
              Handpicked travel experiences
            </div>

            <h1 className="hero-headline font-black leading-[0.9] tracking-tighter text-white">
              <span className="block animate-fade-up delay-100">The world</span>
              <span className="block animate-fade-up delay-200 text-sky-400">is waiting</span>
              <span className="block animate-fade-up delay-300">for you.</span>
            </h1>

            <p className="animate-fade-up delay-400 mt-7 max-w-md text-base leading-relaxed text-white/65 md:text-lg">
              Curated journeys across India and the Middle East — planned with care, supported at every step.
            </p>

            <div className="animate-fade-up delay-500 mt-9 flex flex-wrap gap-3">
              <Link href="/tours" className="hero-btn-primary group inline-flex items-center gap-2.5 rounded-2xl px-7 py-3.5 text-sm font-black transition-all duration-300 hover:gap-4">
                Explore Tours <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/register" className="hero-btn-ghost inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-bold transition-all duration-300">
                Create Account
              </Link>
            </div>

            {/* Hero stats */}
            <div className="animate-fade-up delay-600 mt-14 grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
              {stats.slice(0, 4).map((s) => (
                <div key={s.label} className="border-l-2 border-white/20 pl-4">
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-white/45">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="animate-fade-in anim-forwards delay-900 absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0">
          <div className="h-10 w-px overflow-hidden bg-white/20">
            <div className="h-4 w-full animate-[scrollLine_1.6s_ease-in-out_infinite] bg-white/70" />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/35">Scroll</span>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          MARQUEE STATS
      ══════════════════════════════════════════════════════ */}
      <div className="overflow-hidden border-y border-slate-100 bg-slate-50 py-4">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...stats, ...stats].map((s, i) => (
            <span key={i} className="inline-flex items-center gap-3 px-10 text-sm font-bold text-[#0A0A0A]">
              <span className="text-sky-500">{s.value}</span>
              <span className="text-slate-400">{s.label}</span>
              <span className="text-slate-200">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          DESTINATIONS
      ══════════════════════════════════════════════════════ */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <Reveal className="mb-12">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-px w-8 bg-sky-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500">Destinations</span>
                </div>
                <h2 className="text-4xl font-black tracking-tight text-[#0A0A0A] sm:text-5xl">
                  Where do you<br />
                  <span className="text-slate-300">want to go?</span>
                </h2>
              </div>
              <Link href="/tours" className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-all hover:text-sky-500 hover:gap-3">
                All destinations <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {destinations.map((d, i) => (
              <Reveal key={d.name} delay={i * 70}>
                <Link href="/tours" className="group relative block overflow-hidden rounded-2xl">
                  <div className="aspect-[3/4] w-full">
                    <img src={d.img} alt={d.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4">
                    <p className="font-black text-white leading-tight">{d.name}</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-white/60">{d.tours}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURED TOURS
      ══════════════════════════════════════════════════════ */}
      <section className="bg-[#F8FAFC] py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <Reveal className="mb-14">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-px w-8 bg-sky-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500">Featured</span>
                </div>
                <h2 className="text-4xl font-black tracking-tight text-[#0A0A0A] sm:text-5xl">
                  Popular<br />
                  <span className="text-slate-300">tours</span>
                </h2>
              </div>
              <Link href="/tours" className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-all hover:text-sky-500 hover:gap-3">
                View all tours <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
          <FeaturedTours />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════ */}
      <section className="bg-[#0A0F1E] py-28 text-white">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <Reveal className="mb-16">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-px w-8 bg-sky-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500">How it works</span>
            </div>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
              Three steps.<br />
              <span className="text-white/20">That&apos;s it.</span>
            </h2>
          </Reveal>

          <div className="grid gap-px bg-white/5 md:grid-cols-3">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <Reveal key={step.n} delay={i * 120} className="bg-[#0A0F1E]">
                  <div className="group relative overflow-hidden p-10 transition-all duration-500 hover:bg-white/4 md:p-12">
                    <span className="pointer-events-none absolute -right-4 -top-4 text-[9rem] font-black leading-none text-white/4 select-none transition-all duration-500 group-hover:text-white/7">
                      {step.n}
                    </span>
                    <div className="relative">
                      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sky-400">
                        <Icon size={22} />
                      </div>
                      <h3 className="text-xl font-black text-white">{step.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-white/45">{step.desc}</p>
                      <div className="mt-8 h-0.5 w-0 bg-sky-500 transition-all duration-500 group-hover:w-10" />
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════ */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <Reveal className="mb-14 text-center">
            <div className="mb-3 flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-sky-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500">Testimonials</span>
              <div className="h-px w-8 bg-sky-500" />
            </div>
            <h2 className="text-4xl font-black tracking-tight text-[#0A0A0A] sm:text-5xl">
              Loved by travellers
            </h2>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 100}>
                <div className="group relative flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <Quote size={28} className="mb-4 text-sky-100 transition-colors group-hover:text-sky-200" />
                  <p className="flex-1 text-sm leading-relaxed text-slate-600">&ldquo;{t.text}&rdquo;</p>
                  <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0A0F1E] text-xs font-black text-sky-400">
                      {t.avatar}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[#0A0A0A]">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.role}</p>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} size={12} className="fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TRUST STRIP
      ══════════════════════════════════════════════════════ */}
      <div className="border-y border-slate-100 bg-slate-50 py-6">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
            {trust.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 text-sm font-semibold text-slate-500">
                <Icon size={16} className="text-sky-500" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          PARTNER CARDS
      ══════════════════════════════════════════════════════ */}
      <section className="bg-white py-28">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <Reveal className="mb-16 text-center">
            <div className="mb-3 flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-sky-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500">Partners</span>
              <div className="h-px w-8 bg-sky-500" />
            </div>
            <h2 className="text-4xl font-black tracking-tight text-[#0A0A0A] sm:text-5xl">Grow with us</h2>
            <p className="mx-auto mt-4 max-w-md text-base text-slate-500">
              Join as a supplier, agent, or affiliate — each with a workspace built for how you work.
            </p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {partners.map((p, i) => {
              const Icon = p.icon;
              return (
                <Reveal key={p.title} delay={i * 100}>
                  <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
                    <div className={`absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100 ${p.lineCls}`} />
                    <span className={`mb-5 inline-block self-start rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${p.tagCls}`}>
                      {p.tag}
                    </span>
                    <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${p.iconCls}`}>
                      <Icon size={22} />
                    </div>
                    <h3 className="text-xl font-black text-[#0A0A0A]">{p.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">{p.desc}</p>
                    <ul className="mt-6 flex-1 space-y-2.5">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-center gap-2.5 text-xs font-semibold text-slate-600">
                          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${p.dotCls}`}>
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <path d="M1.5 4.5L3.5 6.5L7 2.5" stroke={p.checkClr} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href={p.href} className={`mt-8 inline-flex items-center gap-2 text-sm font-black transition-all duration-300 group-hover:gap-3 ${p.textCls}`}>
                      Get started <ArrowRight size={14} />
                    </Link>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════════════ */}
      <section className="cta-gradient relative overflow-hidden py-32 text-white">
        <div className="cta-dot-grid pointer-events-none absolute inset-0 opacity-[0.06]" />
        <div className="pointer-events-none absolute -top-20 right-1/4 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-1/4 h-56 w-56 rounded-full bg-indigo-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 text-center md:px-12">
          <Reveal>
            <Plane size={32} className="mx-auto mb-6 animate-bounce text-white/75" />
            <h2 className="text-5xl font-black leading-tight tracking-tighter sm:text-6xl lg:text-7xl">
              Your next journey<br />
              <span className="text-yellow-300">starts here.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-white/65">
              Create a free account and start exploring curated tours across India and the Middle East.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register" className="cta-white-btn group inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-sm font-black transition-all duration-300">
                <Users size={15} />
                Create Free Account
                <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link href="/tours" className="inline-flex items-center gap-2.5 rounded-2xl border-2 border-white/30 px-8 py-4 text-sm font-bold text-white transition-all duration-300 hover:border-white/60 hover:bg-white/10">
                Browse Tours <ArrowRight size={14} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

    </main>
  );
}
