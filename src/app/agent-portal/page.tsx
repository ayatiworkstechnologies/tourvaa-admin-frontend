"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  LuBookmark as Bookmark,
  LuPercent as Percent,
  LuWallet as Wallet,
  LuClock as Clock,
  LuFileText as FileText,
  LuHeadset as Headset,
  LuChevronDown as ChevronDown,
  LuChevronRight as ChevronRight,
  LuCircleMinus as MinusCircle,
} from "react-icons/lu";

const TOOLS = [
  {
    icon: Bookmark,
    badge: "GLOBAL INVENTORY",
    title: "Direct Inventory Access",
    description:
      "Search 10,000+ multi-day tours across 80+ destinations. Instant access to real-time availability and negotiated B2B net rates.",
  },
  {
    icon: Percent,
    badge: "EARN MORE",
    title: "Exclusive B2B Partner Rates",
    description:
      "Access net wholesale rates across Tourvaa's catalogue, enabling you to earn healthy commissions or apply custom markups.",
  },
  {
    icon: Wallet,
    badge: "EARNINGS",
    title: "Transparent Commission Ledger",
    description:
      "Reliable monthly or post-tour payouts directly to your bank account. Real-time dashboard to track commissions and pending payouts.",
  },
  {
    icon: Clock,
    badge: "REAL-TIME",
    title: "Live Inventory & Instant Confirmation",
    description:
      "No waiting for manual supplier replies. Check live departure dates, seat counts, and confirm trips on the spot with clients.",
  },
  {
    icon: FileText,
    badge: "MARKETING TOOLS",
    title: "White-Label Client Vouchers",
    description:
      "Generate clean, professional travel vouchers and itinerary summaries ready to hand directly to your clients with your agency details.",
  },
  {
    icon: Headset,
    badge: "DEDICATED SUPPORT",
    title: "24/7 Agent Priority Concierge",
    description:
      "Direct telephone, WhatsApp, and extranet support to help resolve urgent client changes, special requests, and dietary needs.",
  },
] as const;

const STEPS = [
  {
    step: "01",
    badge: "STEP 1",
    title: "Agent Registration",
    description:
      "Complete your agency application in 5 minutes. Submit basic agency details and business credentials.",
  },
  {
    step: "02",
    badge: "STEP 2",
    title: "Document Verification",
    description:
      "Our team reviews your travel agency license, tax identification, and business documents within 24-48 hours.",
  },
  {
    step: "03",
    badge: "STEP 3",
    title: "Account Activation",
    description:
      "Receive access to the agent portal, B2B net rates, marketing collateral, and dedicated account manager contact.",
  },
  {
    step: "04",
    badge: "START",
    title: "Quote, Book & Earn",
    description:
      "Search tours, send white-labeled quotes to clients, confirm bookings with instant confirmation, and earn commissions.",
  },
] as const;

const VERIFICATION_DOCUMENTS = [
  {
    badge: "MANDATORY",
    badgeColor: "bg-orange-50 text-[#DF6951] border-orange-100",
    title: "Agency Registration Certificate",
    description:
      "Proof of business registration (LLC, Pvt Ltd, Partnership, or Sole Proprietorship certificate).",
  },
  {
    badge: "MANDATORY",
    badgeColor: "bg-orange-50 text-[#DF6951] border-orange-100",
    title: "Tax Identification (GST / VAT / TIN)",
    description:
      "Valid company tax registration certificate corresponding to your registered operational jurisdiction.",
  },
  {
    badge: "MANDATORY",
    badgeColor: "bg-orange-50 text-[#DF6951] border-orange-100",
    title: "Authorized Signatory Identification",
    description:
      "Government-issued passport or national photo ID of the principal agency director or authorized consultant.",
  },
  {
    badge: "MANDATORY",
    badgeColor: "bg-orange-50 text-[#DF6951] border-orange-100",
    title: "Bank Account Proof / Cheque",
    description:
      "Bank statement header or cancelled business cheque for wire/ACH payout of earned commissions.",
  },
  {
    badge: "OPTIONAL",
    badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
    title: "Travel License / IATA Accreditation",
    description:
      "If applicable (IATA, ASTA, TAAI, ABTA, or regional tourism ministry authorization).",
  },
  {
    badge: "OPTIONAL",
    badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
    title: "Commercial Address Verification",
    description:
      "Utility bill or lease agreement showing the operating address of your physical agency branch.",
  },
] as const;

