"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  LuArrowRight as ArrowRight,
  LuBadgeCheck as BadgeCheck,
  LuBriefcaseBusiness as Briefcase,
  LuBuilding2 as Building,
  LuCalendarCheck as CalendarCheck,
  LuChevronDown as ChevronDown,
  LuCircleCheckBig as CheckCircle2,
  LuClock as Clock,
  LuCreditCard as CreditCard,
  LuDollarSign as DollarSign,
  LuFileCheck2 as FileCheck,
  LuFileText as FileText,
  LuGlobe as Globe,
  LuHeadset as Headset,
  LuCircleHelp as HelpCircle,
  LuLandmark as Landmark,
  LuLayoutDashboard as LayoutDashboard,
  LuPlane as Plane,
  LuShieldCheck as ShieldCheck,
  LuSparkles as Sparkles,
  LuTicket as Ticket,
  LuTrendingUp as TrendingUp,
  LuUserCheck as UserCheck,
  LuUsers as Users,
  LuWallet as Wallet,
  LuZap as Zap,
} from "react-icons/lu";
import styles from "@/components/public/PartnerPortalLanding.module.css";

const BENEFITS = [
  {
    icon: Users,
    title: "Book Confidently for Clients",
    badge: "Agency Tools",
    description:
      "Search, customize quotes, and secure verified tour reservations for individual travellers or large groups directly from your agent portal.",
  },
  {
    icon: Ticket,
    title: "Exclusive B2B Partner Rates",
    badge: "Wholesale Margin",
    description:
      "Access net wholesale rates across Tourvaa's catalogue, enabling you to earn healthy commissions or apply custom markups.",
  },
  {
    icon: Wallet,
    title: "Transparent Commission Ledger",
    badge: "Earnings",
    description:
      "Real-time visibility into every booking's commission status, payout dates, and downloadable monthly tax statements.",
  },
  {
    icon: CalendarCheck,
    title: "Live Inventory & Instant Confirmation",
    badge: "Real-Time",
    description:
      "No waiting for manual supplier replies. Check live departure dates, seat counts, and confirm trips on the spot with clients.",
  },
  {
    icon: FileText,
    title: "White-Label Client Vouchers",
    badge: "Branding",
    description:
      "Generate clean, professional travel vouchers and itinerary summaries ready to hand directly to your clients with your agency details.",
  },
  {
    icon: Headset,
    title: "24/7 Agent Priority Concierge",
    badge: "Dedicated Support",
    description:
      "Direct telephone, WhatsApp, and extranet support to help resolve urgent client changes, special requests, and dietary needs.",
  },
] as const;

const STEPS = [
  {
    step: "01",
    icon: UserCheck,
    title: "Agent Registration",
    time: "2 mins",
    description:
      "Register your agency or freelance travel consultant profile with basic contact and business details.",
  },
  {
    step: "02",
    icon: FileCheck,
    title: "Document Verification",
    time: "10 mins",
    description:
      "Upload your company registration, tax certificate, and business bank proof to verify your agency credentials.",
  },
  {
    step: "03",
    icon: BadgeCheck,
    title: "Account Activation",
    time: "24-48 hrs",
    description:
      "Our agency relations team validates your credentials and unlocks wholesale B2B pricing across the entire catalogue.",
  },
  {
    step: "04",
    icon: Briefcase,
    title: "Quote, Book & Earn",
    time: "Immediate",
    description:
      "Build custom itineraries, book for your travellers with instant confirmation, and receive monthly commission payouts.",
  },
] as const;

const REQUIRED_DOCUMENTS = [
  {
    icon: FileText,
    title: "Agency Registration Certificate",
    badge: "Mandatory",
    description: "Proof that your travel agency or consultancy is a legally registered company or registered sole proprietorship.",
  },
  {
    icon: FileCheck,
    title: "Tax Identification (GST / VAT / TIN)",
    badge: "Mandatory",
    description: "Valid company tax registration certificate corresponding to your registered operational jurisdiction.",
  },
  {
    icon: UserCheck,
    title: "Authorized Signatory Identification",
    badge: "Mandatory",
    description: "Government-issued passport or national photo ID of the principal agency director or authorized consultant.",
  },
  {
    icon: Wallet,
    title: "Bank Account Proof / Cheque",
    badge: "Mandatory",
    description: "Bank statement header or cancelled business cheque for wire/ACH payout of earned commissions.",
  },
  {
    icon: Landmark,
    title: "Travel License / IATA Accreditation",
    badge: "Optional",
    description: "If applicable (IATA, ASTA, TAAI, ABTA, or regional tourism ministry authorization).",
  },
  {
    icon: FileText,
    title: "Commercial Address Verification",
    badge: "Optional",
    description: "Utility bill or lease agreement showing the operating address of your physical agency branch.",
  },
] as const;

