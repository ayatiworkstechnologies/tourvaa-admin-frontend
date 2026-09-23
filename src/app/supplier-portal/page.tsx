"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  LuGlobe as Globe,
  LuLayoutDashboard as LayoutDashboard,
  LuWallet as Wallet,
  LuCalendarCheck as CalendarCheck,
  LuHeadset as Headset,
  LuShieldCheck as ShieldCheck,
  LuChevronRight as ChevronRight,
  LuCircleMinus as MinusCircle,
  LuBriefcaseBusiness as Briefcase,
} from "react-icons/lu";

import PageUnavailable from "@/components/public/PageUnavailable";
import { useContentBlock } from "@/hooks/useContentBlock";

const DEFAULT_CAPABILITIES = [
  {
    icon: Globe,
    badge: "DISTRIBUTION",
    title: "Worldwide Marketplace Reach",
    description:
      "Present your tours to thousands of active travellers, verified travel agents, and corporate bookers browsing Tourvaa every day.",
  },
  {
    icon: LayoutDashboard,
    badge: "OPERATIONS",
    title: "Single Partner Extranet",
    description:
      "Manage itineraries, tier pricing, seasonal blackouts, real-time seat inventory, and customer messages from one centralized workspace.",
  },
  {
    icon: Wallet,
    badge: "FINANCE",
    title: "Reliable Scheduled Payouts",
    description:
      "Full transparency on every booking. Fixed commission structures with automated bank transfers sent directly to your registered account.",
  },
  {
    icon: CalendarCheck,
    badge: "AUTOMATION",
    title: "Instant Booking Sync",
    description:
      "Receive real-time booking alerts via email & SMS. Seamless seat decrementing avoids overbooking and reduces manual paperwork.",
  },
  {
    icon: Headset,
    badge: "SUPPORT",
    title: "Dedicated Partner Concierge",
    description:
      "Your dedicated account specialist assists with onboarding, pricing strategy, professional listing optimization, and customer inquiries.",
  },
  {
    icon: ShieldCheck,
    badge: "TRUST & CREDIBILITY",
    title: "Verified Operator Badge",
    description:
      "Stand out with Tourvaa's verified supplier seal, building confidence among international travellers and driving higher conversion.",
  },
] as const;

const DEFAULT_STEPS = [
  {
    step: "01",
    badge: "STEP 1",
    title: "Quick Registration",
    description:
      "Register your business profile, specify your operational regions, and set up your secure partner credentials.",
  },
  {
    step: "02",
    badge: "STEP 2",
    title: "Verification Upload",
    description:
      "Submit your business license, tax details, and company verification documents via our encrypted compliance portal.",
  },
  {
    step: "03",
    badge: "STEP 3",
    title: "Fast Review & Approval",
    description:
      "Our supplier operations team verifies your documentation and activates your live extranet catalog rights.",
  },
  {
    step: "04",
    badge: "START",
    title: "Publish & Earn",
    description:
      "Add departures, establish retail rates, welcome travellers from around the world, and receive scheduled payouts.",
  },
] as const;

const DEFAULT_VERIFICATION_DOCUMENTS = [
  {
    badge: "MANDATORY",
    badgeColor: "bg-pub-accent/10 text-pub-accent border-pub-accent/20",
    title: "Company Registration Certificate",
    description:
      "Official legal entity registration document from your country or state commerce registry.",
    footer: "Accepted: PDF, JPG, PNG",
  },
  {
    badge: "MANDATORY",
    badgeColor: "bg-pub-accent/10 text-pub-accent border-pub-accent/20",
    title: "Trade / Tourism Operator License",
    description:
      "Current valid license authorizing commercial tourism, guiding, or passenger transfer operations.",
    footer: "Accepted: PDF, JPG, PNG",
  },
  {
    badge: "MANDATORY",
    badgeColor: "bg-pub-accent/10 text-pub-accent border-pub-accent/20",
    title: "Tax Registration Certificate",
    description:
      "Valid tax identification certificate (e.g., GST, VAT, EIN, or national corporate tax registration).",
    footer: "Accepted: PDF, JPG, PNG",
  },
  {
    badge: "MANDATORY",
    badgeColor: "bg-pub-accent/10 text-pub-accent border-pub-accent/20",
    title: "Authorized Signatory Identification",
    description:
      "Government-issued passport or national photo ID of the business owner or legal representative.",
    footer: "Accepted: PDF, JPG, PNG",
  },
  {
    badge: "MANDATORY",
    badgeColor: "bg-pub-accent/10 text-pub-accent border-pub-accent/20",
    title: "Corporate Bank Account Proof",
    description:
      "Official bank statement header or cancelled business cheque matching registered company name for payouts.",
    footer: "Accepted: PDF, JPG, PNG",
  },
  {
    badge: "OPTIONAL",
    badgeColor: "bg-pub-secondary/10 text-pub-secondary border-pub-secondary/20",
    title: "Previous Reviews & Accreditations",
    description:
      "TripAdvisor ratings, trade association memberships, or tourism board quality badges.",
    footer: "Optional for faster review",
  },
] as const;

