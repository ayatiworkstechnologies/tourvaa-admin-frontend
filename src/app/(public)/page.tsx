"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { LuArrowRight as ArrowRight, LuBriefcase as Briefcase, LuCircleCheckBig as CheckCircle2, LuClock as Clock, LuGlobe as Globe, LuLink2 as Link2, LuMapPin as MapPin, LuPlane as Plane, LuQuote as Quote, LuShield as Shield, LuSparkles as Sparkles, LuStar as Star, LuUsers as Users, LuWarehouse as Warehouse, LuZap as Zap } from "react-icons/lu";
import FeaturedTours from "@/components/public/FeaturedTours";
import HeroFilterBar from "@/components/public/HeroFilterBar";

// scroll-reveal hook
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

// reusable reveal wrapper
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal-block ${DELAY_CLS[delay] ?? ""} ${className}`}>
      {children}
    </div>
  );
}

// data
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
    lineCls: "bg-sky-500", textCls: "text-sky-600", dotCls: "bg-sky-100", checkClr: "#0EA5E9",
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

// page
export default function Home() {
  return (
    <main className="overflow-x-hidden bg-white text-zinc-950">

      {/* hero */}
      <section className="relative z-10 flex min-h-svh items-center justify-center">
        {/* BG image — overflow-hidden scoped here only, so it doesn't clip the
            filter bar's popovers/Search button which intentionally extend
            past this section's content edge. The section itself gets z-10 so
            that overflow stacks above the next sibling section instead of
            being painted behind it. */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 animate-hero-img">
            <img
              src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2400&q=90"
              alt="Scenic landscape"
              className="h-full w-full object-cover scale-105"
            />
          </div>
          <div className="absolute inset-0 bg-zinc-950/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto w-full max-w-5xl px-6 py-32 text-center md:px-12">
          <div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white backdrop-blur-xl shadow-lg">
            <Sparkles size={12} className="text-sky-400" />
            Premium travel experiences
          </div>

          <h1 className="hero-headline font-heading mx-auto font-black leading-[0.95] tracking-tighter text-white drop-shadow-2xl">
            <span className="block animate-fade-up delay-100">Discover your</span>
            <span className="block animate-fade-up delay-200 bg-gradient-to-r from-sky-400 to-orange-300 bg-clip-text text-transparent">next adventure.</span>
          </h1>

          <p className="animate-fade-up delay-300 mx-auto mt-8 max-w-xl text-base leading-relaxed text-zinc-300 md:text-lg">
            Curated journeys across India and the Middle East, planned with precision and elevated for the modern traveler.
          </p>

          <div className="flex justify-center">
            <HeroFilterBar />
          </div>

          {/* Hero stats */}
          <div className="animate-fade-up delay-600 mt-16 flex flex-wrap justify-center gap-8 sm:gap-16">
            {stats.slice(0, 4).map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-black text-white">{s.value}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="animate-fade-in anim-forwards delay-900 absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0">
          <div className="h-12 w-[2px] overflow-hidden bg-white/10 rounded-full">
            <div className="h-1/2 w-full animate-[scrollLine_2s_ease-in-out_infinite] bg-sky-400 rounded-full" />
          </div>
        </div>
      </section>

      {/* marquee stats */}
      <div className="overflow-hidden border-y border-slate-100 bg-slate-50 py-4">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...stats, ...stats].map((s, i) => (
            <span key={i} className="inline-flex items-center gap-3 px-10 text-sm font-bold text-zinc-950">
              <span className="text-sky-500">{s.value}</span>
              <span className="text-slate-400">{s.label}</span>
              <span className="text-slate-200">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* destinations */}
      <section className="bg-zinc-950 py-24 text-white">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <Reveal className="mb-12">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-px w-8 bg-sky-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400">Destinations</span>
                </div>
                <h2 className="font-heading text-4xl font-black tracking-tight sm:text-5xl">
                  Where do you<br />
                  <span className="text-zinc-600">want to go?</span>
                </h2>
              </div>
              <Link href="/tours" className="group inline-flex items-center gap-2 text-sm font-bold text-zinc-400 transition-all hover:text-sky-400 hover:gap-3">
                All destinations <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {destinations.map((d, i) => (
              <Reveal key={d.name} delay={i * 70}>
                <Link href="/tours" className="group relative block overflow-hidden rounded-2xl ring-1 ring-white/10 transition-all hover:ring-sky-500/50 hover:shadow-[0_0_30px_rgba(14,165,233,0.2)]">
                  <div className="aspect-[3/4] w-full bg-zinc-900">
                    <img src={d.img} alt={d.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-5 w-full">
                    <p className="text-lg font-black text-white leading-tight">{d.name}</p>
                    <p className="mt-1 text-[11px] font-bold text-sky-300 uppercase tracking-wider">{d.tours}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* featured tours */}
      <section className="bg-zinc-50 py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <Reveal className="mb-14">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-px w-8 bg-sky-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500">Featured</span>
                </div>
                <h2 className="font-heading text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
                  Popular<br />
                  <span className="bg-gradient-to-r from-sky-500 to-orange-500 bg-clip-text text-transparent">tours</span>
                </h2>
              </div>
              <Link href="/tours" className="group inline-flex items-center gap-2 text-sm font-bold text-zinc-500 transition-all hover:text-sky-600 hover:gap-3">
                View all tours <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
          <FeaturedTours />
        </div>
      </section>

      {/* how it works */}
      <section className="bg-zinc-950 py-28 text-white">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <Reveal className="mb-16">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-8 bg-sky-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400">How it works</span>
            </div>
            <h2 className="font-heading text-4xl font-black tracking-tight sm:text-5xl">
              Three steps.<br />
              <span className="text-white/20">That&apos;s it.</span>
            </h2>
          </Reveal>

          <div className="grid gap-px bg-white/5 md:grid-cols-3 rounded-3xl overflow-hidden ring-1 ring-white/10">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <Reveal key={step.n} delay={i * 120} className="bg-zinc-950">
                  <div className="group relative overflow-hidden p-10 transition-all duration-500 hover:bg-white/[0.02] md:p-12 h-full">
                    <span className="pointer-events-none absolute -right-4 -top-4 text-[9rem] font-black leading-none text-white/5 select-none transition-all duration-500 group-hover:text-white/10">
                      {step.n}
                    </span>
                    <div className="relative">
                      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20 transition-transform group-hover:scale-110">
                        <Icon size={24} />
                      </div>
                      <h3 className="font-heading text-2xl font-black text-white">{step.title}</h3>
                      <p className="mt-4 text-sm leading-relaxed text-zinc-400">{step.desc}</p>
                      <div className="mt-10 h-1 w-0 bg-gradient-to-r from-sky-500 to-orange-400 transition-all duration-500 group-hover:w-16 rounded-full" />
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* testimonials */}
      <section className="bg-zinc-50 py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <Reveal className="mb-14 text-center">
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-sky-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500">Testimonials</span>
              <div className="h-px w-8 bg-sky-500" />
            </div>
            <h2 className="font-heading text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
              Loved by travellers
            </h2>
          </Reveal>

          <div className="relative mt-12">
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-8 pb-8 no-scrollbar">
              {testimonials.map((t, i) => (
                <div key={t.name} className="snap-center shrink-0 w-[85vw] sm:w-[420px]">
                  <Reveal delay={i * 100}>
                    <div className="group relative flex h-full min-h-[260px] flex-col rounded-3xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)]">
                      <Quote size={32} className="mb-6 text-sky-100 transition-colors group-hover:text-sky-200" />
                      <p className="flex-1 text-base leading-relaxed text-zinc-600">&ldquo;{t.text}&rdquo;</p>
                      <div className="mt-8 flex items-center gap-4 border-t border-zinc-100 pt-6">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-orange-500 text-sm font-black text-white shadow-md">
                          {t.avatar}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-zinc-950">{t.name}</p>
                          <p className="text-xs text-zinc-400">{t.role}</p>
                        </div>
                        <div className="ml-auto flex gap-1">
                          {Array.from({ length: t.rating }).map((_, j) => (
                            <Star key={j} size={14} className="fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </Reveal>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* trust strip */}
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

      {/* partner cards */}
      <section className="bg-white py-28">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <Reveal className="mb-16 text-center">
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-sky-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500">Partners</span>
              <div className="h-px w-8 bg-sky-500" />
            </div>
            <h2 className="font-heading text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">Grow with us</h2>
            <p className="mx-auto mt-5 max-w-lg text-base text-zinc-500 leading-relaxed">
              Join as a supplier, agent, or affiliate. Each workspace is custom-built with the tools you need to succeed.
            </p>
          </Reveal>

          <div className="grid gap-8 md:grid-cols-3">
            {partners.map((p, i) => {
              const Icon = p.icon;
              return (
                <Reveal key={p.title} delay={i * 100}>
                  <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)]">
                    <div className={`absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100 ${p.lineCls}`} />
                    <span className={`mb-6 inline-block self-start rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${p.tagCls}`}>
                      {p.tag}
                    </span>
                    <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 ${p.iconCls}`}>
                      <Icon size={24} />
                    </div>
                    <h3 className="font-heading text-2xl font-black text-zinc-950">{p.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-500">{p.desc}</p>
                    <ul className="mt-8 flex-1 space-y-3">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-center gap-3 text-sm font-medium text-zinc-600">
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${p.dotCls}`}>
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5L4 7L8 3" stroke={p.checkClr} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href={p.href} className={`mt-10 inline-flex items-center gap-2 text-sm font-black transition-all duration-300 group-hover:gap-4 ${p.textCls}`}>
                      Get started <ArrowRight size={16} />
                    </Link>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* cta */}
      <section className="cta-gradient relative overflow-hidden py-32 text-white">
        <div className="cta-dot-grid pointer-events-none absolute inset-0 opacity-[0.06]" />
        <div className="pointer-events-none absolute -top-20 right-1/4 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-1/4 h-56 w-56 rounded-full bg-sky-200/20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 text-center md:px-12">
          <Reveal>
            <Plane size={32} className="mx-auto mb-6 animate-bounce text-white/75" />
            <h2 className="font-heading text-5xl font-black leading-tight tracking-tighter sm:text-6xl lg:text-7xl">
              Your next journey<br />
              <span className="text-sky-200">starts here.</span>
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