const RULES = [
  {
    title: "Accurate Traveller Manifest Information",
    desc: "All client reservations made by agents must contain accurate guest names, contact details, and special dietary/accessibility requirements.",
  },
  {
    title: "Compliance & Ethical Quoting",
    desc: "Agents must adhere to standard consumer disclosure principles and provide complete cancellation terms to clients prior to booking.",
  },
  {
    title: "Transparent Commission Tracking",
    desc: "Commissions are recorded at the time of booking and released according to agreed payout schedules following tour completion.",
  },
  {
    title: "Standard Cancellation Policy Compliance",
    desc: "Client cancellations and refund requests follow Tourvaa's transparent tier policies as published on each tour listing.",
  },
] as const;

const FAQS = [
  {
    q: "How do travel agents earn commission on Tourvaa?",
    a: "Agents receive competitive B2B net partner rates across all tours on Tourvaa. On every confirmed client booking, your commission (typically 10% to 15%) is automatically calculated and tracked in your agent dashboard.",
  },
  {
    q: "Can I generate white-label itinerary vouchers for clients?",
    a: "Yes! The agent portal provides downloadable, printable itinerary summaries and confirmation vouchers formatted for clients, keeping supplier net rates confidential.",
  },
  {
    q: "When and how are agent commissions paid?",
    a: "Commissions are paid monthly via direct bank transfer to your agency account, with detailed downloadable earnings statements available in your financial ledger.",
  },
  {
    q: "Can I book customized or private group departures?",
    a: "Absolutely. You can request customized quotes or group allocations for 10+ passengers directly through your dedicated agent concierge desk.",
  },
  {
    q: "Can freelance or independent travel consultants join?",
    a: "Yes! Whether you are a large brick-and-mortar agency, an OTA, or an independent travel planner, you are welcome to apply with your registered business credentials.",
  },
];

