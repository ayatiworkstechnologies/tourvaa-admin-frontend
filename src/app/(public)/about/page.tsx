"use client";

/* eslint-disable @next/next/no-img-element */

import type { CSSProperties } from "react";
import Link from "next/link";
import {
  LuAward as Award,
  LuBadgeCheck as BadgeCheck,
  LuCalendarDays as CalendarDays,
  LuCompass as Compass,
  LuGlobe as Globe,
  LuHeadphones as Headphones,
  LuHeartHandshake as HeartHandshake,
  LuLeaf as Leaf,
  LuMapPin as MapPin,
  LuQuote as Quote,
  LuShieldCheck as ShieldCheck,
  LuSparkles as Sparkles,
  LuStar as Star,
  LuTrophy as Trophy,
  LuUsers as Users,
  LuArrowRight as ArrowRight,
} from "react-icons/lu";

import AboutReveal from "@/components/public/AboutReveal";

const metrics = [
  {
    value: "10+",
    label: "Years of Excellence",
    sub: "Founded in 2015 with passion",
    icon: Compass,
    color: "from-blue-500/10 to-sky-500/10 text-sky-600",
  },
  {
    value: "500+",
    label: "Curated Expeditions",
    sub: "Across 80+ countries worldwide",
    icon: Globe,
    color: "from-amber-500/10 to-orange-500/10 text-amber-600",
  },
  {
    value: "50,000+",
    label: "Delighted Travelers",
    sub: "99.2% positive journey rating",
    icon: HeartHandshake,
    color: "from-emerald-500/10 to-teal-500/10 text-emerald-600",
  },
  {
    value: "4.9★",
    label: "Top-Rated Operator",
    sub: "Over 3,200+ verified reviews",
    icon: Star,
    color: "from-violet-500/10 to-purple-500/10 text-violet-600",
  },
];

const team = [
  {
    name: "Arjun Mehta",
    role: "Founder & CEO",
    specialty: "60+ Countries Explored",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    bio: "A lifelong explorer who has summited Alpine peaks and trekked Patagonian glaciers. Arjun founded Tourvaa to make transformative, ethical travel seamless for everyone.",
  },
  {
    name: "Priya Sharma",
    role: "Head of Global Operations",
    specialty: "12+ Years Logistics Master",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
    bio: "With over a decade leading international travel logistics across Asia and Europe, Priya ensures every hotel, private transfer, and permit runs like clockwork.",
  },
  {
    name: "James Walker",
    role: "Lead Tour Producer",
    specialty: "Cultural Heritage Curator",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    bio: "James crafts our signature itineraries, partnering exclusively with certified indigenous storytellers, historians, and local chefs for authentic immersion.",
  },
  {
    name: "Sophia Chen",
    role: "Customer Experience Director",
    specialty: "24/7 Guest Care Lead",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80",
    bio: "Sophia manages our global concierge response desk, making sure every guest feels supported, safe, and valued from pre-booking advice to the flight back home.",
  },
];

const values = [
  {
    number: "01",
    title: "Best Price Guarantee",
    desc: "Direct operator partnerships guarantee authentic local pricing with zero hidden platform markups or surprise fees at checkout.",
    icon: ShieldCheck,
    badge: "Direct Pricing",
  },
  {
    number: "02",
    title: "Vetted Local Guides",
    desc: "Every expedition is led by certified, bilingual local insiders who bring their home heritage, hidden eateries, and legends to life.",
    icon: Users,
    badge: "Certified Insiders",
    featured: true,
  },
  {
    number: "03",
    title: "Handcrafted Itineraries",
    desc: "Expertly balanced pacing combining iconic bucket-list sights with generous leisure time and intimate boutique accommodations.",
    icon: CalendarDays,
    badge: "Artisan Pacing",
  },
  {
    number: "04",
    title: "Small Group Intimacy",
    desc: "We cap our group sizes at 12–16 adventurers to foster lifelong friendships without the noise of commercial tour buses.",
    icon: Sparkles,
    badge: "Max 12-16 Guests",
  },
  {
    number: "05",
    title: "24/7 Safety Net",
    desc: "Round-the-clock emergency support, rapid re-routing protocols, and comprehensive operator insurance on every continent.",
    icon: Headphones,
    badge: "Always On Call",
  },
];

