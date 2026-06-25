import Link from "next/link";
import { ArrowRight, BadgeCheck, Briefcase, CalendarCheck, Headphones, MapPinned, Users, Warehouse } from "lucide-react";

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
    <main className="min-h-screen bg-[#F7F9FC] pb-20">
      {/* Hero */}
      <section className="bg-[#0F172A] py-20 text-white">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest text-[#43A9F6]">About Us</p>
            <h1 className="mt-3 text-5xl font-bold leading-tight">Travel planned the way it should be</h1>
            <p className="mt-5 text-base leading-7 text-white/75">
              Tourvaa is a travel operations platform built for modern travellers and tour professionals. We combine curated destination expertise with a clean digital experience — so every journey is managed without friction.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#0284C7]">Our Story</p>
            <h2 className="mt-3 text-3xl font-bold text-[#0F172A]">Built from a frustration with how travel works</h2>
            <p className="mt-4 text-sm leading-7 text-[#667085]">
              Tourvaa was founded after years of watching travel operations run on spreadsheets, WhatsApp groups, and manual follow-ups. The gap between what travellers expected and what the industry was delivering was enormous.
            </p>
            <p className="mt-4 text-sm leading-7 text-[#667085]">
              We started by building tools for tour operators — calendar management, pricing slabs, booking dashboards — and expanded to a full customer-facing platform as our supplier network grew. Today, Tourvaa connects verified suppliers, trained agents, and independent travellers under one platform across India and the Gulf region.
            </p>
            <p className="mt-4 text-sm leading-7 text-[#667085]">
              The mission has not changed: make every part of a trip easier to plan, book, and enjoy — for everyone involved.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[["500+", "Happy travellers"], ["120+", "Curated tours"], ["40+", "Verified suppliers"], ["3", "Countries covered"]].map(([n, l]) => (
              <div key={l} className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-[#E7EAF0]">
                <p className="text-3xl font-bold text-[#0284C7]">{n}</p>
                <p className="mt-1 text-sm font-semibold text-[#667085]">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#0284C7]">Values</p>
            <h2 className="mt-2 text-3xl font-bold text-[#0F172A]">What we stand for</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(([Icon, title, desc]) => {
              const I = Icon as typeof CalendarCheck;
              return (
                <div key={String(title)} className="rounded-2xl bg-[#F7F9FC] p-6 ring-1 ring-[#E7EAF0]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E7F5FF] text-[#0284C7]">
                    <I size={20} />
                  </div>
                  <h3 className="mt-4 font-bold text-[#121826]">{String(title)}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#667085]">{String(desc)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#0284C7]">Team</p>
          <h2 className="mt-2 text-3xl font-bold text-[#0F172A]">The people behind Tourvaa</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((m) => (
            <div key={m.name} className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-[#E7EAF0]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E7F5FF] text-lg font-bold text-[#0284C7]">
                {m.initials}
              </div>
              <p className="mt-3 font-bold text-[#121826]">{m.name}</p>
              <p className="mt-1 text-xs text-[#667085]">{m.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Partner CTAs */}
      <section className="bg-[#0F172A] py-16 text-white">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#43A9F6]">Partners</p>
            <h2 className="mt-2 text-3xl font-bold">Join our growing network</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              [Warehouse, "Supplier", "List your tours, manage bookings, and reach more travellers.", "/join/supplier"],
              [Briefcase, "Agent / Reseller", "Sell Tourvaa tours and earn commissions on every booking.", "/join/agent"],
              [Users, "Customer", "Browse and book curated tours with a free traveller account.", "/register"],
            ].map(([Icon, title, desc, href]) => {
              const I = Icon as typeof Warehouse;
              return (
                <div key={String(title)} className="rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur">
                  <I size={22} className="text-[#43A9F6]" />
                  <h3 className="mt-4 text-lg font-bold">{String(title)}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/65">{String(desc)}</p>
                  <Link href={String(href)} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#43A9F6] hover:underline">
                    Get started <ArrowRight size={14} />
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
