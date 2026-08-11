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
} from "react-icons/lu";

import AboutReveal from "@/components/public/AboutReveal";

const metrics = [
  ["10+", "Years of Experience"],
  ["500+", "Curated Tours"],
  ["50,000+", "Happy Travellers"],
  ["80+", "Destinations Worldwide"],
];

const benefits = [
  { icon: ShieldCheck, title: "Best Price Guarantee", text: "Transparent pricing and outstanding value on every journey." },
  { icon: Users, title: "Expert Local Guides", text: "Knowledgeable guides who bring each destination to life with insider stories and hidden gems.", image: "/images/about/local-guide.jpg" },
  { icon: CalendarDays, title: "Handcrafted Itineraries", text: "Thoughtfully planned days, balanced for discovery and comfort." },
  { icon: Sparkles, title: "Small Group Tours", text: "More personal experiences with space to connect and explore." },
  { icon: Headphones, title: "24/7 Support", text: "A real travel expert is ready whenever your journey needs help." },
];

const team = [
  { name: "Arjun Mehta", role: "Founder & CEO", image: "/images/about/arjun.jpg", bio: "A lifelong explorer who has visited 60+ countries. Arjun founded Tourvaa to make world-class travel accessible to everyone." },
  { name: "Priya Sharma", role: "Head of Operations", image: "/images/about/priya.jpg", bio: "With 12 years in travel logistics, Priya ensures every trip runs smoothly from start to finish." },
  { name: "James Walker", role: "Lead Tour Designer", image: "/images/about/james.jpg", bio: "James crafts our signature itineraries, blending iconic landmarks with hidden local treasures." },
  { name: "Sophia Chen", role: "Customer Experience Manager", image: "/images/about/sophia.jpg", bio: "Sophia leads our support team, making sure every traveller feels supported at every step." },
];

const awards = [
  { icon: BadgeCheck, title: "TripAdvisor Travellers’ Choice 2024", text: "Top 10% worldwide" },
  { icon: Trophy, title: "Best Tour Operator – Travel Weekly 2023", text: "Industry excellence award" },
  { icon: Star, title: "Google 4.8+ Rating – 2,400+ Reviews", text: "Verified customer feedback" },
  { icon: Award, title: "IATA Certified Agency", text: "Global industry standard" },
  { icon: Leaf, title: "Sustainable Tourism Certified", text: "Responsible travel practices" },
];

function delay(milliseconds: number) {
  return { "--reveal-delay": `${milliseconds}ms` } as CSSProperties;
}

