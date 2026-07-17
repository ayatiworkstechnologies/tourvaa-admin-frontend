"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LuArrowRight as ArrowRight,
  LuCalendarDays as CalendarDays,
  LuCheck as Check,
  LuCircleCheckBig as CheckCircle2,
  LuClock3 as Clock3,
  LuHeadphones as Headphones,
  LuMail as Mail,
  LuMapPinned as MapPinned,
  LuMessageSquare as MessageSquare,
  LuPhone as Phone,
  LuSend as Send,
  LuShieldCheck as ShieldCheck,
  LuSparkles as Sparkles,
} from "react-icons/lu";

const INPUT_CLASS = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10";

const CONTACT_OPTIONS = [
  { Icon: Phone, eyebrow: "Call our experts", value: "+91 98765 43210", note: "Mon–Sun, 9:00 AM–9:00 PM", href: "tel:+919876543210" },
  { Icon: Mail, eyebrow: "Email support", value: "support@tourvaa.com", note: "Replies within one business day", href: "mailto:support@tourvaa.com" },
  { Icon: MapPinned, eyebrow: "Visit our office", value: "Chennai, India", note: "Meetings available by appointment", href: "https://maps.google.com/?q=Chennai,India" },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", enquiryType: "Trip planning", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSent(true);
    setSubmitting(false);
  };

  const reset = () => {
    setSent(false);
    setForm({ name: "", email: "", phone: "", enquiryType: "Trip planning", subject: "", message: "" });
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <section className="relative overflow-hidden bg-[#063c42] pb-28 pt-32 text-white md:pb-32 md:pt-40">
        <Image src="/images/destination-desert.jpg" alt="Travel destination at sunset" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#043d42]/95 via-[#043d42]/80 to-[#043d42]/25" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-orange-400/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-end gap-10 px-5 md:px-8 lg:grid-cols-[1fr_350px]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-teal-50 backdrop-blur-md">
              <MessageSquare size={14} /> We&apos;re here to help
            </div>
            <h1 className="mt-5 max-w-3xl font-heading text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Let&apos;s plan something <span className="text-orange-400">unforgettable.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
              From your first idea to the final detail, our travel specialists are ready to help with tours, bookings, partnerships, and support.
            </p>
          </div>

          <div className="hidden rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md lg:block">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-teal-800"><Headphones size={22} /></span>
              <div><p className="text-xs font-black uppercase tracking-[0.16em] text-teal-100">Live assistance</p><p className="mt-1 text-lg font-black">7 days a week</p></div>
            </div>
            <div className="mt-5 border-t border-white/15 pt-5 text-sm leading-6 text-white/70">Most enquiries receive a response within 24 hours.</div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-12 max-w-7xl px-5 md:px-8">
        <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 sm:grid-cols-3">
          {CONTACT_OPTIONS.map(({ Icon, eyebrow, value, note, href }, index) => (
            <a key={eyebrow} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className={`group flex gap-4 p-5 transition hover:bg-teal-50 sm:p-6 ${index < CONTACT_OPTIONS.length - 1 ? "border-b border-slate-200 sm:border-b-0 sm:border-r" : ""}`}>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition group-hover:bg-teal-700 group-hover:text-white"><Icon size={21} /></span>
              <span className="min-w-0"><small className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{eyebrow}</small><strong className="mt-1 block truncate text-sm text-slate-950 sm:text-base">{value}</strong><small className="mt-1 block text-xs leading-5 text-slate-500">{note}</small></span>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-7xl px-5 md:px-8">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            {sent ? (
              <div className="flex min-h-[520px] flex-col items-center justify-center px-4 text-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50"><CheckCircle2 size={40} className="text-emerald-600" /></span>
                <p className="mt-6 text-3xl font-black text-slate-950">Message received</p>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">Thank you for contacting Tourvaa. Our team will review your enquiry and get back to you within 24 hours.</p>
                <button type="button" onClick={reset} className="mt-8 rounded-xl bg-teal-700 px-6 py-3 text-sm font-black text-white transition hover:bg-teal-800">Send another message</button>
              </div>
            ) : (
              <>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">Send an enquiry</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">How can we help?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Share a few details and the right specialist will contact you.</p>

                <form onSubmit={submit} className="mt-8 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block"><span className="mb-2 block text-xs font-black text-slate-700">Full name</span><input required value={form.name} onChange={(event) => set("name", event.target.value)} placeholder="Your full name" className={INPUT_CLASS} /></label>
                    <label className="block"><span className="mb-2 block text-xs font-black text-slate-700">Email address</span><input required type="email" value={form.email} onChange={(event) => set("email", event.target.value)} placeholder="you@example.com" className={INPUT_CLASS} /></label>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block"><span className="mb-2 block text-xs font-black text-slate-700">Phone number <span className="font-medium text-slate-400">(optional)</span></span><input type="tel" value={form.phone} onChange={(event) => set("phone", event.target.value)} placeholder="+91 98765 43210" className={INPUT_CLASS} /></label>
                    <label className="block"><span className="mb-2 block text-xs font-black text-slate-700">Enquiry type</span><select value={form.enquiryType} onChange={(event) => set("enquiryType", event.target.value)} className={INPUT_CLASS}><option>Trip planning</option><option>Existing booking</option><option>Payment support</option><option>Partnership</option><option>General enquiry</option></select></label>
                  </div>
                  <label className="block"><span className="mb-2 block text-xs font-black text-slate-700">Subject</span><input required value={form.subject} onChange={(event) => set("subject", event.target.value)} placeholder="What would you like help with?" className={INPUT_CLASS} /></label>
                  <label className="block"><span className="mb-2 block text-xs font-black text-slate-700">Message</span><textarea required rows={6} value={form.message} onChange={(event) => set("message", event.target.value)} placeholder="Tell us about your plans, dates, travellers, or booking question..." className={`${INPUT_CLASS} resize-none`} /></label>
                  <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={15} className="text-teal-700" /> Your information is kept private and secure.</p>
                    <button type="submit" disabled={submitting} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-7 text-sm font-black text-white shadow-md transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
                      {submitting ? "Sending…" : <><Send size={16} /> Send message</>}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-2xl bg-[#075b57] p-6 text-white sm:p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-teal-100"><CalendarDays size={22} /></span>
              <h3 className="mt-5 text-xl font-black">Planning a new holiday?</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">Browse our handpicked tours first, then send us your favourites and travel dates.</p>
              <Link href="/tours" className="mt-6 inline-flex items-center gap-2 text-sm font-black text-orange-300 transition hover:gap-3 hover:text-orange-200">Explore tour packages <ArrowRight size={15} /></Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">What happens next</p>
              <div className="mt-5 space-y-4">
                {["We review your enquiry", "A specialist contacts you", "We help finalise your next step"].map((item, index) => <div key={item} className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-black text-teal-800">{index + 1}</span><p className="pt-1 text-sm font-bold text-slate-700">{item}</p></div>)}
              </div>
            </div>

            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6">
              <div className="flex items-center gap-3"><Clock3 size={20} className="text-orange-600" /><p className="font-black text-slate-950">Already travelling?</p></div>
              <p className="mt-3 text-sm leading-6 text-slate-600">For time-sensitive in-trip support, call us or use the live chat widget for the quickest response.</p>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-700"><Check size={14} /> Support available every day</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
              <Sparkles size={20} className="mx-auto text-teal-700" />
              <p className="mt-3 text-sm font-black text-slate-950">Prefer self-service?</p>
              <Link href="/terms" className="mt-2 inline-block text-xs font-bold text-teal-700 hover:underline">View travel information and policies</Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
