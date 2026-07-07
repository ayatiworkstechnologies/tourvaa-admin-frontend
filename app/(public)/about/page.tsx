import Link from "next/link";
import { LuArrowRight as ArrowRight, LuBadgeCheck as BadgeCheck, LuBriefcase as Briefcase, LuCalendarCheck as CalendarCheck, LuHeadphones as Headphones, LuMapPinned as MapPinned, LuUsers as Users, LuWarehouse as Warehouse } from "react-icons/lu";

const team = [
  { name: "Arjun Mehta", role: "Founder & CEO", initials: "AM" },
  { name: "Leena Varghese", role: "Head of Operations", initials: "LV" },
  { name: "Rashid Al-Farsi", role: "Director, Gulf Markets", initials: "RA" },
  { name: "Priya Nair", role: "Head of Product", initials: "PN" },
];

const values = [
  [CalendarCheck, "Transparent planning", "Every booking, pricing, and policy detail is visible before you commit. No surprises."],
  [MapPinned, "Curated quality", "Our destination team vets every route and property in person before it appears on the platform."],
  [Headphones, "Live support", "Real people, reachable by message during your trip — not just before it."],
  [BadgeCheck, "Verified network", "Every supplier and agent partner is onboarded through a structured compliance process."],
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-zinc-50 pb-20">
      {/* Hero */}
      <section className="bg-zinc-950 py-24 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-violet-600/20 blur-[100px]" />
        
        <div className="relative mx-auto max-w-7xl px-5 md:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">About Us</p>
            <h1 className="mt-4 text-5xl font-black leading-tight drop-shadow-sm md:text-6xl">Travel planned the way it should be</h1>
            <p className="mt-6 text-lg leading-relaxed text-white/70">
              Tourvaa is a travel operations platform built for modern travellers and tour professionals. We combine curated destination expertise with a clean digital experience — so every journey is managed without friction.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Our Story</p>
            <h2 className="mt-3 text-4xl font-black text-zinc-950 tracking-tight">Built from a frustration with how travel works</h2>
            <p className="mt-6 text-base leading-relaxed text-zinc-600">
              Tourvaa was founded after years of watching travel operations run on spreadsheets, WhatsApp groups, and manual follow-ups. The gap between what travellers expected and what the industry was delivering was enormous.
            </p>
            <p className="mt-4 text-base leading-relaxed text-zinc-600">
              We started by building tools for tour operators — calendar management, pricing slabs, booking dashboards — and expanded to a full customer-facing platform as our supplier network grew. Today, Tourvaa connects verified suppliers, trained agents, and independent travellers under one platform across India and the Gulf region.
            </p>
            <p className="mt-4 text-base leading-relaxed text-zinc-600 font-medium">
              The mission has not changed: make every part of a trip easier to plan, book, and enjoy — for everyone involved.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-5">
            {[["500+", "Happy travellers"], ["120+", "Curated tours"], ["40+", "Verified suppliers"], ["3", "Countries covered"]].map(([n, l]) => (
              <div key={l} className="rounded-3xl border border-zinc-100 bg-white p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <p className="text-4xl font-black text-indigo-600">{n}</p>
                <p className="mt-2 text-sm font-bold text-zinc-500 uppercase tracking-wider">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-20 border-y border-zinc-100 shadow-sm">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mb-14 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Values</p>
            <h2 className="mt-3 text-4xl font-black text-zinc-950 tracking-tight">What we stand for</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(([Icon, title, desc]) => {
              const I = Icon as typeof CalendarCheck;
              return (
                <div key={String(title)} className="rounded-3xl border border-zinc-100 bg-zinc-50 p-8 transition-all hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100/50 text-indigo-600">
                    <I size={24} />
                  </div>
                  <h3 className="mt-6 text-lg font-bold text-zinc-950">{String(title)}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600">{String(desc)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="mb-14 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Team</p>
          <h2 className="mt-3 text-4xl font-black text-zinc-950 tracking-tight">The people behind Tourvaa</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((m) => (
            <div key={m.name} className="rounded-3xl border border-zinc-100 bg-white p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-2xl font-black text-indigo-600">
                {m.initials}
              </div>
              <p className="mt-5 text-lg font-bold text-zinc-950">{m.name}</p>
              <p className="mt-1 text-sm font-semibold text-zinc-500 uppercase tracking-widest">{m.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Partner CTAs */}
      <section className="bg-zinc-950 py-20 text-white relative overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-96 w-full -translate-x-1/2 -translate-y-1/2 bg-indigo-600/10 blur-[120px]" />
        
        <div className="relative mx-auto max-w-7xl px-5 md:px-8">
          <div className="mb-14 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Partners</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight drop-shadow-sm">Join our growing network</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              [Warehouse, "Supplier", "List your tours, manage bookings, and reach more travellers.", "/supplier"],
              [Briefcase, "Agent / Reseller", "Sell Tourvaa tours and earn commissions on every booking.", "/agent"],
              [Users, "Customer", "Browse and book curated tours with a free traveller account.", "/register"],
            ].map(([Icon, title, desc, href]) => {
              const I = Icon as typeof Warehouse;
              return (
                <div key={String(title)} className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md transition-all hover:bg-white/10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-indigo-400">
                    <I size={24} />
                  </div>
                  <h3 className="mt-6 text-xl font-bold">{String(title)}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/60">{String(desc)}</p>
                  <Link href={String(href)} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                    Get started <ArrowRight size={16} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
