/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  LuAward as Award,
  LuBadgeCheck as BadgeCheck,
  LuCheck as Check,
  LuEye as Eye,
  LuHandshake as Handshake,
  LuHeadphones as Headphones,
  LuHeartHandshake as HeartHandshake,
  LuLinkedin as Linkedin,
  LuMapPin as MapPin,
  LuPlay as Play,
  LuQuote as Quote,
  LuShieldCheck as ShieldCheck,
  LuStar as Star,
  LuTarget as Target,
  LuTwitter as Twitter,
  LuUsers as Users,
} from "react-icons/lu";

const team = [
  { name: "Arjun Sharma", role: "Co-Founder & CEO", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=85" },
  { name: "Meera Krishnan", role: "Co-Founder & CTO", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=85" },
  { name: "Rohit Verma", role: "Head of Operations", image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=600&q=85" },
  { name: "Sneha Iyer", role: "Head of Customer Experience", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=85" },
];

const benefits = [
  [Handshake, "Verified Partners", "All our partners are verified and reviewed."],
  [Award, "Best Price Guarantee", "Get the best value for your money."],
  [ShieldCheck, "Secure Booking", "Safe payments and secure transactions."],
  [Headphones, "24/7 Support", "We are with you at every step."],
  [HeartHandshake, "Customised Trips", "Personalised itineraries created just for you."],
] as const;

const testimonials = [
  { quote: "Tourvaa planned our honeymoon perfectly. Everything was smooth and beyond our expectations!", name: "Priya & Arjun", place: "Maldives" },
  { quote: "Excellent service and a very helpful team. Our family trip to Kerala was truly memorable.", name: "Ramesh Family", place: "Kerala" },
  { quote: "Great experience booking our Bali trip. Best prices and amazing support.", name: "Noha Patel", place: "Bali" },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-10 text-center"><h2 className="font-heading text-3xl font-black text-[#073b3f] md:text-4xl">{children}</h2><span className="mx-auto mt-3 block h-0.5 w-14 bg-orange-500" /></div>;
}

export default function AboutPage() {
  return (
    <main className="bg-white text-slate-900">
      <section className="relative min-h-[520px] overflow-hidden pt-24 text-white">
        <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2200&q=90" alt="Traveller overlooking a mountain lake" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#073b4c]/90 via-[#073b4c]/55 to-transparent" />
        <div className="relative mx-auto flex min-h-[430px] max-w-7xl items-center px-5 md:px-8">
          <div className="max-w-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-100">Our journey</p>
            <h1 className="mt-4 font-heading text-5xl font-black tracking-tight md:text-6xl">About Tourvaa</h1>
            <p className="mt-3 font-serif text-3xl italic leading-tight text-orange-400">Crafting Journeys,<br />Creating Memories</p>
            <p className="mt-6 max-w-md text-sm leading-7 text-white/85">We are a team of travel enthusiasts and technology experts on a mission to make travel simple, personal, and truly unforgettable.</p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionTitle>Our Story</SectionTitle>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-center">
            <div className="space-y-5 text-sm leading-7 text-slate-600">
              <p>Tourvaa was born from a simple belief—travel should be personal, seamless, and accessible to everyone.</p>
              <p>We bring together verified travel partners, smart technology, and genuine travel expertise to help you explore the world with confidence.</p>
              <p>Whether it is a weekend getaway or a once-in-a-lifetime journey, we are here to make every moment special.</p>
              <div className="grid grid-cols-3 gap-4 pt-5">
                {[["10K+", "Happy Travellers", Users], ["500+", "Travel Partners", Handshake], ["50+", "Destinations", MapPin]].map(([value, label, Icon]) => { const I = Icon as typeof Users; return <div key={String(label)}><I size={20} className="mb-2 text-teal-700" /><p className="text-2xl font-black text-[#073b3f]">{String(value)}</p><p className="mt-1 text-xs text-slate-500">{String(label)}</p></div>; })}
              </div>
            </div>
            <div className="relative pb-10">
              <div className="relative aspect-[1.65] overflow-hidden rounded-2xl shadow-xl"><img src="https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=85" alt="Travellers hiking in the mountains" className="h-full w-full object-cover" /><span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-teal-800 shadow-lg"><Play size={20} className="ml-1 fill-current" /></span></div>
              <div className="absolute bottom-0 right-0 rounded-xl bg-[#075b57] px-8 py-6 text-white shadow-xl"><p className="text-3xl font-black">7+</p><p className="mt-1 text-xs leading-5">Years of creating<br />memorable journeys</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionTitle>Our Mission, Vision &amp; Values</SectionTitle>
          <div className="grid gap-6 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700"><Target size={23} /></span><h3 className="mt-5 text-xl font-black text-[#073b3f]">Our Mission</h3><p className="mt-3 text-sm leading-6 text-slate-600">To make travel easy, reliable, and enriching by connecting travellers with trusted partners and exceptional experiences.</p></article>
            <article className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700"><Eye size={23} /></span><h3 className="mt-5 text-xl font-black text-[#073b3f]">Our Vision</h3><p className="mt-3 text-sm leading-6 text-slate-600">To become the most trusted travel platform that inspires people to explore the world and create lasting memories.</p></article>
            <article className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700"><BadgeCheck size={23} /></span><h3 className="mt-5 text-xl font-black text-[#073b3f]">Our Values</h3><ul className="mt-3 space-y-2 text-sm text-slate-600">{["Customer First", "Transparency", "Trust & Integrity", "Passion for Travel", "Sustainable Tourism"].map((value) => <li key={value} className="flex items-center gap-2"><Check size={14} className="text-teal-700" />{value}</li>)}</ul></article>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8"><SectionTitle>Why Choose Tourvaa?</SectionTitle><div className="grid grid-cols-2 gap-8 md:grid-cols-5">{benefits.map(([Icon, title, text]) => { const I = Icon; return <div key={title} className="text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-teal-700"><I size={23} /></span><h3 className="mt-4 text-sm font-black text-[#073b3f]">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{text}</p></div>; })}</div></div>
      </section>

      <section className="bg-slate-50 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8"><SectionTitle>Meet The People Behind Tourvaa</SectionTitle><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{team.map((member) => <article key={member.name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="aspect-[1.1] overflow-hidden bg-slate-100"><img src={member.image} alt={member.name} className="h-full w-full object-cover object-top transition duration-500 hover:scale-105" /></div><div className="p-4 text-center"><h3 className="font-black text-[#073b3f]">{member.name}</h3><p className="mt-1 text-xs text-slate-500">{member.role}</p><div className="mt-3 flex justify-center gap-3 text-teal-700"><Linkedin size={14} /><Twitter size={14} /></div></div></article>)}</div></div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8"><SectionTitle>What Travellers Say About Us</SectionTitle><div className="grid gap-6 md:grid-cols-3">{testimonials.map((item) => <article key={item.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex gap-1 text-orange-500">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={14} className="fill-current" />)}</div><Quote size={22} className="mt-5 text-teal-100" /><p className="mt-2 text-sm leading-6 text-slate-600">{item.quote}</p><div className="mt-5 border-t border-slate-100 pt-4"><p className="text-sm font-black text-[#073b3f]">{item.name}</p><p className="text-xs text-slate-400">{item.place}</p></div></article>)}</div></div>
      </section>

      <section className="px-5 pb-16 md:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-[#064e4a] text-white"><img src="https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1600&q=85" alt="Hot air balloons over a travel destination" className="absolute inset-0 h-full w-full object-cover opacity-45" /><div className="absolute inset-0 bg-gradient-to-r from-[#064e4a] via-[#064e4a]/90 to-transparent" /><div className="relative max-w-xl p-8 md:p-12"><p className="text-xs font-black uppercase tracking-[0.2em] text-teal-200">Your journey starts here</p><h2 className="mt-3 text-3xl font-black">Ready to Start Your Journey?</h2><p className="mt-3 text-sm leading-6 text-white/75">Let our travel experts help you plan your perfect holiday.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/contact" className="rounded-lg bg-orange-500 px-6 py-3 text-sm font-black hover:bg-orange-600">Plan My Trip</Link><Link href="/contact" className="rounded-lg border border-white/70 px-6 py-3 text-sm font-black hover:bg-white hover:text-teal-900">Talk to an Expert</Link></div></div></div>
      </section>
    </main>
  );
}
