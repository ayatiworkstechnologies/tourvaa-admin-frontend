"use client";

/* eslint-disable @next/next/no-img-element */

import type { CSSProperties } from "react";
import Link from "next/link";
import {
  LuAward as Award,
  LuBadgeCheck as BadgeCheck,
  LuCalendarDays as CalendarDays,
  LuHeadphones as Headphones,
  LuLeaf as Leaf,
  LuMapPin as MapPin,
  LuShieldCheck as ShieldCheck,
  LuSparkles as Sparkles,
  LuStar as Star,
  LuTrophy as Trophy,
  LuUsers as Users,
  LuCompass as Compass,
} from "react-icons/lu";

import AboutReveal from "@/components/public/AboutReveal";

const metrics = [
  ["10+", "Years of Experience"],
  ["500+", "Curated Tours"],
  ["50,000+", "Happy Travellers"],
  ["80+", "Destinations Worldwide"],
];

const team = [
  {
    name: "Arjun Mehta",
    role: "Founder & CEO",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    bio: "A lifelong explorer who has visited 60+ countries. Arjun founded Tourvaa to make world-class travel accessible to everyone.",
  },
  {
    name: "Priya Sharma",
    role: "Head of Operations",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
    bio: "With 12 years in travel logistics, Priya ensures every trip runs seamlessly from arrival to departure.",
  },
  {
    name: "James Walker",
    role: "Lead Tour Producer",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    bio: "James crafts our signature itineraries, blending iconic landmarks with hidden local cultural treasures.",
  },
  {
    name: "Sophia Chen",
    role: "Customer Experience Manager",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80",
    bio: "Sophia leads our support team, ensuring every traveller feels cared for throughout their entire journey.",
  },
];

const awards = [
  {
    icon: BadgeCheck,
    title: "TripAdvisor Travelers’ Choice 2024",
    text: "Top 10% worldwide",
  },
  {
    icon: Trophy,
    title: "Best Tour Operator – Travel Weekly 2023",
    text: "Industry excellence award",
  },
  {
    icon: Star,
    title: "Google 4.9★ Rating – 3,200+ Reviews",
    text: "Verified customer feedback",
  },
  {
    icon: Award,
    title: "IATA Certified Agency",
    text: "Global industry standard",
  },
  {
    icon: Leaf,
    title: "Sustainable Tourism Certified",
    text: "Responsible travel practices",
  },
];

function delay(milliseconds: number) {
  return { "--reveal-delay": `${milliseconds}ms` } as CSSProperties;
}

