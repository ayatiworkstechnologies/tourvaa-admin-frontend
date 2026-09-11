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
  LuShieldCheck as ShieldCheck,
  LuSparkles as Sparkles,
  LuTrendingUp as TrendingUp,
  LuUserCheck as UserCheck,
  LuUsers as Users,
  LuWallet as Wallet,
  LuZap as Zap,
} from "react-icons/lu";
import styles from "@/components/public/PartnerPortalLanding.module.css";

const BENEFITS = [
  {
    icon: Globe,
    title: "Worldwide Marketplace Reach",
    badge: "Distribution",
    description:
      "Present your tours to thousands of active travellers, verified travel agents, and corporate bookers browsing Tourvaa every day.",
  },
  {
    icon: LayoutDashboard,
    title: "Single Partner Extranet",
    badge: "Operations",
    description:
      "Manage itineraries, tier pricing, seasonal blackouts, real-time seat inventory, and customer messages from one centralized workspace.",
  },
  {
    icon: Wallet,
    title: "Reliable Scheduled Payouts",
    badge: "Finance",
    description:
      "Full transparency on every booking. Fixed commission structures with automated bank transfers sent directly to your registered account.",
  },
  {
    icon: CalendarCheck,
    title: "Instant Booking Sync",
    badge: "Automation",
    description:
      "Receive real-time booking alerts via email & SMS. Seamless seat decrementing avoids overbooking and reduces manual paperwork.",
  },
  {
    icon: Headset,
    title: "Dedicated Partner Concierge",
    badge: "Support",
    description:
      "Your dedicated account specialist assists with onboarding, pricing strategy, professional listing optimization, and customer inquiries.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Operator Badge",
    badge: "Trust & Credibility",
    description:
      "Stand out with Tourvaa's verified supplier seal, building confidence among international travellers and driving higher conversion.",
  },
] as const;

const STEPS = [
  {
    step: "01",
    icon: UserCheck,
    title: "Quick Registration",
    time: "2 mins",
    description:
      "Register your business profile, specify your operational regions, and set up your secure partner credentials.",
  },
  {
    step: "02",
    icon: FileCheck,
    title: "Verification Upload",
    time: "10 mins",
    description:
      "Submit your business license, tax details, and company verification documents via our encrypted compliance portal.",
  },
  {
    step: "03",
    icon: BadgeCheck,
    title: "Fast Review & Approval",
    time: "24-48 hrs",
    description:
      "Our supplier operations team verifies your documentation and activates your live extranet catalog rights.",
  },
  {
    step: "04",
    icon: Building,
    title: "Publish & Earn",
    time: "Immediate",
    description:
      "Add departures, establish retail rates, welcome travellers from around the world, and receive scheduled payouts.",
  },
] as const;

const REQUIRED_DOCUMENTS = [
  {
    icon: FileText,
    title: "Company Registration Certificate",
    badge: "Mandatory",
    description: "Official legal entity registration document from your country or state commerce registry.",
  },
  {
    icon: Landmark,
    title: "Trade / Tourism Operator License",
    badge: "Mandatory",
    description: "Current valid license authorizing commercial tourism, guiding, or passenger transfer operations.",
  },
  {
    icon: FileCheck,
    title: "Tax Registration Certificate",
    badge: "Mandatory",
    description: "Valid tax identification certificate (e.g., GST, VAT, EIN, or national corporate tax registration).",
  },
  {
    icon: UserCheck,
    title: "Authorized Signatory Identification",
    badge: "Mandatory",
    description: "Government-issued passport or national photo ID of the business owner or legal representative.",
  },
  {
    icon: Wallet,
    title: "Corporate Bank Account Proof",
    badge: "Mandatory",
    description: "Official bank statement header or cancelled business cheque matching registered company name for payouts.",
  },
] as const;

const RULES = [
  {
    title: "Guaranteed Accuracy & Pricing Parity",
    desc: "All itineraries, inclusions, departure dates, and live seat allocations must be accurate and kept up to date at all times.",
  },
  {
    title: "Swift Booking Confirmation SLA",
    desc: "Booking confirmations must be acknowledged within 24 hours to guarantee the highest standard of traveller satisfaction.",
  },
  {
    title: "Prompt Customer Communication",
    desc: "Suppliers must provide clear emergency contact information and timely meeting point directions prior to tour departure.",
  },
  {
    title: "Transparent Commission Terms",
    desc: "Payouts follow the verified commission agreed during onboarding with zero hidden extranet or listing maintenance fees.",
  },
  {
    title: "Quality Review Assurance",
    desc: "Modifications to published tours undergo an editorial check by Tourvaa's catalog desk to preserve marketplace consistency.",
  },
] as const;