const awards = [
  {
    icon: BadgeCheck,
    title: "TripAdvisor Travelers’ Choice 2024",
    text: "Top 10% worldwide operator excellence",
  },
  {
    icon: Trophy,
    title: "Best Tour Operator – Travel Weekly",
    text: "Honored for responsible tourism innovation",
  },
  {
    icon: Star,
    title: "Google 4.9★ Rating – 3,200+ Reviews",
    text: "Verified independent customer satisfaction",
  },
  {
    icon: Award,
    title: "IATA Certified Agency",
    text: "Highest international aviation & safety standards",
  },
  {
    icon: Leaf,
    title: "Sustainable Tourism Certified",
    text: "100% carbon-offset and local community reinvestment",
  },
];

function delay(milliseconds: number) {
  return { "--reveal-delay": `${milliseconds}ms` } as CSSProperties;
}

export default function AboutPage() {
  return (
    <AboutReveal>
      <main className="overflow-hidden bg-[#FAFAFC] text-slate-900 pb-24">
        {/* ── 1. Top Cinematic Hero Landscape Banner ── */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-4 sm:pt-6">
          <section className="relative min-h-[360px] sm:min-h-[420px] md:min-h-[460px] w-full overflow-hidden rounded-[26px] bg-slate-950 shadow-xl flex items-center">
            <img
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1800&q=80"
              alt="Misty scenic mountain valley with lake"
              className="animate-tourvaa-hero absolute inset-0 h-full w-full object-cover opacity-60 scale-105"
            />
            {/* Ambient gradients */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-slate-950/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />

            {/* Hero Text Content */}
            <div className="relative z-10 max-w-3xl px-6 sm:px-12 py-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-bold text-white backdrop-blur-md shadow-xs">
                <Sparkles size={14} className="text-amber-400" />
                <span>Our Story &amp; Purpose</span>
                <span className="text-white/40">•</span>
                <span className="text-white/80">Est. 2015</span>
              </div>

              <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-black tracking-tight text-white font-heading leading-tight drop-shadow-md">
                Connecting Curious Souls to Unforgettable Journeys
              </h1>

              <p className="mt-4 text-sm sm:text-base md:text-lg leading-relaxed text-white/85 font-medium max-w-2xl">
                Tourvaa is a world-class adventure booking platform uniting travelers with vetted local tour leaders across 80+ countries. We curate small group and private expeditions designed for true cultural depth.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3 text-xs font-bold text-white">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-xs border border-white/20">
                  <Star size={13} className="text-amber-400 fill-amber-400" />
                  <span>4.9/5 Rating (3,200+ Reviews)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-xs border border-white/20">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span>100% Vetted Local Operators</span>
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* ── 2. Narrative & Asymmetric Photo Mosaic ── */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-16 sm:pt-24">
          <div data-reveal className="mx-auto max-w-4xl text-center">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-pub-secondary">
              OUR PHILOSOPHY &amp; MISSION
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-slate-950 font-heading">
              Crafting Journeys That Redefine Adventure
            </h2>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-600 font-medium max-w-3xl mx-auto">
              Founded in 2015, Tourvaa began with a simple yet powerful belief: that travel should be transformative, ethical, and deeply personal. What began as a small band of explorers has flourished into a trusted global platform, empowering tens of thousands of travelers to experience hidden mountain passes, remote archipelagoes, and ancient trade routes with total confidence.
            </p>
          </div>

          {/* Mosaic Gallery */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 items-center">
            <div
              data-reveal
              className="hidden lg:block group relative h-[280px] overflow-hidden rounded-2xl shadow-sm border border-slate-200/60"
            >
              <img
                src="https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=600&q=80"
                alt="European fairy-tale castle in alpine mountains"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="absolute bottom-3 left-3 text-[11px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <MapPin size={11} /> Bavaria, Germany
              </span>
            </div>

            <div className="grid gap-4">
              <div
                data-reveal
                className="group relative h-[145px] sm:h-[165px] overflow-hidden rounded-2xl shadow-sm border border-slate-200/60"
              >
                <img
                  src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80"
                  alt="Traditional water temple in Bali"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="absolute bottom-2.5 left-2.5 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <MapPin size={10} /> Bali, Indonesia
                </span>
              </div>
              <div
                data-reveal
                className="group relative h-[145px] sm:h-[165px] overflow-hidden rounded-2xl shadow-sm border border-slate-200/60"
              >
                <img
                  src="https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=600&q=80"
                  alt="Limestone sea cliffs in Thailand"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="absolute bottom-2.5 left-2.5 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <MapPin size={10} /> Krabi, Thailand
                </span>
              </div>
            </div>

            <div
              data-reveal
              className="group relative h-[310px] sm:h-[350px] overflow-hidden rounded-2xl shadow-md border border-slate-200/60"
            >
              <img
                src="https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80"
                alt="Sydney Opera House and harbour"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="absolute bottom-3 left-3 text-[11px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <MapPin size={11} /> Sydney, Australia
              </span>
            </div>

            <div className="grid gap-4">
              <div
                data-reveal
                className="group relative h-[145px] sm:h-[165px] overflow-hidden rounded-2xl shadow-sm border border-slate-200/60"
              >
                <img
                  src="https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=600&q=80"
                  alt="Serene mountain temple in Japan"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="absolute bottom-2.5 left-2.5 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <MapPin size={10} /> Kyoto, Japan
                </span>
              </div>
              <div
                data-reveal
                className="group relative h-[145px] sm:h-[165px] overflow-hidden rounded-2xl shadow-sm border border-slate-200/60"
              >
                <img
                  src="https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=600&q=80"
                  alt="Dubai golden dunes"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="absolute bottom-2.5 left-2.5 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <MapPin size={10} /> Dubai Desert, UAE
                </span>
              </div>
            </div>

            <div
              data-reveal
              className="hidden lg:block group relative h-[280px] overflow-hidden rounded-2xl shadow-sm border border-slate-200/60"
            >
              <img
                src="https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=600&q=80"
                alt="Historic Italian architecture"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="absolute bottom-3 left-3 text-[11px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <MapPin size={11} /> Tuscany, Italy
              </span>
            </div>
          </div>

          {/* Inspirational Founder Quote Card */}
          <div data-reveal className="mt-10 rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50/70 via-white to-sky-50/40 p-6 sm:p-8 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B1F3A] text-white shadow-2xs">
                <Quote size={18} />
              </div>
              <div>
                <p className="text-sm sm:text-base font-medium italic leading-relaxed text-slate-800">
                  &ldquo;We don&apos;t build tours to check off tourist traps. We build journeys where you step off the beaten track, break bread with welcoming hosts, and return home with a transformed outlook on our shared world.&rdquo;
                </p>
                <p className="mt-2 text-xs font-bold text-pub-secondary">
                  — Arjun Mehta, Founder &amp; Chief Explorer at Tourvaa
                </p>
              </div>
            </div>
          </div>

          {/* 4 Metric Badges in Elevated White Cards */}
          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {metrics.map((m, index) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.label}
                  data-reveal
                  style={delay(index * 60)}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl sm:text-4xl font-black text-slate-950 font-heading">
                      {m.value}
                    </span>
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${m.color}`}>
                      <Icon size={20} />
                    </span>
                  </div>
                  <div className="mt-3 text-sm font-bold text-slate-900 leading-snug">
                    {m.label}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 font-medium">
                    {m.sub}
                  </div>
                  <div className="mt-4 h-1 w-12 rounded-full bg-pub-secondary/40 group-hover:w-full group-hover:bg-pub-secondary transition-all duration-300" />
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 3. Why Choose Tourvaa (5 Premium Value Cards) ── */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-20 sm:pt-28">
          <div data-reveal className="text-center">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-pub-secondary">
              THE TOURVAA DIFFERENCE
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-slate-950 font-heading">
              Why Discerning Travelers Choose Us
            </h2>
            <p className="mt-3 text-sm text-slate-600 font-medium max-w-xl mx-auto">
              Engineered from the ground up to protect your budget, amplify your cultural immersion, and keep you safe every mile.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {values.map((v, index) => {
              const Icon = v.icon;
              const isFeatured = v.featured;

              if (isFeatured) {
                return (
                  <div
                    key={v.number}
                    data-reveal
                    style={delay(index * 60)}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-[#0B1F3A] p-6 text-white shadow-lg min-h-[300px] flex flex-col justify-between"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80"
                      alt="Historic Roman architecture"
                      className="absolute inset-0 h-full w-full object-cover opacity-25 group-hover:scale-105 transition duration-700"
                    />
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="text-3xl font-black text-amber-400 font-heading">
                        {v.number}
                      </span>
                      <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                        {v.badge}
                      </span>
                    </div>
                    <div className="relative z-10 mt-auto pt-8">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-xs mb-3">
                        <Icon size={18} />
                      </div>
                      <h3 className="text-base font-bold text-white leading-tight font-heading">
                        {v.title}
                      </h3>
                      <p className="mt-2 text-xs text-white/80 leading-relaxed font-normal">
                        {v.desc}
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={v.number}
                  data-reveal
                  style={delay(index * 60)}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs min-h-[300px] hover:border-slate-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-black text-slate-300 group-hover:text-slate-900 transition-colors font-heading">
                      {v.number}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                      {v.badge}
                    </span>
                  </div>

                  <div className="mt-auto pt-8">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 mb-3">
                      <Icon size={18} />
                    </div>
                    <h3 className="text-base font-bold text-slate-950 leading-tight font-heading">
                      {v.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed font-normal">
                      {v.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 4. Meet the Leadership & Curators ── */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-20 sm:pt-28">
          <div data-reveal>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-pub-secondary">
              OUR TEAM
            </span>
            <h2 className="mt-1 text-3xl sm:text-4xl font-black tracking-tight text-slate-950 font-heading">
              Meet the Explorers Behind Tourvaa
            </h2>
            <p className="mt-2 text-sm text-slate-600 font-medium max-w-xl">
              From former expedition leaders to logistics veterans, our global team works tirelessly to ensure your journey is seamless.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <div
                key={member.name}
                data-reveal
                style={delay(index * 60)}
                className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200"
              >
                <div className="relative h-60 w-full overflow-hidden rounded-xl bg-slate-100">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute bottom-2.5 left-2.5 rounded-md bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white">
                    {member.specialty}
                  </span>
                </div>
                <div className="mt-4 px-1">
                  <h3 className="text-base font-bold text-slate-950 font-heading">
                    {member.name}
                  </h3>
                  <p className="text-xs font-bold text-sky-700 mt-0.5">
                    {member.role}
                  </p>
                  <p className="mt-2.5 text-xs text-slate-600 leading-relaxed font-normal">
                    {member.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 5. Awards & Industry Recognition ── */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-20 sm:pt-28">
          <div data-reveal className="text-center max-w-2xl mx-auto">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-pub-secondary">
              CREDENTIALS &amp; TRUST
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-950 font-heading">
              Awards &amp; Global Recognition
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 font-medium">
              Trusted by international travelers and acclaimed for ethical tour operations, certified safety protocols, and guest satisfaction.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {awards.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  data-reveal
                  style={delay(index * 60)}
                  className="flex flex-col items-start rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-3.5 text-xs sm:text-sm font-bold text-slate-950 leading-snug font-heading">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-500 font-medium">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 6. Bottom Hero CTA ── */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-16 sm:pt-24">
          <div
            data-reveal="scale"
            className="relative flex min-h-[320px] sm:min-h-[380px] flex-col items-center justify-center overflow-hidden rounded-[26px] bg-[#0B1F3A] p-8 text-center text-white shadow-xl"
          >
            <img
              src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80"
              alt="Sunset mountain lake vista"
              className="absolute inset-0 h-full w-full object-cover opacity-40 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30" />

            <div className="relative z-10 max-w-2xl">
              <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-xs mb-3">
                Your Adventure Awaits
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-heading drop-shadow-md">
                Ready to Start Your Journey?
              </h2>
              <p className="mt-3 text-xs sm:text-sm md:text-base text-white/90 font-medium leading-relaxed max-w-xl mx-auto">
                Explore our curated collection of 500+ small-group and private tours, or speak with an expedition specialist for tailor-made itineraries.
              </p>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
                <Link
                  href="/tours"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-7 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-slate-100 hover:-translate-y-0.5"
                >
                  <span>Browse All Tours</span>
                  <ArrowRight size={15} />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 bg-black/30 backdrop-blur-xs px-6 text-sm font-bold text-white shadow-md transition hover:bg-white/20"
                >
                  Contact Specialists
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </AboutReveal>
  );
}
