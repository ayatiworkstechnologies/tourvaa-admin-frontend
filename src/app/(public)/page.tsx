"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  LuBadgeCheck as BadgeCheck,
  LuBookOpen as BookOpen,
  LuBuilding2 as Building2,
  LuCalendarCheck as CalendarCheck,
  LuChevronRight as ChevronRight,
  LuHeart as Heart,
  LuHeadphones as Headphones,
  LuLandmark as Landmark,
  LuMountain as Mountain,
  LuQuote as Quote,
  LuShieldCheck as ShieldCheck,
  LuShipWheel as ShipWheel,
  LuSparkles as Sparkles,
  LuStar as Star,
  LuTags as Tags,
  LuUsers as Users,
  LuWaves as Waves,
} from "react-icons/lu";
import { useCurrency } from "@/hooks/useCurrency";
import FeaturedTours from "@/components/public/FeaturedTours";
import HeroFilterBar from "@/components/public/HeroFilterBar";

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} className={`reveal-block ${className}`}>{children}</div>;
}

const travelStyles = [
  { label: "Beach Holidays", icon: Waves, tone: "bg-cyan-50 text-cyan-700" },
  { label: "Adventure Tours", icon: Mountain, tone: "bg-emerald-50 text-emerald-700" },
  { label: "Honeymoon", icon: Heart, tone: "bg-rose-50 text-rose-600" },
  { label: "Family Trips", icon: Users, tone: "bg-amber-50 text-amber-700" },
  { label: "Pilgrimage", icon: Landmark, tone: "bg-orange-50 text-orange-700" },
  { label: "City Breaks", icon: Building2, tone: "bg-sky-50 text-sky-700" },
  { label: "Wellness", icon: Sparkles, tone: "bg-orange-50 text-orange-700" },
  { label: "Cruises", icon: ShipWheel, tone: "bg-blue-50 text-blue-700" },
];