export default function AgentPortalLandingPage() {
  // Interactive Commission Calculator state
  const [monthlyBookings, setMonthlyBookings] = useState(25);
  const [avgBookingValue, setAvgBookingValue] = useState(650);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const totalGrossBookingVolume = monthlyBookings * avgBookingValue;
  // Tiered commission: 10% base, 12% if volume > $15k, 14% if volume > $30k
  const commissionRate =
    totalGrossBookingVolume > 30000
      ? 0.14
      : totalGrossBookingVolume > 15000
      ? 0.12
      : 0.1;
  const estimatedCommission = totalGrossBookingVolume * commissionRate;

  return (
    <main className="overflow-x-hidden bg-white text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* 1. HERO SECTION */}
      <section
        id="overview"
        className="relative isolate overflow-hidden bg-indigo-950 text-white scroll-mt-20"
      >
        <Image
          src="/images/agent-portal-hero.png"
          alt="Travel agent planning a holiday with clients"
          fill
          priority
          sizes="100vw"
          className={`${styles.heroImage} object-cover object-[62%_center] opacity-40 mix-blend-luminosity lg:opacity-60`}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,13,54,.98)_0%,rgba(20,17,68,.92)_40%,rgba(30,27,95,.6)_70%,rgba(30,27,95,.2)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.22),transparent_60%)]" />
        <div className="pointer-events-none absolute -left-20 top-10 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center px-4 pt-12 pb-24 sm:px-6 sm:pt-16 sm:pb-28 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,.8fr)] lg:gap-12 lg:px-8 lg:pt-20 lg:pb-32">
          <div className={`${styles.heroCopy} max-w-2xl`}>
            {/* Top Category Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/15 px-4 py-1.5 text-xs font-black tracking-wide text-indigo-300 backdrop-blur-md">
              <Briefcase size={14} className="text-indigo-400" />
              <span>Tourvaa B2B Partner Portal for Travel Agents</span>
            </div>

            <h1 className="mt-6 text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.06] tracking-tight text-white">
              Your clients dream it.{" "}
              <span className="bg-gradient-to-r from-indigo-300 via-purple-200 to-indigo-400 bg-clip-text text-transparent">
                You make it happen.
              </span>
            </h1>

            <p className="mt-5 text-sm sm:text-base lg:text-lg leading-relaxed text-slate-200/90 max-w-xl">
              Discover vetted global tours, build client-ready quotes, secure
              wholesale B2B rates with live availability, and track high-earning
              commissions in one elegant workspace.
            </p>

            {/* Main Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/agent-portal/login?tab=register"
                className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-indigo-400 px-6 sm:px-7 py-3.5 sm:py-4 text-xs sm:text-sm font-black text-indigo-950 shadow-xl shadow-indigo-950/40 transition hover:-translate-y-0.5 hover:bg-indigo-300"
              >
                Become an Agent Partner <ArrowRight size={16} />
              </Link>
              <Link
                href="/agent-portal/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-white/30 bg-white/10 px-5 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                Agent Sign In
              </Link>
            </div>

            {/* Trust Highlights */}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2.5 border-t border-white/15 pt-5 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-indigo-400 shrink-0" /> B2B
                net partner rates
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-indigo-400 shrink-0" /> White-label
                client vouchers
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-indigo-400 shrink-0" /> Automated
                monthly commission payouts
              </span>
            </div>
          </div>

          {/* Right Floating Dashboard Preview Widget */}
          <div className="relative mt-8 lg:mt-0 w-full max-w-md mx-auto">
            <div
              className={`${styles.floatCard} relative rounded-3xl border border-indigo-500/30 bg-slate-900/90 p-6 sm:p-7 text-white shadow-2xl shadow-indigo-950/80 backdrop-blur-xl`}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-white">
                      Agent Agency Console
                    </span>
                    <span className="text-[10px] text-indigo-400 font-bold">
                      Gold Tier Partner (12% Base)
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-black text-indigo-300">
                  <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
                  Live Sync
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Accrued Commission
                  </span>
                  <div className="mt-1 text-2xl font-black text-indigo-300">
                    $3,420
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-400">
                    Payable end of month
                  </span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Client Itineraries
                  </span>
                  <div className="mt-1 text-2xl font-black text-white">
                    38 booked
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">
                    100% instant confirmation
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-indigo-500/20 bg-indigo-950/70 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">
                    Next Commission Transfer
                  </span>
                  <span className="font-black text-indigo-400">$2,180.50</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Direct ACH to Business Account</span>
                  <span>Scheduled 1st of month</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between pt-2 text-[11px] font-bold text-slate-400">
                <span>Access to 10,000+ Worldwide Tours</span>
                <Link
                  href="/agent-portal/login"
                  className="text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  Agent Dashboard <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. METRIC STRIP (Seamlessly bridges Hero and Content without overlapping banners) */}
      <section className="relative z-20 mx-auto -mt-10 sm:-mt-14 max-w-6xl px-4 sm:px-6">
        <div className="grid overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-xl shadow-slate-200/70 sm:grid-cols-3">
          <div className="p-6 sm:p-7 text-center border-b border-slate-100 sm:border-b-0 sm:border-r">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              10,000+ Tours
            </div>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
              Worldwide Vetted Catalog
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Ready to quote and book instantly for your travellers
            </p>
          </div>
          <div className="p-6 sm:p-7 text-center border-b border-slate-100 sm:border-b-0 sm:border-r">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Up to 15%
            </div>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
              Tiered Partner Commissions
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Industry-leading commissions with volume growth bonuses
            </p>
          </div>
          <div className="p-6 sm:p-7 text-center">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              100% Instant
            </div>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
              Automated Vouchers & Booking
            </p>
            <p className="mt-1 text-xs text-slate-500">
              No phone calls or waiting—quote and confirm on demand
            </p>
          </div>
        </div>
      </section>

      {/* 3. CROSS-PORTAL WAYFINDING BANNER */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 sm:px-6 text-xs shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-700 font-medium">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white font-black">
              <Building size={14} />
            </span>
            <span>
              Are you an <strong>experience or tour operator</strong> looking
              to list tours?
            </span>
          </div>
          <Link
            href="/supplier-portal"
            className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-900 transition hover:underline whitespace-nowrap"
          >
            Switch to Supplier Portal <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* 5. INTERACTIVE AGENT COMMISSION CALCULATOR */}
      <section
        id="calculator"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 scroll-mt-36"
      >
        <div className="rounded-[2rem] sm:rounded-[2.5rem] border border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 p-6 sm:p-10 lg:p-12 shadow-xl shadow-indigo-950/5">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-indigo-800">
                <DollarSign size={14} /> Agency Earnings Simulator
              </span>
              <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950">
                Calculate your monthly commission potential
              </h2>
              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600">
                See how much your travel agency can earn by booking Tourvaa
                experiences for your customers. Higher monthly booking volumes
                automatically unlock higher tier commission rates.
              </p>

              {/* Slider 1: Monthly Client Bookings */}
              <div className="mt-6 sm:mt-8 space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                  <span className="text-slate-700">
                    Monthly Client Tour Bookings
                  </span>
                  <span className="rounded-lg bg-indigo-100 px-2.5 py-1 text-indigo-800 font-black">
                    {monthlyBookings} bookings
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={monthlyBookings}
                  onChange={(e) => setMonthlyBookings(Number(e.target.value))}
                  className={`${styles.calcSlider} text-indigo-600 accent-indigo-600`}
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                  <span>5 bookings</span>
                  <span>60 bookings</span>
                  <span>120+ bookings</span>
                </div>
              </div>

              {/* Slider 2: Average Booking Value */}
              <div className="mt-5 sm:mt-6 space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                  <span className="text-slate-700">
                    Average Booking Value (USD)
                  </span>
                  <span className="rounded-lg bg-indigo-100 px-2.5 py-1 text-indigo-800 font-black">
                    ${avgBookingValue}
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="3000"
                  step="50"
                  value={avgBookingValue}
                  onChange={(e) => setAvgBookingValue(Number(e.target.value))}
                  className={`${styles.calcSlider} text-indigo-600 accent-indigo-600`}
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                  <span>$100</span>
                  <span>$1,500</span>
                  <span>$3,000+</span>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-indigo-50/70 p-3.5 border border-indigo-100 text-xs text-indigo-900 font-medium">
                Applied Tier:{" "}
                <strong>
                  {commissionRate * 100}% Commission (
                  {totalGrossBookingVolume > 30000
                    ? "Platinum Tier"
                    : totalGrossBookingVolume > 15000
                    ? "Gold Tier"
                    : "Standard Agent Tier"}
                  )
                </strong>
              </div>
            </div>

            {/* Result Card */}
            <div className="rounded-3xl border border-indigo-200 bg-white p-6 sm:p-8 shadow-xl shadow-indigo-950/10 text-center">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                Projected Monthly Agency Commission
              </span>
              <div className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-indigo-700">
                ${Math.round(estimatedCommission).toLocaleString()}
                <span className="text-sm font-bold text-slate-500"> / month</span>
              </div>
              <p className="mt-1.5 text-xs font-semibold text-indigo-600">
                Transferred automatically every month to your business bank
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-5 text-left">
                <div className="rounded-xl bg-slate-50 p-3">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">
                    Client Booking Volume
                  </span>
                  <span className="text-xs sm:text-sm font-black text-slate-800">
                    ${totalGrossBookingVolume.toLocaleString()}
                  </span>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">
                    Projected Annual Earnings
                  </span>
                  <span className="text-xs sm:text-sm font-black text-indigo-700">
                    ${Math.round(estimatedCommission * 12).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/agent-portal/login?tab=register"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 py-3.5 text-xs sm:text-sm font-black text-white shadow-lg transition hover:bg-indigo-800"
                >
                  Register Agency Account <ArrowRight size={16} />
                </Link>
                <p className="mt-2.5 text-[11px] text-slate-400">
                  Instant registration. No membership fees or booking quotas
                  required.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. WHAT'S INCLUDED / AGENT PERKS */}
      <section id="benefits" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 scroll-mt-36">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-black uppercase tracking-[.18em] text-indigo-700">
            Agency Capabilities
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950">
            Powerful tools built specifically for travel advisors
          </h2>
          <p className="mt-2.5 text-xs sm:text-sm text-slate-600">
            Everything your travel agency needs to recommend, quote, and book
            world-class experiences with speed and confidence.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, badge, description }) => (
            <div
              key={title}
              className={`${styles.featureCard} group rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-900/5`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`${styles.icon} flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700`}
                >
                  <Icon size={20} />
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-600">
                  {badge}
                </span>
              </div>
              <h3 className="mt-4 text-sm sm:text-base font-black text-slate-950">
                {title}
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-500">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. HOW IT WORKS TIMELINE */}
      <section
        id="how-it-works"
        className="bg-slate-900 py-16 sm:py-20 text-white scroll-mt-36"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-indigo-300">
              <Zap size={13} /> Agency Workflow
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              From registration to confident client bookings
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-400">
              Get set up in minutes and start recommending verified tours right
              away.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ step, icon: Icon, title, time, description }) => (
              <div
                key={title}
                className={`${styles.stepCard} relative rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-400 text-xs sm:text-sm font-black text-indigo-950">
                    {step}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                    <Clock size={11} /> {time}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Icon size={17} className="text-indigo-400" />
                  <h3 className="text-sm font-black text-white">{title}</h3>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-slate-300/80">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. VERIFICATION DOCUMENTS CHECKLIST */}
      <section
        id="documents"
        className="mx-auto max-w-6xl px-4 py-16 sm:py-20 sm:px-6 scroll-mt-36"
      >
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-indigo-700">
            <ShieldCheck size={14} /> Agency Verification
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950">
            What you will need to get verified
          </h2>
          <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-500">
            Upload your documentation through your agency console to unlock
            direct B2B partner net rates and commission payouts.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REQUIRED_DOCUMENTS.map(({ icon: Icon, title, badge, description }) => (
            <div
              key={title}
              className={`${styles.documentCard} flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-indigo-300 hover:shadow-lg`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <Icon size={18} />
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                      badge === "Mandatory"
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {badge}
                  </span>
                </div>
                <h3 className="mt-3.5 text-sm font-black text-slate-950">
                  {title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                  {description}
                </p>
              </div>
              <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-400">
                Accepted: PDF, JPG, PNG (Max 15MB)
              </div>
            </div>
          ))}

          {/* Quick Support Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-indigo-300 bg-indigo-50/60 p-5 sm:p-6">
            <div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-700 text-white">
                <Clock size={18} />
              </span>
              <h3 className="mt-3.5 text-sm font-black text-indigo-950">
                Dedicated Agency Desk
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-indigo-800/80">
                Have specific B2B integration questions or volume partnership
                queries? Our agency onboarding desk is ready to help.
              </p>
            </div>
            <div className="mt-4 border-t border-indigo-200 pt-3">
              <Link
                href="/contact"
                className="text-xs font-black text-indigo-800 hover:underline inline-flex items-center gap-1"
              >
                Contact Agency Desk <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 9. PARTNER RULES & STANDARDS */}
      <section
        id="guidelines"
        className="border-y border-slate-200 bg-slate-50 py-14 sm:py-16 scroll-mt-36"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-700">
              Agency Standards
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-950">
              What we expect from partner travel agents
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              Professional standards to ensure smooth guest operations and
              reliable service delivery.
            </p>
          </div>

          <div className="mt-8 grid gap-3.5 sm:grid-cols-2">
            {RULES.map(({ title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs"
              >
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0 text-indigo-600"
                />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    {title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. FAQ ACCORDION SECTION */}
      <section id="faq" className="mx-auto max-w-4xl px-4 py-16 sm:py-20 sm:px-6 scroll-mt-36">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-slate-600">
            <HelpCircle size={14} /> Knowledge Base
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Common questions about agent commissions, client vouchers, group
            bookings, and payouts.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold text-slate-900 hover:bg-slate-50 transition"
                >
                  <span className="pr-4">{faq.q}</span>
                  <ChevronDown
                    size={17}
                    className={`shrink-0 text-indigo-700 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 p-4 sm:p-5 pt-3 text-xs sm:text-sm leading-relaxed text-slate-600 bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 11. BOTTOM HIGH-CONVERSION CTA */}
      <section className="relative mx-auto max-w-6xl overflow-hidden px-4 pb-16 sm:pb-20 text-center sm:px-6">
        <div
          className={`${styles.ctaGlow} pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-200/60 blur-3xl`}
        />
        <div className="relative rounded-[2rem] sm:rounded-[2.5rem] border border-indigo-200 bg-gradient-to-b from-white to-indigo-50/30 px-6 py-12 sm:py-16 shadow-2xl shadow-indigo-950/10 backdrop-blur-sm sm:px-12">
          <Sparkles className="mx-auto mb-3 text-indigo-600" size={26} />
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950">
            Ready to empower your travel agency?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-xs sm:text-sm leading-relaxed text-slate-600">
            Join thousands of travel agents worldwide delivering unforgettable
            experiences and building reliable commission income.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/agent-portal/login?tab=register"
              className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-indigo-700 px-7 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-black text-white shadow-xl shadow-indigo-900/20 transition hover:-translate-y-0.5 hover:bg-indigo-800"
            >
              Become an Agent Partner <ArrowRight size={16} />
            </Link>
            <Link
              href="/agent-portal/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-indigo-300 bg-white px-6 sm:px-7 py-3.5 sm:py-4 text-xs sm:text-sm font-bold text-indigo-800 transition hover:bg-indigo-50"
            >
              Already registered? Sign in
            </Link>
          </div>

          <div className="mt-7 flex items-center justify-center gap-5 sm:gap-6 text-[11px] sm:text-xs text-slate-400 font-semibold">
            <span>✓ B2B net wholesale rates</span>
            <span>✓ Instant client vouchers</span>
            <span>✓ Verified monthly payouts</span>
          </div>
        </div>
      </section>
    </main>
  );
}
