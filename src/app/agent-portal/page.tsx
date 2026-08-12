import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  LuArrowRight as ArrowRight,
  LuBadgeCheck as BadgeCheck,
  LuBriefcaseBusiness as Briefcase,
  LuCalendarCheck as CalendarCheck,
  LuCircleCheckBig as CheckCircle2,
  LuFileCheck2 as FileCheck,
  LuFileText as FileText,
  LuLandmark as Landmark,
  LuLayoutDashboard as LayoutDashboard,
  LuSparkles as Sparkles,
  LuTicket as Ticket,
  LuUserCheck as UserCheck,
  LuUsers as Users,
  LuWallet as Wallet,
} from "react-icons/lu";
import { metadataFor } from "@/lib/seo/pageMetadata";
import styles from "@/components/public/PartnerPortalLanding.module.css";

export const metadata: Metadata = metadataFor("/agent-portal");

const BENEFITS = [
  { icon: Users, title: "Book on behalf of clients", description: "Search, quote, and book tours for your customers directly from your agent dashboard." },
  { icon: Wallet, title: "Track your commissions", description: "See what you've earned on every booking, with clear commission terms and payout history." },
  { icon: LayoutDashboard, title: "One dashboard for everything", description: "Manage customers, bookings, and earnings from a single agent portal." },
  { icon: CalendarCheck, title: "Real-time availability", description: "Check live tour availability and confirm bookings for clients instantly." },
  { icon: Ticket, title: "Access to partner rates", description: "Book at agent pricing across Tourvaa's tour catalogue." },
  { icon: BadgeCheck, title: "Verified partner network", description: "Every agent is verified before going live, which keeps supplier and traveller trust high." },
] as const;

const STEPS = [
  { icon: UserCheck, title: "Create your account", description: "Register as a travel agent with your business details and set up your login in a couple of minutes." },
  { icon: FileCheck, title: "Submit verification documents", description: "Upload the documents below so our team can verify your business." },
  { icon: BadgeCheck, title: "Get approved", description: "Our team reviews your submission, usually within a few business days, and approves your account." },
  { icon: Briefcase, title: "Start booking for clients", description: "Search tours, quote clients, and book with agent pricing - track it all from your dashboard." },
] as const;

const REQUIRED_DOCUMENTS = [
  { icon: FileText, title: "Business Registration Certificate", description: "Proof that your travel agency is a legally registered entity.", required: true },
  { icon: FileCheck, title: "Tax Registration (GST / VAT / TIN)", description: "Your business's applicable tax registration.", required: true },
  { icon: UserCheck, title: "Owner / Authorized Signatory ID", description: "A government-issued ID for the owner or authorized signatory.", required: true },
  { icon: Wallet, title: "Bank Proof / Cancelled Cheque", description: "Used to process your commission payouts.", required: true },
  { icon: Landmark, title: "Travel License / IATA Accreditation", description: "If applicable to your agency.", required: false },
  { icon: FileText, title: "Business Address Proof", description: "If applicable to your agency.", required: false },
] as const;

const RULES = [
  "Bookings made on behalf of clients must use accurate traveller details at the time of booking.",
  "Your account and documents are reviewed by Tourvaa admin before you can book at agent pricing.",
  "Commission terms are agreed during onboarding and stay visible in your agent dashboard at all times.",
  "Client payment collection and refund requests follow Tourvaa's standard booking and cancellation policy.",
] as const;

