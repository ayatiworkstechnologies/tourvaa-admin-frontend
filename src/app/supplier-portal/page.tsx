import Link from "next/link";
import type { Metadata } from "next";
import {
  LuArrowRight as ArrowRight,
  LuBadgeCheck as BadgeCheck,
  LuBuilding2 as Building,
  LuCalendarCheck as CalendarCheck,
  LuCircleCheckBig as CheckCircle2,
  LuFileCheck2 as FileCheck,
  LuFileText as FileText,
  LuGlobe as Globe,
  LuHeadset as Headset,
  LuLandmark as Landmark,
  LuLayoutDashboard as LayoutDashboard,
  LuShieldCheck as ShieldCheck,
  LuUserCheck as UserCheck,
  LuWallet as Wallet,
} from "react-icons/lu";
import { metadataFor } from "@/lib/seo/pageMetadata";

export const metadata: Metadata = metadataFor("/supplier-portal");

const BENEFITS = [
  { icon: Globe, title: "Reach travellers worldwide", description: "List your tours in front of travellers, agents, and affiliates browsing Tourvaa's global marketplace." },
  { icon: LayoutDashboard, title: "One dashboard for everything", description: "Manage inventory, availability, pricing, itineraries, and bookings from a single supplier portal." },
  { icon: Wallet, title: "Transparent payouts", description: "See exactly what you earn on every booking, with clear commission terms and scheduled payouts." },
  { icon: CalendarCheck, title: "Real-time bookings", description: "Get notified the moment a traveller books, with calendar and seat availability kept in sync automatically." },
  { icon: Headset, title: "Dedicated support", description: "A partner support team to help with onboarding, listings, and day-to-day booking questions." },
  { icon: ShieldCheck, title: "Verified marketplace", description: "Every supplier is verified before going live, which keeps traveller trust - and your bookings - high." },
] as const;

const STEPS = [
  { icon: UserCheck, title: "Create your account", description: "Register as a supplier with your business details and set up your login in a couple of minutes." },
  { icon: FileCheck, title: "Submit verification documents", description: "Upload the documents below so our team can verify your business." },
  { icon: BadgeCheck, title: "Get approved", description: "Our team reviews your submission, usually within a few business days, and approves your account." },
  { icon: Building, title: "List your tours & start earning", description: "Build your tour catalogue, open your calendar, and start receiving bookings and payouts." },
] as const;

const REQUIRED_DOCUMENTS = [
  { icon: FileText, title: "Company Registration Certificate", description: "Proof that your tour business is a legally registered entity." },
  { icon: Landmark, title: "Trade License", description: "A valid, current trade or tourism operating license for your business." },
  { icon: FileCheck, title: "Tax Registration Certificate", description: "Your business's tax registration (GST / VAT / TIN, as applicable)." },
  { icon: UserCheck, title: "Identity Proof", description: "A government-issued ID (passport or national ID) for the authorized signatory." },
  { icon: Wallet, title: "Bank Account Details", description: "Bank account details or a cancelled cheque, used to process your payouts." },
] as const;

const RULES = [
  "All tours you list must be accurate, currently bookable, and kept up to date - availability, pricing, and inclusions included.",
  "Your account and documents are reviewed by Tourvaa admin before you can publish tours or receive bookings.",
  "Booking requests should be confirmed or responded to promptly to protect the traveller experience.",
  "Payouts follow the commission and schedule agreed during onboarding, and are visible in your supplier dashboard at all times.",
  "Any changes to an already-published tour go through a review step before they go live, to keep listings accurate for travellers.",
] as const;

export default function SupplierPortalLandingPage() {
  return (
    <main className="bg-white text-slate-900">
      <section className="relative overflow-hidden bg-emerald-950 px-4 py-20 text-white sm:px-6">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-5xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur">
            <Building size={14} /> Tourvaa for Suppliers
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-[1.08] sm:text-5xl">
            Grow your tour business with Tourvaa
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/75">
            List your tours, manage bookings, and get paid - all from one supplier portal built for tour operators.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/supplier-portal/login?tab=register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-emerald-800 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Become a Supplier <ArrowRight size={16} />
            </Link>
            <Link
              href="/supplier-portal/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              Supplier Login
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-black uppercase tracking-[.16em] text-emerald-700">What&apos;s included</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Everything you need to sell tours online</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-6 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-[0_16px_40px_-28px_rgba(15,82,48,.5)]">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Icon size={20} />
              </span>
              <h3 className="mt-4 text-sm font-black text-slate-950">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-emerald-50/50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[.16em] text-emerald-700">How it works</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">From sign-up to your first booking</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, description }, index) => (
              <div key={title} className="relative rounded-2xl border border-emerald-100 bg-white p-6 shadow-[0_10px_30px_-25px_rgba(15,82,48,.6)]">
                <span className="absolute -top-3 -left-3 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-xs font-black text-white shadow">
                  {index + 1}
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Icon size={20} />
                </span>
                <h3 className="mt-4 text-sm font-black text-slate-950">{title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-black uppercase tracking-[.16em] text-emerald-700">Verification documents</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">What you&apos;ll need to get verified</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            You can upload these anytime after registering, from the Verification Documents tab in your supplier profile.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {REQUIRED_DOCUMENTS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_4px_rgba(15,23,42,.04)]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Icon size={18} />
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-950">{title}</h3>
                <p className="mt-1 text-xs leading-6 text-slate-500">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[.16em] text-emerald-400">Partner rules</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">What we expect from partner suppliers</h2>
          </div>
          <ul className="mx-auto mt-10 max-w-2xl space-y-4">
            {RULES.map((rule) => (
              <li key={rule} className="flex items-start gap-3 text-sm leading-6 text-white/80">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-black tracking-tight text-slate-950">Ready to list your tours?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
          Registration takes a few minutes. Your account is reviewed by our team once your documents are submitted.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/supplier-portal/login?tab=register"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-xl"
          >
            Become a Supplier <ArrowRight size={16} />
          </Link>
          <Link
            href="/supplier-portal/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-6 py-3.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
          >
            Already a supplier? Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