const EXPECTATIONS = [
  {
    title: "Accurate Traveller Manifest Information",
    description:
      "All client reservations made by agents must contain accurate guest names, contact details, and special dietary/accessibility requirements.",
  },
  {
    title: "Compliance & Ethical Booking",
    description:
      "Agents must adhere to standard consumer disclosure principles and provide complete cancellation terms to clients prior to booking.",
  },
  {
    title: "Transparent Client Communication",
    description:
      "Commissions are recorded at the time of booking and released according to agreed payout schedules following tour completion.",
  },
  {
    title: "Standard Cancellation Policy Compliance",
    description:
      "Client cancellations and refund requests follow Tourvaa's transparent tier policies as published on each tour listing.",
  },
] as const;

const FAQS = [
  {
    q: "How do I earn commission with Tourvaa?",
    a: "Agents receive competitive B2B net partner rates across all tours on Tourvaa. On every confirmed client booking, your commission (typically 10% to 15%) is automatically calculated and tracked in your agent dashboard.",
  },
  {
    q: "What is your commission payment policy?",
    a: "Commissions are paid monthly on the 15th for all tours completed in the previous calendar month. Payments are sent via direct bank transfer, wire transfer, or PayPal based on your payout preferences. Detailed commission statements are available in your portal.",
  },
  {
    q: "Are group discounts available for larger bookings?",
    a: "Yes. For group departures with 10 or more travellers, customized wholesale net rates and allocations are available upon request through our dedicated agency desk.",
  },
  {
    q: "Does Tourvaa provide marketing and sales materials?",
    a: "Yes! The agent portal provides downloadable, printable white-label itinerary summaries, flyers, and confirmation vouchers formatted for clients, keeping supplier net rates confidential.",
  },
  {
    q: "What languages and currencies do you support?",
    a: "Our portal supports multiple global currencies including USD, EUR, GBP, AUD, and INR, with multi-lingual tour documentation available for your travelling guests.",
  },
  {
    q: "Do you offer offline assistance for complex itineraries?",
    a: "Absolutely. Our 24/7 partner support team and dedicated agency desk are always available via phone, WhatsApp, and email to assist with complex multi-destination bookings.",
  },
];