export default function AgentPortalLandingPage() {
  return (
    <main className="overflow-hidden bg-white text-slate-900">
      <section className="relative isolate min-h-[720px] overflow-hidden bg-indigo-950 text-white">
        <Image src="/images/agent-portal-hero.png" alt="Travel agent planning a holiday with clients" fill priority sizes="100vw" className={`${styles.heroImage} object-cover object-[64%_center]`} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(22,20,72,.99)_0%,rgba(30,27,95,.91)_35%,rgba(30,27,95,.4)_68%,rgba(30,27,95,.1)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(22,20,72,.74)_0%,transparent_42%)]" />
        <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="relative mx-auto grid min-h-[720px] max-w-7xl items-center px-5 py-24 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.72fr)] lg:px-12">
          <div className={`${styles.heroCopy} max-w-2xl`}>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur">
            <Briefcase size={14} /> Tourvaa for Agents
          </span>
          <h1 className="mt-7 text-4xl font-black leading-[1.02] tracking-[-.04em] sm:text-6xl lg:text-7xl">
            Your clients dream it. <span className="text-indigo-300">You make it happen.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg">
            Discover remarkable tours, build confident itineraries, book for every client, and see commissions clearly in one partner workspace.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/agent-portal/login?tab=register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-indigo-800 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Become an Agent Partner <ArrowRight size={16} />
            </Link>
            <Link
              href="/agent-portal/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              Agent Login
            </Link>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-xs font-semibold text-white/70">
            {["Partner tour rates", "Live availability", "Transparent commissions"].map((item) => <span key={item} className="flex items-center gap-2"><CheckCircle2 size={15} className="text-indigo-300" />{item}</span>)}
          </div>
          </div>
          <div className="relative hidden h-full lg:block">
            <div className={`${styles.floatCard} absolute bottom-28 right-0 w-72 rounded-3xl border border-white/20 bg-white/90 p-5 text-slate-900 shadow-2xl shadow-indigo-950/40 backdrop-blur-xl`}>
              <div className="flex items-center justify-between"><span className="text-xs font-black text-slate-500">Agent workspace</span><span className={`${styles.pulseDot} h-2.5 w-2.5 rounded-full bg-indigo-500 text-indigo-400`} /></div>
              <p className="mt-4 text-3xl font-black tracking-tight">Sell smarter</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Customers, bookings and earnings—all clear at a glance.</p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {["Clients", "Bookings", "Earnings"].map((label, index) => <div key={label} className="rounded-xl bg-indigo-50 p-2 text-center"><span className="block text-sm font-black text-indigo-700">{index + 1}</span><span className="text-[9px] font-bold text-slate-500">{label}</span></div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.metricStrip} relative z-10 mx-auto -mt-10 max-w-6xl px-4 sm:px-6`}>
        <div className="grid overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-[0_25px_70px_-35px_rgba(49,46,129,.45)] sm:grid-cols-3">
          {[['Curated catalogue', 'Tours ready to recommend'], ['Faster booking', 'Live availability'], ['Rewarding growth', 'Clear commissions']].map(([title, detail], index) => <div key={title} className={`p-6 text-center ${index ? 'border-t border-indigo-100 sm:border-l sm:border-t-0' : ''}`}><p className="text-lg font-black text-slate-950">{title}</p><p className="mt-1 text-xs font-semibold text-indigo-700">{detail}</p></div>)}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-black uppercase tracking-[.16em] text-indigo-700">What&apos;s included</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Everything you need to sell as an agent</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <div key={title} className={`${styles.featureCard} rounded-3xl border border-slate-100 bg-slate-50/60 p-7 hover:border-indigo-200 hover:bg-white hover:shadow-[0_24px_55px_-30px_rgba(49,46,129,.5)]`}>
              <span className={`${styles.icon} flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700`}>
                <Icon size={20} />
              </span>
              <h3 className="mt-4 text-sm font-black text-slate-950">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-indigo-50/50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[.16em] text-indigo-700">How it works</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">From sign-up to your first booking</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, description }, index) => (
              <div key={title} className={`${styles.stepCard} relative rounded-3xl border border-indigo-100 bg-white p-6 shadow-[0_10px_30px_-25px_rgba(49,46,129,.6)]`}>
                <span className="absolute -top-3 -left-3 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-700 text-xs font-black text-white shadow">
                  {index + 1}
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
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
          <p className="text-xs font-black uppercase tracking-[.16em] text-indigo-700">Verification documents</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">What you&apos;ll need to get verified</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            You can upload these anytime after registering, from the Verification Documents tab in your agent profile.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {REQUIRED_DOCUMENTS.map(({ icon: Icon, title, description, required }) => (
            <div key={title} className={`${styles.documentCard} flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_4px_rgba(15,23,42,.04)] hover:border-indigo-200 hover:shadow-xl`}>
              <span className={`${styles.icon} flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700`}>
                <Icon size={18} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-950">{title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${required ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>{required ? "Required" : "Optional"}</span>
                </div>
                <p className="mt-1 text-xs leading-6 text-slate-500">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[.16em] text-indigo-400">Partner rules</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">What we expect from partner agents</h2>
          </div>
          <ul className="mx-auto mt-10 max-w-2xl space-y-4">
            {RULES.map((rule) => (
              <li key={rule} className="flex items-start gap-3 text-sm leading-6 text-white/80">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-indigo-400" />
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl overflow-hidden px-4 py-20 text-center sm:px-6">
        <div className={`${styles.ctaGlow} pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-200/60 blur-3xl`} />
        <div className="relative rounded-[2rem] border border-indigo-100 bg-white/80 px-6 py-14 shadow-[0_30px_80px_-50px_rgba(49,46,129,.55)] backdrop-blur-sm">
        <Sparkles className="mx-auto mb-4 text-indigo-600" size={24} />
        <h2 className="text-3xl font-black tracking-tight text-slate-950">Ready to start booking for clients?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
          Registration takes a few minutes. Your account is reviewed by our team once your documents are submitted.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/agent-portal/login?tab=register"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-800 hover:shadow-xl"
          >
            Become an Agent Partner <ArrowRight size={16} />
          </Link>
          <Link
            href="/agent-portal/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-6 py-3.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50"
          >
            Already an agent? Sign in
          </Link>
        </div>
        </div>
      </section>
    </main>
  );
}