const FAQS = [
  {
    q: "How does Tourvaa pay suppliers?",
    a: "Payouts are transferred automatically via direct bank wire / ACH to your registered corporate bank account on a transparent bi-weekly or monthly schedule following tour departure dates.",
  },
  {
    q: "Are there any upfront listing or subscription fees?",
    a: "No. Joining Tourvaa is completely free. We do not charge registration fees, monthly subscription fees, or listing fees. We only earn a small agreed commission percentage when we successfully deliver a paid booking.",
  },
  {
    q: "How long does document verification take?",
    a: "Our partner compliance desk typically reviews and approves submissions within 24 to 48 business hours. You can track review progress in real-time within your partner dashboard.",
  },
  {
    q: "Can I sync my existing booking calendar or API?",
    a: "Yes! Our partner extranet supports calendar synchronization, iCal integration, and manual schedule controls. If you operate your own reservation system, contact our developer desk for API connectivity.",
  },
  {
    q: "What happens if a customer cancels their booking?",
    a: "Cancellations follow the cancellation tier policy specified on your tour listing. Eligible non-refundable portions or supplier retention policies are honored based on your agreed terms.",
  },
];

export default function SupplierPortalLandingPage() {
  // Interactive Earnings Calculator state
  const [monthlyBookings, setMonthlyBookings] = useState(45);
  const [avgTicketPrice, setAvgTicketPrice] = useState(120);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const grossSales = monthlyBookings * avgTicketPrice;
  const estimatedCommissionRate = 0.1; // 10% Tourvaa commission
  const netEarnings = grossSales * (1 - estimatedCommissionRate);

  return (
    <main className="overflow-x-hidden bg-white text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* 1. HERO SECTION */}
      <section
        id="overview"
        className="relative isolate overflow-hidden bg-emerald-950 text-white scroll-mt-20"
      >
        <Image
          src="/images/supplier-portal-hero.png"
          alt="Tour operator welcoming travellers in the mountains"
          fill
          priority
          sizes="100vw"
          className={`${styles.heroImage} object-cover object-[60%_center] opacity-40 mix-blend-luminosity lg:opacity-60`}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,44,34,.98)_0%,rgba(2,44,34,.92)_40%,rgba(2,44,34,.6)_70%,rgba(2,44,34,.2)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(52,211,153,0.18),transparent_60%)]" />
        <div className="pointer-events-none absolute -left-20 top-10 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center px-4 pt-12 pb-24 sm:px-6 sm:pt-16 sm:pb-28 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,.8fr)] lg:gap-12 lg:px-8 lg:pt-20 lg:pb-32">
          <div className={`${styles.heroCopy} max-w-2xl`}>
            {/* Top Category Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-4 py-1.5 text-xs font-black tracking-wide text-emerald-300 backdrop-blur-md">
              <Building size={14} className="text-emerald-400" />
              <span>Tourvaa for Tour Operators & Experience Providers</span>
            </div>

            <h1 className="mt-6 text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.06] tracking-tight text-white">
              Turn remarkable tours into a{" "}
              <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent">
                global business.
              </span>
            </h1>

            <p className="mt-5 text-sm sm:text-base lg:text-lg leading-relaxed text-slate-200/90 max-w-xl">
              Publish excursions, control real-time seat availability, connect
              with verified global travel agents, and receive automated,
              transparent bank payouts from one unified workspace.
            </p>

            {/* Main Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/supplier-portal/login?tab=register"
                className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-emerald-400 px-6 sm:px-7 py-3.5 sm:py-4 text-xs sm:text-sm font-black text-emerald-950 shadow-xl shadow-emerald-950/40 transition hover:-translate-y-0.5 hover:bg-emerald-300"
              >
                Become a Supplier Partner <ArrowRight size={16} />
              </Link>
              <Link
                href="/supplier-portal/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-white/30 bg-white/10 px-5 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                Supplier Sign In
              </Link>
            </div>

            {/* Trust Highlights */}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2.5 border-t border-white/15 pt-5 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" /> No
                upfront or listing fees
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" /> Human
                onboarding specialist
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" /> Bi-weekly
                direct bank payouts
              </span>
            </div>
          </div>

          {/* Right Dashboard Preview Card */}
          <div className="relative mt-8 lg:mt-0 w-full max-w-md mx-auto">
            <div
              className={`${styles.floatCard} relative rounded-3xl border border-emerald-500/30 bg-slate-900/90 p-6 sm:p-7 text-white shadow-2xl shadow-emerald-950/80 backdrop-blur-xl`}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-white">
                      Extranet Live Hub
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      Verified Supplier Status
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-black text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  Active
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    This Month Net
                  </span>
                  <div className="mt-1 text-2xl font-black text-emerald-300">
                    $14,850
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-400">
                    +28% vs last month
                  </span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Confirmed Bookings
                  </span>
                  <div className="mt-1 text-2xl font-black text-white">
                    142 pax
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">
                    100% payout scheduled
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/70 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Next Payout</span>
                  <span className="font-black text-emerald-400">$4,250.00</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Status: Scheduled via Direct Wire</span>
                  <span>In 2 days</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between pt-2 text-[11px] font-bold text-slate-400">
                <span>Catalogue: 12 Active Tours</span>
                <Link
                  href="/supplier-portal/login"
                  className="text-emerald-400 hover:underline inline-flex items-center gap-1"
                >
                  Enter Extranet <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. METRIC STRIP (Seamlessly bridges Hero and Content without overlapping banners) */}
      <section className="relative z-20 mx-auto -mt-10 sm:-mt-14 max-w-6xl px-4 sm:px-6">
        <div className="grid overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl shadow-slate-200/70 sm:grid-cols-3">
          <div className="p-6 sm:p-7 text-center border-b border-slate-100 sm:border-b-0 sm:border-r">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              80+ Countries
            </div>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
              International Traveller Base
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Direct & agent distribution in key tourism corridors
            </p>
          </div>
          <div className="p-6 sm:p-7 text-center border-b border-slate-100 sm:border-b-0 sm:border-r">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              0% Listing Fees
            </div>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
              Pay Only On Confirmed Bookings
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Completely risk-free onboarding & catalog management
            </p>
          </div>
          <div className="p-6 sm:p-7 text-center">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              &lt; 48 Hours
            </div>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
              Expedited Compliance Review
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Dedicated compliance specialists for quick approvals
            </p>
          </div>
        </div>
      </section>

      {/* 3. CROSS-PORTAL WAYFINDING BANNER */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 sm:px-6 text-xs shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-700 font-medium">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white font-black">
              <Briefcase size={14} />
            </span>
            <span>
              Are you a <strong>travel agency</strong> or advisor looking to
              book tours for clients?
            </span>
          </div>
          <Link
            href="/agent-portal"
            className="inline-flex items-center gap-1.5 font-bold text-indigo-700 hover:text-indigo-900 transition hover:underline whitespace-nowrap"
          >
            Switch to Agent Portal <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* 5. INTERACTIVE EARNINGS ESTIMATOR SECTION */}
      <section
        id="calculator"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 scroll-mt-36"
      >
        <div className="rounded-[2rem] sm:rounded-[2.5rem] border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 p-6 sm:p-10 lg:p-12 shadow-xl shadow-emerald-950/5">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-emerald-800">
                <DollarSign size={14} /> Revenue Calculator
              </span>
              <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950">
                Estimate what your tours can earn with Tourvaa
              </h2>
              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600">
                Adjust the sliders to simulate your potential monthly payout.
                Tourvaa handles payment gateway processing, multilingual
                distribution, and customer support.
              </p>

              {/* Slider 1: Monthly Bookings */}
              <div className="mt-6 sm:mt-8 space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                  <span className="text-slate-700">
                    Estimated Monthly Tour Guests
                  </span>
                  <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-emerald-800 font-black">
                    {monthlyBookings} guests
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="300"
                  step="5"
                  value={monthlyBookings}
                  onChange={(e) => setMonthlyBookings(Number(e.target.value))}
                  className={`${styles.calcSlider} text-emerald-600 accent-emerald-600`}
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                  <span>5 guests</span>
                  <span>150 guests</span>
                  <span>300+ guests</span>
                </div>
              </div>

              {/* Slider 2: Average Tour Ticket Price */}
              <div className="mt-5 sm:mt-6 space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                  <span className="text-slate-700">
                    Average Price per Person (USD)
                  </span>
                  <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-emerald-800 font-black">
                    ${avgTicketPrice}
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="800"
                  step="10"
                  value={avgTicketPrice}
                  onChange={(e) => setAvgTicketPrice(Number(e.target.value))}
                  className={`${styles.calcSlider} text-emerald-600 accent-emerald-600`}
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                  <span>$20</span>
                  <span>$400</span>
                  <span>$800+</span>
                </div>
              </div>
            </div>

            {/* Result Card */}
            <div className="rounded-3xl border border-emerald-200 bg-white p-6 sm:p-8 shadow-xl shadow-emerald-950/10 text-center">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                Projected Monthly Supplier Payout
              </span>
              <div className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-emerald-700">
                ${Math.round(netEarnings).toLocaleString()}
                <span className="text-sm font-bold text-slate-500"> / month</span>
              </div>
              <p className="mt-1.5 text-xs font-semibold text-emerald-600">
                Net earnings transferred directly to your bank
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-5 text-left">
                <div className="rounded-xl bg-slate-50 p-3">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">
                    Gross Ticket Value
                  </span>
                  <span className="text-xs sm:text-sm font-black text-slate-800">
                    ${grossSales.toLocaleString()}
                  </span>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">
                    Estimated Annual
                  </span>
                  <span className="text-xs sm:text-sm font-black text-emerald-700">
                    ${Math.round(netEarnings * 12).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/supplier-portal/login?tab=register"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3.5 text-xs sm:text-sm font-black text-white shadow-lg transition hover:bg-emerald-800"
                >
                  Start Selling on Tourvaa <ArrowRight size={16} />
                </Link>
                <p className="mt-2.5 text-[11px] text-slate-400">
                  Calculated based on standard 10% marketplace commission. Zero
                  fixed fees.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. WHAT'S INCLUDED / OPERATOR FEATURES */}
      <section id="benefits" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 scroll-mt-36">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-black uppercase tracking-[.18em] text-emerald-700">
            Operator Capabilities
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950">
            Everything your tour operation needs to scale
          </h2>
          <p className="mt-2.5 text-xs sm:text-sm text-slate-600">
            From single-day walking tours to multi-day overland expeditions,
            manage all aspects of your supply chain in one place.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, badge, description }) => (
            <div
              key={title}
              className={`${styles.featureCard} group rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-900/5`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`${styles.icon} flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700`}
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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-emerald-300">
              <Zap size={13} /> Clear Process
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              From sign-up to your first booking payout
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-400">
              A transparent, streamlined onboarding process designed to get
              your tours bookable fast.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ step, icon: Icon, title, time, description }) => (
              <div
                key={title}
                className={`${styles.stepCard} relative rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400 text-xs sm:text-sm font-black text-emerald-950">
                    {step}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                    <Clock size={11} /> {time}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Icon size={17} className="text-emerald-400" />
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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-emerald-700">
            <ShieldCheck size={14} /> Verification Checklist
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950">
            What you will need for verification
          </h2>
          <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-500">
            You can upload these documents anytime after registering from the
            Verification tab in your extranet profile.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REQUIRED_DOCUMENTS.map(({ icon: Icon, title, badge, description }) => (
            <div
              key={title}
              className={`${styles.documentCard} flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-300 hover:shadow-lg`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Icon size={18} />
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-800">
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

          {/* Fast SLA Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-emerald-300 bg-emerald-50/60 p-5 sm:p-6">
            <div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white">
                <Clock size={18} />
              </span>
              <h3 className="mt-3.5 text-sm font-black text-emerald-950">
                Fast Approval Guarantee
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-emerald-800/80">
                Our verification desk checks submissions within 24-48 business
                hours. Have questions before uploading?
              </p>
            </div>
            <div className="mt-4 border-t border-emerald-200 pt-3">
              <Link
                href="/contact"
                className="text-xs font-black text-emerald-800 hover:underline inline-flex items-center gap-1"
              >
                Contact Compliance Desk <ArrowRight size={13} />
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
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
              Operational Standards
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-950">
              What we expect from Tourvaa partner suppliers
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              Clear guidelines to protect the traveller experience and ensure
              long-term partnership success.
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
                  className="mt-0.5 shrink-0 text-emerald-600"
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
            Common questions about payouts, commissions, integration, and
            support.
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
                    className={`shrink-0 text-emerald-700 transition-transform duration-200 ${
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
          className={`${styles.ctaGlow} pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-200/60 blur-3xl`}
        />
        <div className="relative rounded-[2rem] sm:rounded-[2.5rem] border border-emerald-200 bg-gradient-to-b from-white to-emerald-50/30 px-6 py-12 sm:py-16 shadow-2xl shadow-emerald-950/10 backdrop-blur-sm sm:px-12">
          <Sparkles className="mx-auto mb-3 text-emerald-600" size={26} />
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950">
            Ready to list your tours on Tourvaa?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-xs sm:text-sm leading-relaxed text-slate-600">
            Registration takes less than 5 minutes. Join hundreds of verified
            operators expanding their international customer base.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/supplier-portal/login?tab=register"
              className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-emerald-700 px-7 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-black text-white shadow-xl shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-emerald-800"
            >
              Become a Supplier <ArrowRight size={16} />
            </Link>
            <Link
              href="/supplier-portal/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-emerald-300 bg-white px-6 sm:px-7 py-3.5 sm:py-4 text-xs sm:text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
            >
              Already registered? Sign in
            </Link>
          </div>

          <div className="mt-7 flex items-center justify-center gap-5 sm:gap-6 text-[11px] sm:text-xs text-slate-400 font-semibold">
            <span>✓ No setup cost</span>
            <span>✓ Real-time bookings</span>
            <span>✓ Verified payouts</span>
          </div>
        </div>
      </section>
    </main>
  );
}