const destinations = [
  { name: "Maldives", price: 4599, currency: "AED", packages: "120+ packages", image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=85", className: "md:row-span-2" },
  { name: "Dubai", price: 2099, currency: "AED", packages: "95+ packages", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=85", className: "md:col-span-2" },
  { name: "Kashmir", price: 1999, currency: "AED", packages: "85+ packages", image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1000&q=85", className: "md:col-span-2" },
  { name: "Bali", price: 3899, currency: "AED", packages: "60+ packages", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=85", className: "" },
  { name: "Kerala", price: 1699, currency: "AED", packages: "110+ packages", image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=900&q=85", className: "" },
  { name: "Singapore", price: 4999, currency: "AED", packages: "75+ packages", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=900&q=85", className: "md:col-span-2" },
];

const benefits = [
  { icon: BadgeCheck, title: "Verified Partners", text: "Every supplier and travel agent is reviewed." },
  { icon: Tags, title: "Transparent Pricing", text: "Clear package inclusions with no surprises." },
  { icon: ShieldCheck, title: "Secure Booking", text: "Protected transactions and verified bookings." },
  { icon: Headphones, title: "Personalised Support", text: "Help before, during, and after your journey." },
  { icon: CalendarCheck, title: "Flexible Packages", text: "Customise stays, activities, and extensions." },
  { icon: Star, title: "Trusted Reviews", text: "Feedback from travellers who completed their trips." },
];

const experiences = [
  { title: "Desert Safari", image: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=700&q=80" },
  { title: "Scuba Diving", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=700&q=80" },
  { title: "Mountain Trekking", image: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=700&q=80" },
  { title: "Heritage Walk", image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=700&q=80" },
  { title: "Wildlife Safari", image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=700&q=80" },
  { title: "Romantic Dinner", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=700&q=80" },
];

const steps = [
  { number: "01", title: "Discover", text: "Browse destinations, packages, and experiences." },
  { number: "02", title: "Customise", text: "Modify hotels, activities, dates, and details." },
  { number: "03", title: "Book Securely", text: "Confirm your trip with safe and complete payment." },
  { number: "04", title: "Travel Confidently", text: "Receive vouchers, updates, and continuous support." },
];

const stories = [
  { title: "Best International Destinations for Families", meta: "6 min read", image: "https://images.unsplash.com/photo-1504150558240-0b4fd8946624?auto=format&fit=crop&w=700&q=80" },
  { title: "A 7-Day Kerala Travel Itinerary", meta: "8 min read", image: "https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&w=700&q=80" },
  { title: "How to Plan a Maldives Honeymoon", meta: "6 min read", image: "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=700&q=80" },
  { title: "The Best Time to Visit Kashmir", meta: "7 min read", image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=700&q=80" },
];

function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: string }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-heading text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action && (
        <Link href="/tours" className="hidden shrink-0 rounded-lg border border-teal-700 px-4 py-2 text-xs font-bold text-teal-800 transition hover:bg-teal-700 hover:text-white sm:inline-flex">
          {action}
        </Link>
      )}
    </div>
  );
}

export default function Home() {
  const { formatCompact } = useCurrency();
  return (
    <main className="overflow-x-hidden bg-white text-slate-950">
      <section className="relative z-20 min-h-screen bg-slate-950 pt-28 text-white">
        <img
          src="https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=2200&q=90"
          alt="Tropical island resort surrounded by clear blue water"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#052e3b]/95 via-[#07556c]/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#042f35]/70 via-transparent to-[#063b58]/25" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-7rem)] max-w-7xl flex-col px-5 pb-10 pt-12 sm:pt-16 md:px-8 lg:px-10 lg:pt-20">
          <div className="max-w-xl">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.24em] text-cyan-200">Curated journeys, made personal</p>
            <h1 className="font-heading text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              Your World.<br />Your Journey.
              <span className="mt-2 block font-serif text-4xl font-normal italic text-orange-400 sm:text-5xl">Your Way.</span>
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-7 text-white/85 sm:text-base">
              Discover carefully curated tours, unique experiences, and personalised holiday packages designed by verified travel experts.
            </p>
          </div>

          <div className="absolute right-10 top-24 hidden rounded-2xl bg-white/90 p-5 text-slate-800 shadow-2xl backdrop-blur lg:block xl:top-1/3">
            {["Verified Travel Partners", "Secure Payments", "24/7 Trip Assistance"].map((item) => (
              <p key={item} className="flex items-center gap-2 py-1.5 text-xs font-bold">
                <BadgeCheck size={15} className="text-teal-600" /> {item}
              </p>
            ))}
          </div>

          <div className="relative z-20 mt-10 w-full sm:mt-12 lg:mt-16">
            <HeroFilterBar />
            <div className="mx-auto mt-4 flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-2 text-[11px] font-semibold text-white/80">
              <span className="font-black text-white">Popular:</span>
              {['Maldives', 'Dubai', 'Kashmir', 'Bali', 'Kerala', 'Singapore'].map((place) => <Link key={place} href={`/tours?country=${place}`}>{place}</Link>)}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-white py-10">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <h2 className="text-center font-heading text-2xl font-black text-slate-950">Explore Your Travel Style</h2>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {travelStyles.map(({ label, icon: Icon, tone }) => (
              <Link key={label} href={`/tours?category=${encodeURIComponent(label)}`} className="group rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <span className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}><Icon size={23} /></span>
                <span className="mt-3 block text-xs font-extrabold text-slate-700 group-hover:text-teal-700">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50/60 py-16">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Reveal>
            <SectionHeading title="Trending Destinations" subtitle="Explore the places travellers are loving right now." action="View All Destinations" />
            <div className="grid auto-rows-[190px] grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5">
              {destinations.map((destination) => (
                <Link key={destination.name} href={`/tours?country=${destination.name}`} className={`group relative overflow-hidden rounded-2xl shadow-sm ${destination.className}`}>
                  <img src={destination.image} alt={destination.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-white">
                    <div><h3 className="text-xl font-black">{destination.name}</h3><p className="mt-1 text-[11px]">Packages from {formatCompact(destination.price, destination.currency)}</p><p className="text-[10px] text-white/70">{destination.packages}</p></div>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-900"><ChevronRight size={15} /></span>
                  </div>
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Reveal>
            <div className="mb-7 text-center">
              <h2 className="font-heading text-2xl font-black md:text-3xl">Handpicked Tours for Every Traveller</h2>
              <p className="mt-1 text-sm text-slate-500">Carefully selected holidays from trusted travel partners.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {['All', 'International', 'India', 'Honeymoon', 'Family', 'Adventure', 'Luxury'].map((item, index) => <span key={item} className={`rounded-full px-4 py-1.5 text-xs font-bold ${index === 0 ? 'bg-teal-700 text-white' : 'border border-slate-200 text-slate-500'}`}>{item}</span>)}
              </div>
            </div>
            <FeaturedTours />
          </Reveal>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Reveal className="overflow-hidden rounded-3xl bg-[#064e4a] text-white shadow-lg">
            <div className="grid md:grid-cols-[1.05fr_.95fr]">
              <div className="flex flex-col justify-center p-8 md:p-12">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-200">Made for you</p>
                <h2 className="mt-3 font-heading text-3xl font-black">Have a destination in mind?</h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-white/75">Let our verified travel experts create a personalised itinerary based on your budget, interests, and preferred travel dates.</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/contact" className="rounded-lg bg-orange-500 px-6 py-3 text-sm font-black text-white transition hover:bg-orange-600">Plan My Trip</Link>
                  <Link href="/contact" className="rounded-lg border border-white/60 px-6 py-3 text-sm font-bold transition hover:bg-white hover:text-teal-900">Talk to an Expert</Link>
                </div>
              </div>
              <div className="min-h-72"><img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85" alt="Traveller looking across a mountain valley" className="h-full w-full object-cover" /></div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 py-14">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <h2 className="text-center font-heading text-2xl font-black">Why Travellers Choose Tourvaa</h2>
          <div className="mt-9 grid grid-cols-2 gap-7 md:grid-cols-3 lg:grid-cols-6">
            {benefits.map(({ icon: Icon, title, text }) => (
              <div key={title} className="text-center"><Icon size={24} className="mx-auto text-teal-700" /><h3 className="mt-3 text-xs font-black">{title}</h3><p className="mt-2 text-[11px] leading-5 text-slate-500">{text}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section id="experiences" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionHeading title="Travel for the Experience" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {experiences.map((experience) => (
              <Link href="/tours" key={experience.title} className="group relative aspect-[1.55] overflow-hidden rounded-xl">
                <img src={experience.image} alt={experience.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" /><p className="absolute inset-x-0 bottom-3 text-center text-sm font-black text-white">{experience.title}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fffaf6] py-14">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionHeading title="Limited-Time Travel Deals" action="View All Offers" />
          <div className="grid gap-5 md:grid-cols-2">
            <article className="grid overflow-hidden rounded-2xl bg-white shadow-sm sm:grid-cols-[.9fr_1.1fr]"><img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80" alt="Tropical beach deal" className="h-full min-h-52 w-full object-cover" /><div className="relative p-7"><span className="absolute right-5 top-5 flex h-20 w-20 items-center justify-center rounded-full bg-teal-500 text-center text-xl font-black text-white">25%<br /><small className="text-xs">OFF</small></span><p className="text-xs font-black uppercase text-orange-500">Summer Escape</p><h3 className="mt-2 max-w-[12rem] text-xl font-black">Save on selected beach packages</h3><p className="mt-5 text-sm text-slate-500">Use code: <b className="text-orange-500">SUMMER25</b></p></div></article>
            <article className="grid overflow-hidden rounded-2xl bg-white shadow-sm sm:grid-cols-[.9fr_1.1fr]"><img src="https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=900&q=80" alt="Honeymoon deal" className="h-full min-h-52 w-full object-cover" /><div className="relative p-7"><span className="absolute right-5 top-5 flex h-20 w-20 items-center justify-center rounded-full bg-orange-500 text-center text-xl font-black text-white">20%<br /><small className="text-xs">OFF</small></span><p className="text-xs font-black uppercase text-rose-500">Honeymoon Special</p><h3 className="mt-2 max-w-[12rem] text-xl font-black">Romantic holidays designed for two</h3><p className="mt-5 text-sm text-slate-500">Use code: <b className="text-rose-500">LOVE20</b></p></div></article>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <h2 className="text-center font-heading text-2xl font-black">Plan Your Holiday in Four Simple Steps</h2>
          <div className="mt-10 grid gap-7 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.number} className="relative flex gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-black text-teal-700">{step.number}</span><div><h3 className="text-sm font-black">{step.title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{step.text}</p></div>{index < 3 && <span className="absolute -right-3 top-5 hidden h-px w-6 bg-teal-200 md:block" />}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 md:px-8 lg:grid-cols-[.85fr_2fr]">
          <article className="rounded-2xl bg-white p-7 shadow-sm"><Quote size={28} className="text-teal-200" /><p className="mt-4 text-sm leading-7 text-slate-600">Tourvaa made our Maldives honeymoon completely stress-free. Everything from the hotel to airport transfers was perfectly organised.</p><div className="mt-5 flex gap-1 text-amber-400">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={14} className="fill-current" />)}</div><p className="mt-3 text-xs font-black">Priya &amp; Arjun</p><p className="text-[11px] text-slate-400">Chennai · Verified booking</p></article>
          <div><SectionHeading title="Ideas for Your Next Journey" /><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{stories.map((story) => <Link href="/blogs" key={story.title} className="group"><div className="aspect-[1.45] overflow-hidden rounded-xl"><img src={story.image} alt={story.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div><h3 className="mt-3 text-sm font-black leading-5 group-hover:text-teal-700">{story.title}</h3><p className="mt-1 text-[11px] text-slate-400"><BookOpen size={11} className="mr-1 inline" />{story.meta}</p></Link>)}</div></div>
        </div>
      </section>

    </main>
  );
}