export default function AboutPage() {
  return (
    <AboutReveal>
      <main className="overflow-hidden bg-white text-slate-900 pb-20">
        {/* Top Hero Landscape Banner */}
        <div className="mx-auto max-w-[1400px] px-5 pt-3">
          <section className="relative h-[280px] sm:h-[340px] md:h-[380px] w-full overflow-hidden rounded-[20px] bg-slate-900 shadow-md flex items-center justify-center text-white">
            <img
              src="https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1600&q=80"
              alt="Scenic white arch bridge over turquoise river"
              className="animate-tourvaa-hero absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/25" />
            <h1 className="relative z-10 text-4xl sm:text-5xl font-black tracking-tight drop-shadow-md">
              About
            </h1>
          </section>
        </div>

        {/* Section 1: Intro Narrative & Mosaic Gallery */}
        <section className="mx-auto max-w-[1400px] px-5 pt-14 sm:pt-20">
          <div data-reveal className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
              Crafting journeys that redefine adventure
            </h2>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-500 font-medium max-w-3xl mx-auto">
              Founded in 2015, Tourvaa was born from a simple belief — that travel should be transformative, accessible, and unforgettable. What started as a small team of passionate travellers has grown into a trusted global tour operator, serving thousands of adventurers every year. From the fjordlands of New Zealand to the mountain passes of northern India, we&apos;re dedicated to extraordinary journeys.
            </p>
          </div>

          {/* Mosaic 5-Column Gallery */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 items-center">
            <div data-reveal className="hidden lg:block h-[260px] overflow-hidden rounded-2xl shadow-md">
              <img
                src="https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=600&q=80"
                alt="European castle destination"
                className="h-full w-full object-cover transition duration-700 hover:scale-105"
              />
            </div>
            <div className="grid gap-4">
              <div data-reveal className="h-[140px] sm:h-[160px] overflow-hidden rounded-2xl shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80"
                  alt="Pagoda on water"
                  className="h-full w-full object-cover transition duration-700 hover:scale-105"
                />
              </div>
              <div data-reveal className="h-[140px] sm:h-[160px] overflow-hidden rounded-2xl shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=600&q=80"
                  alt="Limestone sea rocks"
                  className="h-full w-full object-cover transition duration-700 hover:scale-105"
                />
              </div>
            </div>
            <div data-reveal className="h-[300px] sm:h-[340px] overflow-hidden rounded-2xl shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80"
                alt="Sydney Opera House and harbour"
                className="h-full w-full object-cover transition duration-700 hover:scale-105"
              />
            </div>
            <div className="grid gap-4">
              <div data-reveal className="h-[140px] sm:h-[160px] overflow-hidden rounded-2xl shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=600&q=80"
                  alt="Mountain pagoda"
                  className="h-full w-full object-cover transition duration-700 hover:scale-105"
                />
              </div>
              <div data-reveal className="h-[140px] sm:h-[160px] overflow-hidden rounded-2xl shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=600&q=80"
                  alt="Dubai resort destination"
                  className="h-full w-full object-cover transition duration-700 hover:scale-105"
                />
              </div>
            </div>
            <div data-reveal className="hidden lg:block h-[260px] overflow-hidden rounded-2xl shadow-md">
              <img
                src="https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=600&q=80"
                alt="Leaning Tower of Pisa"
                className="h-full w-full object-cover transition duration-700 hover:scale-105"
              />
            </div>
          </div>

          {/* 4 Metric Badges in White Cards */}
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {metrics.map(([value, label], index) => (
              <div
                key={label}
                data-reveal
                style={delay(index * 60)}
                className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <div className="text-3xl sm:text-4xl font-black text-slate-950">{value}</div>
                <div className="mt-1 text-xs sm:text-sm font-semibold text-slate-500">{label}</div>
                <div className="absolute bottom-0 inset-x-6 h-0.5 bg-blue-500/30 rounded-full" />
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Why Choose Tourvaa (5 Numbered Cards) */}
        <section className="mx-auto max-w-[1400px] px-5 pt-20 sm:pt-28">
          <div data-reveal className="text-center">
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-sky-600">
              WHY CHOOSE TOURVAA
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
              Crafting journeys that redefine adventure
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 01 */}
            <div
              data-reveal
              style={delay(0)}
              className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm min-h-[260px]"
            >
              <div className="text-4xl font-black text-slate-200">01</div>
              <div>
                <ShieldCheck size={20} className="text-slate-800" />
                <h3 className="mt-3 text-base font-extrabold text-slate-900 leading-tight">
                  Best Price Guarantee
                </h3>
              </div>
            </div>

            {/* 02 - Highlight Card with Image */}
            <div
              data-reveal
              style={delay(60)}
              className="group relative overflow-hidden rounded-2xl bg-slate-900 shadow-md min-h-[260px] flex flex-col justify-between p-6 text-white"
            >
              <img
                src="https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80"
                alt="Pantheon in Rome"
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
              <div className="relative z-10 text-4xl font-black text-white/40">02</div>
              <div className="relative z-10">
                <Users size={20} className="text-white" />
                <h3 className="mt-3 text-base font-extrabold text-white leading-tight">
                  Expert Local Guides
                </h3>
                <p className="mt-1.5 text-xs text-white/80 leading-relaxed font-normal">
                  Knowledgeable guides bringing destinations to life with insider stories.
                </p>
              </div>
            </div>

            {/* 03 */}
            <div
              data-reveal
              style={delay(120)}
              className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm min-h-[260px]"
            >
              <div className="text-4xl font-black text-slate-200">03</div>
              <div>
                <CalendarDays size={20} className="text-slate-800" />
                <h3 className="mt-3 text-base font-extrabold text-slate-900 leading-tight">
                  Handcrafted Itineraries
                </h3>
              </div>
            </div>

            {/* 04 */}
            <div
              data-reveal
              style={delay(180)}
              className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm min-h-[260px]"
            >
              <div className="text-4xl font-black text-slate-200">04</div>
              <div>
                <Sparkles size={20} className="text-slate-800" />
                <h3 className="mt-3 text-base font-extrabold text-slate-900 leading-tight">
                  Small Group Tours
                </h3>
              </div>
            </div>

            {/* 05 */}
            <div
              data-reveal
              style={delay(240)}
              className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm min-h-[260px]"
            >
              <div className="text-4xl font-black text-slate-200">05</div>
              <div>
                <Headphones size={20} className="text-slate-800" />
                <h3 className="mt-3 text-base font-extrabold text-slate-900 leading-tight">
                  24/7 Support
                </h3>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Meet the Team Behind Your Adventures */}
        <section className="mx-auto max-w-[1400px] px-5 pt-20 sm:pt-28">
          <div data-reveal>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
              Meet the Team Behind Your Adventures
            </h2>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              Our team of avid explorers ensure each trip brings unique perspectives and memories.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <div
                key={member.name}
                data-reveal
                style={delay(index * 60)}
                className="overflow-hidden rounded-[20px] border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div className="relative h-56 w-full overflow-hidden rounded-[16px] bg-slate-100">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-full w-full object-cover grayscale transition duration-500 hover:grayscale-0"
                  />
                </div>
                <div className="mt-4 px-1">
                  <h3 className="text-base font-extrabold text-slate-900">{member.name}</h3>
                  <p className="text-xs font-bold text-sky-600">{member.role}</p>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed font-normal">
                    {member.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Awards & Recognition */}
        <section className="mx-auto max-w-[1400px] px-5 pt-20 sm:pt-24">
          <div data-reveal>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
              Awards &amp; Recognition
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium">
              Trusted by travellers and recognized for ethical global tour operations and exceptional safety.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {awards.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  data-reveal
                  style={delay(index * 60)}
                  className="flex flex-col items-start rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                    <Icon size={18} />
                  </span>
                  <h3 className="mt-3 text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-400 font-medium">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 5: Bottom CTA Sunset Lake Banner */}
        <section className="mx-auto max-w-[1400px] px-5 pt-16 sm:pt-20">
          <div
            data-reveal="scale"
            className="relative flex min-h-[300px] sm:min-h-[360px] flex-col items-center justify-center overflow-hidden rounded-[24px] bg-slate-900 p-8 text-center text-white shadow-xl"
          >
            <img
              src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80"
              alt="Sunset mountain lake vista"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/45" />

            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-md">
                Ready to Start Your Journey?
              </h2>
              <p className="mt-3 text-xs sm:text-sm md:text-base text-white/90 font-medium leading-relaxed">
                Explore our curated collection of tours and find your next adventure.
              </p>
              <Link
                href="/tours"
                className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-[#0B1527] px-8 text-sm font-black text-white shadow-lg transition hover:bg-[#15233C] hover:-translate-y-0.5"
              >
                Browse All Tours
              </Link>
            </div>
          </div>
        </section>
      </main>
    </AboutReveal>
  );
}