export default function AboutPage() {
  return (
    <AboutReveal>
      <main className="overflow-hidden bg-white text-[#111827]">
        <section className="relative flex min-h-[365px] items-center justify-center overflow-hidden pt-20 text-white md:min-h-[430px]">
          <img
            src="/images/destination-alpine.jpg"
            alt="Snow-covered mountains above a green alpine valley"
            className="animate-tourvaa-hero absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-900/15 to-slate-950/35" />
          <div data-reveal="scale" className="relative px-5 text-center">
            <h1 className="font-heading text-4xl font-black tracking-tight md:text-5xl">About</h1>
          </div>
        </section>

        <section className="pb-16 pt-14 md:pb-24 md:pt-20">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <div data-reveal className="mx-auto max-w-4xl text-center">
              <h2 className="font-heading text-2xl font-black tracking-tight text-[#101828] md:text-4xl">Crafting journeys that redefine adventure</h2>
              <p className="mx-auto mt-5 max-w-4xl text-sm leading-7 text-slate-500 md:text-[15px]">
                Founded in 2015, Tourvaa was born from a simple belief — that travel should be transformative, accessible, and unforgettable. What started as a small team of passionate travellers has grown into a trusted global tour operator, serving thousands of adventurers every year. We handpick every destination, curate every itinerary, and partner with local experts to deliver authentic experiences.
              </p>
            </div>

            <div className="relative left-1/2 mt-12 grid w-[106%] -translate-x-1/2 grid-cols-2 items-center gap-3 sm:w-full lg:grid-cols-[.72fr_1fr_1.15fr_1fr_.72fr] lg:gap-4">
              <div data-reveal="left" data-float className="hidden h-[280px] overflow-hidden rounded-2xl shadow-lg lg:block lg:-translate-x-14">
                <img src="/images/destination-desert.jpg" alt="Desert city destination" className="h-full w-full object-cover transition duration-700 hover:scale-110" />
              </div>
              <div className="grid gap-3 lg:gap-4">
                {[
                  ["/images/hero-3.jpg", "Tropical limestone islands"],
                  ["/images/hero-1.jpg", "Island beach"],
                ].map(([src, alt], index) => (
                  <div key={alt} data-reveal="scale" data-float style={{ ...delay(index * 70), "--float-delay": `${index * -700}ms` } as CSSProperties} className="h-[150px] overflow-hidden rounded-2xl bg-slate-100 shadow-lg sm:h-[190px] lg:h-[220px]">
                    <img src={src} alt={alt} className="h-full w-full object-cover transition duration-700 hover:scale-110" />
                  </div>
                ))}
              </div>
              <div data-reveal="scale" data-float style={{ ...delay(120), "--float-delay": "-1300ms" } as CSSProperties} className="h-[315px] overflow-hidden rounded-2xl bg-slate-100 shadow-lg sm:h-[395px] lg:h-[500px] lg:-translate-y-5">
                <img src="/images/hero-2.jpg" alt="Coastal resort" className="h-full w-full object-cover transition duration-700 hover:scale-110" />
              </div>
              <div className="grid gap-3 lg:gap-4">
                {[
                  ["/images/destination-alpine.jpg", "Alpine mountain retreat"],
                  ["/images/destination-desert.jpg", "Dubai skyline"],
                ].map(([src, alt], index) => (
                  <div key={alt} data-reveal="scale" data-float style={{ ...delay(180 + index * 70), "--float-delay": `${-1900 - index * 700}ms` } as CSSProperties} className="h-[150px] overflow-hidden rounded-2xl bg-slate-100 shadow-lg sm:h-[190px] lg:h-[220px]">
                    <img src={src} alt={alt} className="h-full w-full object-cover transition duration-700 hover:scale-110" />
                  </div>
                ))}
              </div>
              <div data-reveal="right" data-float className="hidden h-[280px] overflow-hidden rounded-2xl shadow-lg lg:block lg:translate-x-14">
                <img src="/images/hero-1.jpg" alt="Tropical shoreline" className="h-full w-full object-cover transition duration-700 hover:scale-110" />
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-3 lg:hidden">
                <div data-reveal="left" className="h-[145px] overflow-hidden rounded-2xl shadow-lg"><img src="/images/destination-desert.jpg" alt="Desert city destination" className="h-full w-full object-cover" /></div>
                <div data-reveal="right" className="h-[145px] overflow-hidden rounded-2xl shadow-lg"><img src="/images/hero-1.jpg" alt="Tropical shoreline" className="h-full w-full object-cover" /></div>
              </div>
            </div>

            <div data-reveal className="mt-14 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_12px_35px_rgba(15,23,42,.06)] sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
              {metrics.map(([value, label], index) => (
                <div key={label} style={delay(index * 80)} className="group rounded-xl border border-slate-100 px-5 py-5 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
                  <p className="text-3xl font-black tracking-tight text-slate-950">{value}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">{label}</p>
                  <span className="mt-4 block h-1 w-full origin-left scale-x-50 rounded-full bg-gradient-to-r from-blue-600 to-sky-300 transition-transform duration-500 group-hover:scale-x-100" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F6F8FB] py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <div data-reveal className="text-center">
              <span className="rounded-full bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-blue-600">Why choose Tourvaa</span>
              <h2 className="mt-5 font-heading text-2xl font-black tracking-tight md:text-4xl">Crafting journeys that redefine adventure</h2>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <article key={benefit.title} data-reveal style={delay(index * 80)} className="group relative min-h-[365px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-500 hover:-translate-y-2 hover:shadow-xl">
                    <span className="text-6xl font-black tracking-tighter text-slate-200 transition-colors group-hover:text-blue-100">{String(index + 1).padStart(2, "0")}</span>
                    {benefit.image && (
                      <div className="mx-[-20px] mt-4 h-36 overflow-hidden">
                        <img src={benefit.image} alt="Local travel guide destination" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                      </div>
                    )}
                    <div className={`absolute inset-x-5 bottom-6 ${benefit.image ? "" : "pt-28"}`}>
                      <Icon size={18} className="mb-4 text-blue-600 transition-transform duration-300 group-hover:scale-110" />
                      <h3 className="text-sm font-black text-slate-950">{benefit.title}</h3>
                      {benefit.image && <p className="mt-2 text-xs leading-5 text-slate-500">{benefit.text}</p>}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <div data-reveal>
              <h2 className="font-heading text-2xl font-black tracking-tight md:text-4xl">Meet the Team Behind Your Adventures</h2>
              <p className="mt-3 text-sm text-slate-500">Our team is built on a shared passion for travel, storytelling, and delivering exceptional experiences.</p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {team.map((member, index) => (
                <article key={member.name} data-reveal style={delay(index * 90)} className="group rounded-2xl border border-slate-200 bg-white p-3 transition duration-500 hover:-translate-y-2 hover:shadow-xl">
                  <div className="aspect-[1.18] overflow-hidden rounded-xl bg-slate-100">
                    <img src={member.image} alt={member.name} className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-105" />
                  </div>
                  <div className="px-1 pb-3 pt-4">
                    <h3 className="font-black text-slate-950">{member.name}</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{member.role}</p>
                    <p className="mt-3 text-xs leading-5 text-slate-500">{member.bio}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-16 md:pb-24">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <div data-reveal>
              <h2 className="font-heading text-2xl font-black tracking-tight md:text-4xl">Awards &amp; Recognition</h2>
              <p className="mt-3 text-sm text-slate-500">Trusted by travellers and recognized by the industry for our commitment to quality, safety, and sustainability.</p>
            </div>
            <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:divide-x lg:divide-slate-200">
              {awards.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} data-reveal style={delay(index * 70)} className="group px-2 lg:px-5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-700 transition duration-300 group-hover:rotate-6 group-hover:bg-blue-50 group-hover:text-blue-600"><Icon size={20} /></span>
                    <h3 className="mt-4 text-xs font-black leading-5 text-slate-900">{item.title}</h3>
                    <p className="mt-1 text-[11px] text-slate-500">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative flex min-h-[380px] items-center justify-center overflow-hidden px-5 py-16 text-center text-white">
          <img src="/images/destination-alpine.jpg" alt="Mountain lake at sunset" className="absolute inset-0 h-full w-full object-cover transition duration-[2000ms] hover:scale-105" />
          <div className="absolute inset-0 bg-slate-950/55" />
          <div data-reveal="scale" className="relative max-w-2xl">
            <h2 className="font-heading text-3xl font-black md:text-5xl">Ready to Start Your Journey?</h2>
            <p className="mt-4 text-sm text-white/80">Browse our curated collection of tours and find your next unforgettable adventure.</p>
            <Link href="/tours" className="mt-8 inline-flex rounded-full bg-blue-600 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-950/25 transition duration-300 hover:-translate-y-1 hover:bg-blue-500 hover:shadow-xl">Browse All Tours</Link>
          </div>
        </section>
      </main>
    </AboutReveal>
  );
}