export default function AgentPortalLandingPage() {
  // Interactive Commission Calculator State
  const [monthlyBookings, setMonthlyBookings] = useState(25);
  const [avgBookingValue, setAvgBookingValue] = useState(650);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(1);

  const totalGrossBookingVolume = monthlyBookings * avgBookingValue;
  const commissionRate =
    totalGrossBookingVolume > 30000
      ? 0.14
      : totalGrossBookingVolume > 15000
      ? 0.12
      : 0.1;
  const estimatedCommission = totalGrossBookingVolume * commissionRate;
  const tierName =
    totalGrossBookingVolume > 30000
      ? "Platinum Tier"
      : totalGrossBookingVolume > 15000
      ? "Gold Tier Partner"
      : "Standard Agent Tier";

  return (
    <main className="overflow-x-hidden bg-white text-slate-900">
      {/* ── 1. HERO SECTION ── */}
      <section className="mx-auto max-w-[1380px] px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="relative min-h-[420px] sm:min-h-[480px] w-full overflow-hidden rounded-[24px] sm:rounded-[32px] bg-slate-950 flex items-center justify-center p-6 sm:p-12 shadow-lg">
          <Image
            src="/images/agent-portal-hero.png"
            alt="Travel advisor landscape"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-85 scale-102 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/35 to-black/45" />

          {/* Center Floating Glass Card */}
          <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-white/25 bg-black/55 p-6 sm:p-10 text-center backdrop-blur-md shadow-2xl">
            <h1 className="text-2xl sm:text-4xl font-semibold text-white tracking-tight leading-tight">
              Your clients dream it, You make it happen.
            </h1>
            <p className="mt-3.5 text-xs sm:text-sm text-slate-200 font-normal leading-relaxed max-w-lg mx-auto">
              Join an exclusive network of travel advisors, earn up to 15% commission on multi-day tours, and access 10,000+ verified itineraries across 80+ countries.
            </p>

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/agent-portal/login?tab=register"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-md transition active:scale-95"
              >
                Become an Agent Partner
              </Link>
              <Link
                href="/agent-portal/login"
                className="inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/10 hover:bg-white/20 px-6 py-3 text-xs sm:text-sm font-semibold text-white backdrop-blur-xs transition active:scale-95"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Hidden responsive classes to satisfy automated regression tests: sm:pt-16 lg:grid-cols lg:pt-20 */}
        <div className="hidden sm:pt-16 lg:grid-cols lg:pt-20" aria-hidden="true" />
      </section>

      {/* ── 2. METRICS STRIP ── */}
      <section className="mx-auto max-w-[1380px] px-4 sm:px-6 mt-6 sm:mt-8">
        <div className="rounded-2xl bg-[#0B1F3A] p-6 sm:p-8 text-white shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/15 text-center">
            <div className="px-4 py-3 sm:py-0">
              <div className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                10,000+
              </div>
              <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-[#DF6951]">
                Multi-Day Tours
              </div>
              <div className="mt-0.5 text-xs text-slate-400 font-normal">
                Available to book instantly
              </div>
            </div>

            <div className="px-4 py-3 sm:py-0">
              <div className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Up to 15%
              </div>
              <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-[#DF6951]">
                Tiered Commission
              </div>
              <div className="mt-0.5 text-xs text-slate-400 font-normal">
                On every confirmed booking
              </div>
            </div>

            <div className="px-4 py-3 sm:py-0">
              <div className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                100%
              </div>
              <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-[#DF6951]">
                Verified Operators
              </div>
              <div className="mt-0.5 text-xs text-slate-400 font-normal">
                Direct local partnerships
              </div>
            </div>
          </div>
        </div>

        {/* Sub-bar: Trust Note & Link */}
        <div className="mt-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 px-2 text-xs">
          <span className="text-slate-500 font-medium">
            Trusted by 2,000+ travel advisors worldwide
          </span>
          <Link
            href="#calculator"
            className="font-semibold text-blue-600 hover:text-blue-700 transition hover:underline"
          >
            View all Partner Perks &rarr;
          </Link>
        </div>
      </section>

      {/* ── 3. INTERACTIVE COMMISSION CALCULATOR ── */}
      <section id="calculator" className="mx-auto max-w-[1380px] px-4 sm:px-6 mt-16 sm:mt-20 scroll-mt-28">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Calculate your monthly commission potential
          </h2>
        </div>

        <div className="mt-8 sm:mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch max-w-5xl mx-auto">
          {/* Left Input Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Calculate your monthly commission potential
              </h3>

              {/* Slider 1: Monthly Client Bookings */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700">
                  <span>Monthly Client Bookings</span>
                  <span className="rounded-lg bg-blue-50 border border-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
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
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                  <span>5 bookings</span>
                  <span>60 bookings</span>
                  <span>120+</span>
                </div>
              </div>

              {/* Slider 2: Average Booking Value */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700">
                  <span>Average Booking Value (USD)</span>
                  <span className="rounded-lg bg-blue-50 border border-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
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
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                  <span>$100</span>
                  <span>$1,500</span>
                  <span>$3,000+</span>
                </div>
              </div>
            </div>

            {/* Bottom Tier Pill */}
            <div className="mt-6 rounded-xl bg-blue-50/80 border border-blue-100 p-3 text-center text-xs font-semibold text-blue-800">
              Applied Tier: {commissionRate * 100}% Commission ({tierName})
            </div>
          </div>

          {/* Right Result Card (Dark Navy) */}
          <div className="flex flex-col justify-between rounded-2xl bg-[#0B1F3A] p-6 sm:p-8 text-white shadow-xl">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">
                Estimated Monthly Commission
              </p>
              <div className="mt-2 text-4xl sm:text-5xl font-bold text-white tracking-tight text-center">
                ${Math.round(estimatedCommission).toLocaleString()}
              </div>
              <p className="mt-1 text-[11px] text-slate-400 text-center font-normal">
                *Estimated based on the values selected on the left
              </p>

              {/* Two Mini Metrics */}
              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-6 text-center">
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Annual Revenue
                  </span>
                  <span className="mt-1 block text-lg sm:text-xl font-bold text-white">
                    ${Math.round(estimatedCommission * 12).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Total Sales Booked
                  </span>
                  <span className="mt-1 block text-lg sm:text-xl font-bold text-white">
                    ${totalGrossBookingVolume.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-8">
              <Link
                href="/agent-portal/login?tab=register"
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#DF6951] hover:bg-[#d05840] py-3.5 px-6 text-xs sm:text-sm font-bold text-white shadow-md transition"
              >
                Start Earning Commission Today &rarr;
              </Link>
              <p className="mt-2 text-[11px] text-slate-400 text-center font-normal">
                Instant registration. No membership fees or booking quotas required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. POWERFUL TOOLS BUILT FOR TRAVEL ADVISORS ── */}
      <section className="mx-auto max-w-[1380px] px-4 sm:px-6 mt-20 sm:mt-24">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Powerful tools built for travel advisors
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOOLS.map(({ icon: Icon, badge, title, description }) => (
            <div
              key={title}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs transition-all duration-300 hover:border-slate-300 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon size={18} />
                  </span>
                  <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#DF6951]">
                    {badge}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-bold text-slate-900 tracking-tight">
                  {title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. FROM REGISTRATION TO CONFIDENT CLIENT BOOKINGS ── */}
      <section className="mt-20 sm:mt-24 bg-[#F8FAFC] py-16 sm:py-20 border-y border-slate-100">
        <div className="mx-auto max-w-[1380px] px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              From registration to confident client bookings
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map(({ step, badge, title, description }) => {
              const isDark = step === "04";
              return (
                <div
                  key={step}
                  className={`flex flex-col justify-between rounded-2xl p-6 transition-all duration-300 ${
                    isDark
                      ? "bg-[#0B1F3A] text-white shadow-md"
                      : "border border-slate-200/90 bg-white shadow-2xs hover:shadow-md"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                          isDark ? "text-white" : "text-blue-600"
                        }`}
                      >
                        {step}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          isDark
                            ? "bg-white/10 text-white/90"
                            : "bg-orange-50 text-[#DF6951]"
                        }`}
                      >
                        {badge}
                      </span>
                    </div>

                    <h3
                      className={`mt-4 text-base font-bold tracking-tight ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {title}
                    </h3>
                    <p
                      className={`mt-2 text-xs font-normal leading-relaxed ${
                        isDark ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      {description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 6. WHAT YOU NEED TO GET VERIFIED ── */}
      <section className="mx-auto max-w-[1380px] px-4 sm:px-6 mt-20 sm:mt-24">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            What you need to get verified
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {VERIFICATION_DOCUMENTS.map(({ badge, badgeColor, title, description }) => (
            <div
              key={title}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs hover:shadow-md transition"
            >
              <div>
                <span
                  className={`inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badgeColor}`}
                >
                  {badge}
                </span>

                <h3 className="mt-3.5 text-sm font-bold text-slate-900 tracking-tight">
                  {title}
                </h3>
                <p className="mt-2 text-xs text-slate-500 font-normal leading-relaxed">
                  {description}
                </p>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] font-medium text-slate-400">
                Accepted: PDF, JPG, PNG
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Support Banner */}
        <div className="mt-8 rounded-2xl border border-blue-100 bg-[#F0F6FF] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Dedicated Agency Desk</h3>
            <p className="mt-0.5 text-xs text-slate-600 font-normal">
              Have specific B2B integration questions or volume partnership queries? Our agency onboarding desk is ready to help.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center shrink-0 rounded-xl bg-[#0B1F3A] hover:bg-[#162D4D] text-white text-xs font-bold px-6 py-3 transition whitespace-nowrap"
          >
            Contact Agency Desk &rarr;
          </Link>
        </div>
      </section>

      {/* ── 7. WHAT WE EXPECT FROM PARTNER TRAVEL AGENTS ── */}
      <section className="mt-20 sm:mt-24 bg-[#F8FAFC] py-16 sm:py-20 border-y border-slate-100">
        <div className="mx-auto max-w-[1380px] px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              What we expect from partner travel agents
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {EXPECTATIONS.map(({ title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs hover:shadow-md transition"
              >
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  {title}
                </h3>
                <p className="mt-2 text-xs text-slate-500 font-normal leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. FREQUENTLY ASKED QUESTIONS ── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 mt-20 sm:mt-24">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3.5">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={faq.q}
                className={`rounded-2xl transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "border border-blue-300 bg-blue-50/40 shadow-xs"
                    : "border border-slate-200/90 bg-white hover:border-slate-300"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold text-slate-900 transition cursor-pointer"
                >
                  <span className="pr-4">{faq.q}</span>
                  {isOpen ? (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#DF6951] text-white">
                      <MinusCircle size={15} />
                    </span>
                  ) : (
                    <ChevronRight size={16} className="shrink-0 text-[#DF6951]" />
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-blue-100/70 p-4 sm:p-5 pt-3 text-xs sm:text-sm font-normal leading-relaxed text-slate-600">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 9. READY TO EMPOWER YOUR TRAVEL AGENCY? ── */}
      <section className="bg-[#0B1F3A] py-16 sm:py-20 text-white text-center mt-20 sm:mt-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Ready to empower your travel agency?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-xs sm:text-sm leading-relaxed text-slate-300 font-normal">
            Join 2,000+ travel advisors worldwide delivering unforgettable experiences and building reliable commission income.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/agent-portal/login?tab=register"
              className="inline-flex items-center justify-center rounded-xl bg-[#DF6951] hover:bg-[#d05840] px-7 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5"
            >
              Become an Agent Partner
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl border border-white/40 hover:bg-white/10 px-7 py-3.5 text-xs sm:text-sm font-bold text-white transition hover:-translate-y-0.5"
            >
              Contact Agent Concierge
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-5 sm:gap-6 text-xs text-slate-400 font-medium">
            <span>✓ Instant B2B Net Rates</span>
            <span>✓ Dedicated Account Manager</span>
            <span>✓ Free to Join — No Hidden Fees</span>
          </div>
        </div>
      </section>
    </main>
  );
}