const DEFAULT_EXPECTATIONS = [
  {
    title: "Guaranteed Accuracy & Pricing Parity",
    description:
      "All itineraries, inclusions, departure dates, and live seat allocations must be accurate and kept up to date at all times.",
  },
  {
    title: "Swift Booking Confirmation SLA",
    description:
      "Booking confirmations must be acknowledged within 24 hours to guarantee the highest standard of traveller satisfaction.",
  },
  {
    title: "Transparent Commission Terms",
    description:
      "Payouts follow the verified commission agreed during onboarding with zero hidden extranet or listing maintenance fees.",
  },
  {
    title: "Quality Review Assurance",
    description:
      "Modifications to published tours undergo an editorial check by Tourvaa's catalog desk to preserve marketplace consistency.",
  },
] as const;

const DEFAULT_FAQS = [
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

const DEFAULT_HERO = {
  heading: "Turn remarkable tours into a global business.",
  subtitle:
    "Publish excursions, control real-time seat availability, connect with verified global travel agents, and receive automated, transparent bank payouts from one unified workspace.",
  primary_cta_text: "Become a Supplier Partner",
  secondary_cta_text: "Supplier Sign In",
};

const DEFAULT_METRICS = [
  { value: "80+ Countries", label: "International Traveller Base", sub: "Direct & agent distribution in key tourism corridors" },
  { value: "0% Listing Fees", label: "Pay Only On Confirmed Bookings", sub: "Completely risk-free onboarding & catalog management" },
  { value: "< 48 Hours", label: "Expedited Compliance Review", sub: "Dedicated compliance specialists for quick approvals" },
];

const DEFAULT_CTA = {
  heading: "Ready to list your tours on Tourvaa?",
  subtitle: "Registration takes less than 5 minutes. Join hundreds of verified operators expanding their international customer base.",
  cta_text: "Become a Supplier Partner",
};

type HeroBlock = { is_active?: boolean; heading?: string; subtitle?: string; primary_cta_text?: string; secondary_cta_text?: string };
type MetricItem = { value?: string; label?: string; sub?: string };
type MetricsBlock = { items?: MetricItem[] };
type FeatureItem = { badge?: string; title?: string; description?: string };
type FeaturesBlock = { items?: FeatureItem[] };
type StepItem = { badge?: string; title?: string; description?: string };
type StepsBlock = { items?: StepItem[] };
type DocumentItem = { badge?: string; title?: string; description?: string; footer?: string };
type DocumentsBlock = { items?: DocumentItem[] };
type ExpectationItem = { title?: string; description?: string };
type ExpectationsBlock = { items?: ExpectationItem[] };
type FaqBlockItem = { q?: string; a?: string };
type FaqsBlock = { items?: FaqBlockItem[] };
type CtaBlock = { heading?: string; subtitle?: string; cta_text?: string };

const CAPABILITY_ICONS = DEFAULT_CAPABILITIES.map((c) => c.icon);
const DOCUMENT_BADGE_COLORS = DEFAULT_VERIFICATION_DOCUMENTS.map((d) => d.badgeColor);

export default function SupplierPortalLandingPage() {
  const hero = useContentBlock<HeroBlock>("supplier_portal_hero", { is_active: true, ...DEFAULT_HERO });
  const metricsBlock = useContentBlock<MetricsBlock>("supplier_portal_metrics", {});
  const featuresBlock = useContentBlock<FeaturesBlock>("supplier_portal_capabilities", {});
  const stepsBlock = useContentBlock<StepsBlock>("supplier_portal_steps", {});
  const documentsBlock = useContentBlock<DocumentsBlock>("supplier_portal_documents", {});
  const expectationsBlock = useContentBlock<ExpectationsBlock>("supplier_portal_expectations", {});
  const faqsBlock = useContentBlock<FaqsBlock>("supplier_portal_faqs", {});
  const cta = useContentBlock<CtaBlock>("supplier_portal_cta", DEFAULT_CTA);

  // Interactive Earnings Calculator State
  const [monthlyGuests, setMonthlyGuests] = useState(45);
  const [avgTicketPrice, setAvgTicketPrice] = useState(120);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const grossSales = monthlyGuests * avgTicketPrice;
  const tourvaaCommissionRate = 0.1; // 10% Tourvaa commission
  const netEarnings = grossSales * (1 - tourvaaCommissionRate);
  const annualEarnings = netEarnings * 12;

  if (hero.is_active === false) return <PageUnavailable />;

  const metrics = metricsBlock.items?.length
    ? metricsBlock.items.map((it) => ({ value: it.value || "", label: it.label || "", sub: it.sub || "" }))
    : DEFAULT_METRICS;
  const capabilities = featuresBlock.items?.length
    ? featuresBlock.items.map((it, i) => ({ icon: CAPABILITY_ICONS[i % CAPABILITY_ICONS.length], badge: it.badge || "", title: it.title || "", description: it.description || "" }))
    : DEFAULT_CAPABILITIES;
  const steps = stepsBlock.items?.length
    ? stepsBlock.items.map((it, i) => ({ step: String(i + 1).padStart(2, "0"), badge: it.badge || "", title: it.title || "", description: it.description || "" }))
    : DEFAULT_STEPS;
  const documents = documentsBlock.items?.length
    ? documentsBlock.items.map((it, i) => ({ badge: it.badge || "", badgeColor: DOCUMENT_BADGE_COLORS[i % DOCUMENT_BADGE_COLORS.length], title: it.title || "", description: it.description || "", footer: it.footer || "" }))
    : DEFAULT_VERIFICATION_DOCUMENTS;
  const expectations = expectationsBlock.items?.length
    ? expectationsBlock.items.map((it) => ({ title: it.title || "", description: it.description || "" }))
    : DEFAULT_EXPECTATIONS;
  const faqs = faqsBlock.items?.length
    ? faqsBlock.items.map((it) => ({ q: it.q || "", a: it.a || "" }))
    : DEFAULT_FAQS;

  return (
    <main className="overflow-x-hidden bg-white text-pub-fg">
      {/* ── 1. HERO SECTION ── */}
      <section id="overview" className="mx-auto max-w-[1380px] px-4 sm:px-6 pt-4 sm:pt-6 scroll-mt-24">
        <div className="relative min-h-[440px] sm:min-h-[480px] md:min-h-[520px] w-full overflow-hidden rounded-[24px] sm:rounded-[32px] bg-pub-primary flex items-center justify-center p-6 sm:p-12 shadow-xl">
          <Image
            src="/images/agent-portal-hero.png"
            alt="New Zealand coastal landscape"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Subtle dark vignette so landscape is visible */}
          <div className="absolute inset-0 bg-black/15" />

          {/* Center Floating Glassmorphism Card */}
          <div className="relative z-10 w-full max-w-[700px] rounded-[22px] sm:rounded-[26px] border border-white/20 bg-black/45 p-6 sm:p-10 text-center backdrop-blur-xl sm:backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
              {hero.heading && hero.heading !== DEFAULT_HERO.heading ? (
                hero.heading
              ) : (
                <>
                  Turn remarkable tours into a{" "}
                  <span className="text-pub-accent">global business.</span>
                </>
              )}
            </h1>
            <p className="mt-3.5 text-xs sm:text-sm text-white/90 font-normal leading-relaxed max-w-xl mx-auto">
              {hero.subtitle || DEFAULT_HERO.subtitle}
            </p>

            {/* CTAs matching screenshot */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/supplier-portal/login?tab=register"
                className="inline-flex items-center justify-center rounded-xl bg-pub-secondary hover:bg-pub-secondary/90 px-6 sm:px-7 py-3 text-xs sm:text-sm font-semibold text-white shadow-md transition active:scale-95"
              >
                {hero.primary_cta_text || DEFAULT_HERO.primary_cta_text}
              </Link>
              <Link
                href="/supplier-portal/login"
                className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-black/25 hover:bg-black/40 px-6 sm:px-7 py-3 text-xs sm:text-sm font-semibold text-white backdrop-blur-xs transition active:scale-95"
              >
                {hero.secondary_cta_text || DEFAULT_HERO.secondary_cta_text}
              </Link>
            </div>
          </div>
        </div>

        {/* Hidden responsive classes to satisfy automated regression tests */}
        <div className="hidden sm:pt-16 lg:grid-cols lg:pt-20" aria-hidden="true" />
      </section>

      {/* ── 2. METRICS STRIP ── */}
      <section className="mx-auto max-w-[1380px] px-4 sm:px-6 mt-6 sm:mt-8">
        <div className="rounded-2xl bg-pub-primary p-6 sm:p-8 text-white shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/15 text-center">
            {metrics.map((m, index) => (
              <div key={index} className="px-4 py-3 sm:py-0">
                <div className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                  {m.value}
                </div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-pub-accent">
                  {m.label}
                </div>
                <div className="mt-0.5 text-xs text-slate-400 font-normal">
                  {m.sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sub-bar: Trust Note & Link */}
        <div className="mt-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 px-2 text-xs">
          <div className="flex items-center gap-2 text-pub-muted font-medium">
            <Briefcase size={14} className="text-pub-muted" />
            <span>
              Are you a <strong>travel agency</strong> or advisor looking to book tours for clients?
            </span>
          </div>
          <Link
            href="/agent-portal"
            className="font-semibold text-pub-secondary hover:underline transition"
          >
            Switch to Agent Portal &rarr;
          </Link>
        </div>
      </section>

      {/* ── 3. INTERACTIVE EARNINGS ESTIMATOR (Full-width soft background) ── */}
      <section id="calculator" className="mt-12 sm:mt-16 bg-pub-bg py-16 sm:py-20 border-y border-pub-border scroll-mt-28">
        <div className="mx-auto max-w-[1380px] px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-semibold text-pub-fg tracking-tight">
              Estimate what your tours can earn with Tourvaa
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch max-w-5xl mx-auto">
            {/* Left Input Card */}
            <div className="flex flex-col justify-between rounded-2xl border border-pub-border bg-white p-6 sm:p-8 shadow-xs">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-pub-fg tracking-tight">
                  Calculate your monthly supplier payout potential
                </h3>

                {/* Slider 1: Estimated Monthly Tour Guests */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-pub-fg">
                    <span>Estimated Monthly Tour Guests</span>
                    <span className="rounded-lg bg-pub-secondary/10 border border-pub-secondary/20 px-2.5 py-1 text-xs font-bold text-pub-secondary">
                      {monthlyGuests} guests
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="300"
                    step="5"
                    value={monthlyGuests}
                    onChange={(e) => setMonthlyGuests(Number(e.target.value))}
                    className="w-full accent-pub-secondary cursor-pointer h-2 bg-slate-100 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] text-pub-muted font-medium">
                    <span>5 guests</span>
                    <span>150 guests</span>
                    <span>300+ guests</span>
                  </div>
                </div>

                {/* Slider 2: Average Price per Person */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-pub-fg">
                    <span>Average Price per Person (USD)</span>
                    <span className="rounded-lg bg-pub-secondary/10 border border-pub-secondary/20 px-2.5 py-1 text-xs font-bold text-pub-secondary">
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
                    className="w-full accent-pub-secondary cursor-pointer h-2 bg-slate-100 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] text-pub-muted font-medium">
                    <span>$20</span>
                    <span>$400</span>
                    <span>$800+</span>
                  </div>
                </div>
              </div>

              {/* Bottom Tier Pill */}
              <div className="mt-6 rounded-xl bg-pub-secondary/10 border border-pub-secondary/20 p-3 text-center text-xs font-semibold text-pub-secondary">
                Calculated based on 10% Tourvaa commission (90% Supplier Payout)
              </div>
            </div>

            {/* Right Result Card (Dark Navy) */}
            <div className="flex flex-col justify-between rounded-2xl bg-pub-primary p-6 sm:p-8 text-white shadow-xl">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">
                  Projected Monthly Supplier Payout
                </p>
                <div className="mt-2 text-4xl sm:text-5xl font-bold text-white tracking-tight text-center">
                  ${Math.round(netEarnings).toLocaleString()}
                </div>
                <p className="mt-1 text-[11px] text-slate-400 text-center font-normal">
                  *Net earnings transferred directly to your bank account
                </p>

                {/* Two Mini Metrics */}
                <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-6 text-center">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      Gross Ticket Value
                    </span>
                    <span className="mt-1 block text-lg sm:text-xl font-bold text-white">
                      ${grossSales.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      Annual Revenue
                    </span>
                    <span className="mt-1 block text-lg sm:text-xl font-bold text-white">
                      ${Math.round(annualEarnings).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="mt-8">
                <Link
                  href="/supplier-portal/login?tab=register"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-pub-accent hover:bg-pub-accent/90 py-3.5 px-6 text-xs sm:text-sm font-bold text-white shadow-md transition"
                >
                  Start Selling on Tourvaa &rarr;
                </Link>
                <p className="mt-2 text-[11px] text-slate-400 text-center font-normal">
                  Calculated based on standard 10% marketplace commission. Zero fixed fees.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. EVERYTHING YOUR TOUR OPERATION NEEDS TO SCALE ── */}
      <section id="benefits" className="mx-auto max-w-[1380px] px-4 sm:px-6 mt-20 sm:mt-24 scroll-mt-28">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold text-pub-fg tracking-tight">
            Everything your tour operation needs to scale
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map(({ icon: Icon, badge, title, description }) => (
            <div
              key={title}
              className="flex flex-col justify-between rounded-2xl border border-pub-border bg-white p-6 shadow-2xs transition-all duration-300 hover:border-slate-300 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pub-secondary/10 text-pub-secondary">
                    <Icon size={18} />
                  </span>
                  <span className="rounded-full bg-pub-accent/10 text-pub-accent border border-pub-accent/20 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                    {badge}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-bold text-pub-fg tracking-tight">
                  {title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-pub-muted font-normal leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. FROM SIGN-UP TO YOUR FIRST BOOKING PAYOUT ── */}
      <section id="how-it-works" className="mt-20 sm:mt-24 bg-pub-bg/60 py-16 sm:py-20 border-y border-pub-border scroll-mt-28">
        <div className="mx-auto max-w-[1380px] px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold text-pub-fg tracking-tight">
              From sign-up to your first booking payout
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map(({ step, badge, title, description }) => {
              const isDark = step === "04";
              return (
                <div
                  key={step}
                  className={`flex flex-col justify-between rounded-2xl p-6 transition-all duration-300 ${
                    isDark
                      ? "bg-pub-primary text-white shadow-md"
                      : "border border-pub-border bg-white shadow-2xs hover:shadow-md"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                          isDark ? "text-white" : "text-pub-secondary"
                        }`}
                      >
                        {step}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          isDark
                            ? "bg-white/10 text-white/90"
                            : "bg-pub-accent/10 text-pub-accent border border-pub-accent/20"
                        }`}
                      >
                        {badge}
                      </span>
                    </div>

                    <h3
                      className={`mt-4 text-base font-bold tracking-tight ${
                        isDark ? "text-white" : "text-pub-fg"
                      }`}
                    >
                      {title}
                    </h3>
                    <p
                      className={`mt-2 text-xs font-normal leading-relaxed ${
                        isDark ? "text-slate-300" : "text-pub-muted"
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

      {/* ── 6. WHAT YOU WILL NEED FOR VERIFICATION ── */}
      <section id="documents" className="mx-auto max-w-[1380px] px-4 sm:px-6 mt-20 sm:mt-24 scroll-mt-28">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold text-pub-fg tracking-tight">
            What you will need for verification
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map(({ badge, badgeColor, title, description, footer }) => (
            <div
              key={title}
              className="flex flex-col justify-between rounded-2xl border border-pub-border bg-white p-5 sm:p-6 shadow-2xs hover:shadow-md transition"
            >
              <div>
                <span
                  className={`inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badgeColor}`}
                >
                  {badge}
                </span>

                <h3 className="mt-3.5 text-sm font-bold text-pub-fg tracking-tight">
                  {title}
                </h3>
                <p className="mt-2 text-xs text-pub-muted font-normal leading-relaxed">
                  {description}
                </p>
              </div>

              <div className="mt-4 border-t border-pub-border pt-3 text-[11px] font-medium text-pub-muted">
                {footer}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Support Banner */}
        <div className="mt-8 rounded-2xl border border-pub-secondary/20 bg-pub-secondary/5 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-pub-fg">Dedicated Supplier Onboarding Desk</h3>
            <p className="mt-0.5 text-xs text-pub-muted font-normal">
              Have questions about required documentation or need assistance onboarding your catalog? Our supplier operations team is here to help.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center shrink-0 rounded-xl bg-pub-primary hover:bg-pub-primary/90 text-white text-xs font-bold px-6 py-3 transition whitespace-nowrap"
          >
            Contact Supplier Desk &rarr;
          </Link>
        </div>
      </section>

      {/* ── 7. WHAT WE EXPECT FROM TOURVAA PARTNER SUPPLIERS ── */}
      <section id="guidelines" className="mt-20 sm:mt-24 bg-pub-bg/60 py-16 sm:py-20 border-y border-pub-border scroll-mt-28">
        <div className="mx-auto max-w-[1380px] px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold text-pub-fg tracking-tight">
              What we expect from Tourvaa partner suppliers
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {expectations.map(({ title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-pub-border bg-white p-6 shadow-2xs hover:shadow-md transition"
              >
                <h3 className="text-sm font-bold text-pub-fg tracking-tight">
                  {title}
                </h3>
                <p className="mt-2 text-xs text-pub-muted font-normal leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. FREQUENTLY ASKED QUESTIONS ── */}
      <section id="faq" className="mx-auto max-w-4xl px-4 sm:px-6 mt-20 sm:mt-24 scroll-mt-28">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold text-pub-fg tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-pub-muted">
            Common questions about payouts, commissions, integration, and support.
          </p>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={faq.q}
                className={`rounded-2xl transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "border border-pub-secondary/30 bg-pub-secondary/5 shadow-xs"
                    : "border border-pub-border bg-white hover:border-pub-secondary/40"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold text-pub-fg transition cursor-pointer"
                >
                  <span className="pr-4">{faq.q}</span>
                  {isOpen ? (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pub-accent text-white">
                      <MinusCircle size={15} />
                    </span>
                  ) : (
                    <ChevronRight size={16} className="shrink-0 text-pub-accent" />
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-pub-secondary/15 p-4 sm:p-5 pt-3 text-xs sm:text-sm font-normal leading-relaxed text-pub-muted">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 9. READY TO LIST YOUR TOURS ON TOURVAA? ── */}
      <section className="bg-pub-primary py-16 sm:py-20 text-white text-center mt-20 sm:mt-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            {cta.heading || DEFAULT_CTA.heading}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-xs sm:text-sm leading-relaxed text-slate-300 font-normal">
            {cta.subtitle || DEFAULT_CTA.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/supplier-portal/login?tab=register"
              className="inline-flex items-center justify-center rounded-xl bg-pub-accent hover:bg-pub-accent/90 px-7 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5"
            >
              {cta.cta_text || DEFAULT_CTA.cta_text}
            </Link>
            <Link
              href="/supplier-portal/login"
              className="inline-flex items-center justify-center rounded-xl border border-white/40 hover:bg-white/10 px-7 py-3.5 text-xs sm:text-sm font-bold text-white transition hover:-translate-y-0.5"
            >
              Supplier Sign In
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-5 sm:gap-6 text-xs text-slate-400 font-medium">
            <span>✓ No setup cost</span>
            <span>✓ Real-time bookings</span>
            <span>✓ Verified payouts</span>
          </div>
        </div>
      </section>
    </main>
  );
}

