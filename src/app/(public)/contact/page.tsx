"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useState } from "react";
import Link from "next/link";
import {
  LuCalendar as Calendar,
  LuMessageCircle as MessageCircle,
  LuCircleHelp as HelpCircle,
  LuArrowRight as ArrowRight,
  LuChevronDown as ChevronDown,
  LuChevronUp as ChevronUp,
  LuX as X,
  LuCircleAlert as AlertCircle,
  LuCircleCheckBig as CheckCircle,
  LuSend as Send,
  LuPhone as Phone,
  LuMail as Mail,
  LuClock as Clock,
  LuMapPin as MapPin,
  LuSparkles as Sparkles,
  LuShieldCheck as ShieldCheck,
  LuCopy as Copy,
  LuCheck as Check,
} from "react-icons/lu";
import publicApi from "@/lib/api/publicClient";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import OfficesWorldMap, {
  OFFICES,
} from "@/components/public/contact/OfficesWorldMap";

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: "booking",
    category: "RESERVATIONS",
    question: "How do I book a tour package with Tourvaa?",
    answer:
      "Booking with Tourvaa is effortless. Simply browse our curated destinations, select your preferred departure date, choose between small group or private tailor-made options, and complete our secure checkout. You'll receive instant booking confirmation and direct access to your tour operator conversation dashboard.",
  },
  {
    id: "cancellation",
    category: "CANCELLATION & REFUNDS",
    question: "What is your cancellation and refund policy?",
    answer:
      "You can cancel your booking up to 14 days before your departure date for a full refund. For cancellations made between 7 to 13 days prior, we offer a 50% refund. Unfortunately, cancellations made within 7 days of the tour start date are non-refundable. Please read our detailed Terms & Conditions for specific destination and partner policies.",
  },
  {
    id: "group-discounts",
    category: "GROUPS & CUSTOM",
    question: "Are group discounts available for larger bookings?",
    answer:
      "Yes! We offer dedicated group pricing for parties of 6 or more travelers. Contact our specialist travel operations team or select the group inquiry option during tour selection for bespoke rates and tailored arrangements.",
  },
  {
    id: "insurance",
    category: "SAFETY & MEDICAL",
    question: "Does Tourvaa provide comprehensive travel insurance?",
    answer:
      "While our packages include full operational ground support and vetted local tour leaders, comprehensive travel medical insurance is strongly recommended for all journeys. You can easily add comprehensive insurance during checkout or through our accredited travel partners.",
  },
  {
    id: "payment-methods",
    category: "PAYMENTS",
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards (Visa, MasterCard, American Express), bank wire transfers, and regional payment gateways with 256-bit bank-grade encryption and zero hidden fees.",
  },
  {
    id: "visa-assistance",
    category: "BORDER & VISAS",
    question: "Do you offer visa assistance for international tours?",
    answer:
      "Yes, our destination teams provide official visa support letters, confirmed itinerary documentation, and tailored entry guidance for your embassy or e-Visa application upon booking confirmation.",
  },
];

const OFFICE_CONTACT_META: Record<string, { phone: string; email: string; hours: string; timeZone: string }> = {
  nz: {
    phone: "+64 9 887 9200",
    email: "nz.support@tourvaa.com",
    hours: "Mon – Fri, 9:00 AM – 5:30 PM NZST",
    timeZone: "Auckland (UTC+12)",
  },
  lk: {
    phone: "+94 11 234 5670",
    email: "colombo@tourvaa.com",
    hours: "Mon – Fri, 9:00 AM – 6:00 PM IST",
    timeZone: "Colombo (UTC+5:30)",
  },
  in: {
    phone: "+91 44 4890 1200",
    email: "india.support@tourvaa.com",
    hours: "Mon – Sat, 9:30 AM – 6:30 PM IST",
    timeZone: "Chennai (UTC+5:30)",
  },
};

export default function ContactPage() {
  const [openFaqId, setOpenFaqId] = useState<string>("cancellation");
  const [activeOfficeId, setActiveOfficeId] = useState<string>("nz");
  const [officeSelectionVersion, setOfficeSelectionVersion] = useState(0);

  // Email copy state
  const [emailCopied, setEmailCopied] = useState(false);

  const selectOffice = (id: string) => {
    setActiveOfficeId(id);
    setOfficeSelectionVersion((version) => version + 1);
  };

  // Inquiry form state
  const [form, setForm] = useState({
    reservation: "no",
    name: "",
    phone: "",
    email: "",
    subject: "General Inquiry",
    message: "",
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [sent, setSent] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Modal state
  const [showInquiryModal, setShowInquiryModal] = useState<boolean>(false);

  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent("tourvaa:open-chat"));
  };

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? "" : id));
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("support@tourvaa.com");
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const submitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await publicApi.post("/contact", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        enquiry_type: form.subject || "General Inquiry",
        subject: form.subject || "General Inquiry",
        message: `Reservation number: ${form.reservation === "yes" ? "Yes" : "No"}\n\n${form.message}`,
      });
      setSent(true);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAFC] text-slate-900 pb-24">
      {/* ── 1. Hero Landscape Banner ── */}
      <div className="mx-auto max-w-[1380px] px-4 sm:px-6 pt-4 sm:pt-6">
        <section className="relative min-h-[320px] sm:min-h-[360px] w-full overflow-hidden rounded-[26px] bg-[#0B1F3A] shadow-lg flex items-center">
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1800&q=80"
            alt="Misty mountain valley landscape"
            className="absolute inset-0 h-full w-full object-cover opacity-50 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1F3A] via-[#0B1F3A]/85 to-transparent" />

          {/* Hero Content */}
          <div className="relative z-10 flex h-full flex-col justify-center px-6 sm:px-12 py-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-bold text-white backdrop-blur-md shadow-xs w-fit">
              <Sparkles size={13} className="text-amber-400" />
              <span>24/7 Global Traveler Concierge</span>
              <span className="text-white/40">•</span>
              <span className="text-emerald-400">Response &lt; 2h</span>
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight text-white font-heading leading-tight drop-shadow-md">
              We&apos;re Here to Help You Explore the World
            </h1>
            <p className="mt-3 text-sm sm:text-base font-medium leading-relaxed text-white/85 max-w-2xl">
              Have questions about an upcoming tour, custom private itinerary, or existing reservation? Our global team is available around the clock to support your journey.
            </p>

            {/* Quick Action Navigation Pills */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <a
                href="#contact-form-section"
                className="inline-flex items-center rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-bold text-white backdrop-blur-xs transition hover:bg-white hover:text-slate-900 shadow-xs"
              >
                Send a Message
              </a>
              <a
                href="#help-cards"
                className="inline-flex items-center rounded-full border border-white/20 bg-black/25 px-4 py-2 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/20"
              >
                Priority Services
              </a>
              <a
                href="#faqs"
                className="inline-flex items-center rounded-full border border-white/20 bg-black/25 px-4 py-2 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/20"
              >
                Instant FAQs
              </a>
              <a
                href="#offices"
                className="inline-flex items-center rounded-full border border-white/20 bg-black/25 px-4 py-2 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/20"
              >
                Our Global Offices
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* ── 2. Three Support Cards Grid ── */}
      <section
        id="help-cards"
        className="mx-auto max-w-[1380px] px-4 sm:px-6 pt-10 sm:pt-12"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Existing Booking */}
          <div className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-7 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <Calendar size={22} />
              </div>
              <span className="mt-4 inline-block text-[11px] font-bold uppercase tracking-wider text-sky-700">
                Existing Reservation
              </span>
              <h3 className="mt-1 text-lg font-bold text-slate-950 leading-snug font-heading">
                Questions About Your Booking?
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                Connect directly with your verified tour operator through your personal dashboard for real-time itinerary updates, pickup details, and luggage guidance.
              </p>
            </div>
            <Link
              href="/profile/bookings"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1F3A] hover:bg-slate-800 text-white text-xs font-bold px-5 py-3 w-fit shadow-xs transition"
            >
              <span>Manage My Bookings</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Card 2: Live Chat */}
          <div className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-7 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <MessageCircle size={22} />
              </div>
              <span className="mt-4 inline-block text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Instant Chat Assistance
              </span>
              <h3 className="mt-1 text-lg font-bold text-slate-950 leading-snug font-heading">
                Chat With Concierge Scout
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                Chat 24/7 with Scout, our intelligent travel assistant, or connect instantly with a human destination specialist for immediate booking answers.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenChat}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1F3A] hover:bg-slate-800 text-white text-xs font-bold px-5 py-3 w-fit shadow-xs transition"
            >
              <span>Launch Live Chat</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Card 3: Help Center */}
          <div className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-7 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <HelpCircle size={22} />
              </div>
              <span className="mt-4 inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Self-Service Library
              </span>
              <h3 className="mt-1 text-lg font-bold text-slate-950 leading-snug font-heading">
                Help &amp; Knowledge Base
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                Browse detailed guides on visas, packing essentials, payment safety, flexible cancellation policies, and partner supplier guidelines.
              </p>
            </div>
            <Link
              href="/help-centre"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1F3A] hover:bg-slate-800 text-white text-xs font-bold px-5 py-3 w-fit shadow-xs transition"
            >
              <span>Browse Knowledge Base</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. Embedded Direct Contact Form & Channels Hub ── */}
      <section
        id="contact-form-section"
        className="mx-auto max-w-[1380px] px-4 sm:px-6 pt-16 sm:pt-20"
      >
        <div className="overflow-hidden rounded-[26px] border border-slate-200/90 bg-white shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Column: Direct Communication Channels */}
            <div className="lg:col-span-5 bg-gradient-to-br from-[#0B1F3A] to-slate-900 p-8 sm:p-10 text-white flex flex-col justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-xs">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Verified Concierge Support</span>
                </span>
                <h2 className="mt-4 text-2xl sm:text-3xl font-black text-white font-heading">
                  Get in Touch Directly
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-white/80 font-normal leading-relaxed">
                  Whether you are planning an expedition or have questions regarding an existing booking, our specialists are ready to guide you.
                </p>

                {/* Direct Channel Items */}
                <div className="mt-8 space-y-5">
                  {/* Phone Hotline */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-xs">
                      <Phone size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white/60">
                        International Booking Hotline
                      </div>
                      <a
                        href="tel:+6498879200"
                        className="text-sm font-bold text-white hover:text-sky-300 transition-colors"
                      >
                        +64 9 887 9200 (Global Toll-Free)
                      </a>
                      <div className="text-[11px] text-white/60 mt-0.5">
                        Available 24/7 in English, French &amp; Spanish
                      </div>
                    </div>
                  </div>

                  {/* Direct Support Email */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-xs">
                      <Mail size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white/60">
                        Official Concierge Email
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href="mailto:support@tourvaa.com"
                          className="text-sm font-bold text-white hover:text-sky-300 transition-colors"
                        >
                          support@tourvaa.com
                        </a>
                        <button
                          type="button"
                          onClick={handleCopyEmail}
                          className="rounded-md bg-white/15 p-1 text-white/80 hover:bg-white/30 transition"
                          title="Copy email address"
                        >
                          {emailCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      </div>
                      <div className="text-[11px] text-white/60 mt-0.5">
                        Guaranteed response within 2 business hours
                      </div>
                    </div>
                  </div>

                  {/* Operational Hours */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-xs">
                      <Clock size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white/60">
                        Live Operations Response
                      </div>
                      <div className="text-sm font-bold text-white">
                        24 Hours / 7 Days a Week
                      </div>
                      <div className="text-[11px] text-white/60 mt-0.5">
                        Dedicated in-trip emergency dispatch line
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Guarantee Banner */}
              <div className="mt-10 rounded-2xl bg-white/10 p-4 backdrop-blur-xs border border-white/15">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <CheckCircle size={16} />
                  </span>
                  <div className="text-xs">
                    <span className="font-bold text-white block">
                      Traveler Protection Guarantee
                    </span>
                    <span className="text-white/75 block mt-0.5">
                      100% verified operators &amp; encrypted booking protection.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Embedded Contact Form */}
            <div className="lg:col-span-7 p-8 sm:p-10">
              {sent ? (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-xs">
                    <CheckCircle size={36} />
                  </div>
                  <h3 className="mt-5 text-2xl font-bold text-slate-950 font-heading">
                    Message Successfully Dispatched!
                  </h3>
                  <p className="mt-2 max-w-md mx-auto text-sm text-slate-600 font-normal leading-relaxed">
                    Thank you for contacting Tourvaa. A dedicated expedition planner has received your message and will reply to <strong>{form.email}</strong> within 2 hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSent(false);
                      setForm({
                        reservation: "no",
                        name: "",
                        phone: "",
                        email: "",
                        subject: "General Inquiry",
                        message: "",
                      });
                    }}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0B1F3A] px-6 py-3 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
                  >
                    <span>Send Another Inquiry</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-slate-950 font-heading">
                        Send Us a Message
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm text-slate-500">
                        Fill in your journey details below and our team will get back to you promptly.
                      </p>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={submitInquiry} className="mt-6 space-y-4">
                    {/* Booking Status Radio */}
                    <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-3.5">
                      <label className="block text-xs font-bold text-slate-800">
                        Do you have an existing booking reference?
                      </label>
                      <div className="mt-2 flex gap-6 text-xs font-semibold text-slate-700">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="reservation"
                            value="no"
                            checked={form.reservation === "no"}
                            onChange={() => setForm({ ...form, reservation: "no" })}
                            className="accent-pub-secondary"
                          />
                          <span>No, I am planning a new trip</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="reservation"
                            value="yes"
                            checked={form.reservation === "yes"}
                            onChange={() => setForm({ ...form, reservation: "yes" })}
                            className="accent-pub-secondary"
                          />
                          <span>Yes, I have an active reservation</span>
                        </label>
                      </div>
                    </div>

                    {/* Name & Phone Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="e.g. Alex Henderson"
                          className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs sm:text-sm outline-none focus:border-pub-secondary focus:ring-1 focus:ring-pub-secondary/20 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="+1 (555) 000-0000"
                          className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs sm:text-sm outline-none focus:border-pub-secondary focus:ring-1 focus:ring-pub-secondary/20 transition"
                        />
                      </div>
                    </div>

                    {/* Email & Subject Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="alex@example.com"
                          className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs sm:text-sm outline-none focus:border-pub-secondary focus:ring-1 focus:ring-pub-secondary/20 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700">
                          Topic / Subject
                        </label>
                        <select
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-xs sm:text-sm outline-none focus:border-pub-secondary focus:ring-1 focus:ring-pub-secondary/20 transition bg-white"
                        >
                          <option value="General Inquiry">General Question</option>
                          <option value="Booking Assistance">Booking Assistance</option>
                          <option value="Custom Group Tour">Custom / Private Group Tour</option>
                          <option value="Operator Partnership">Operator / Supplier Partnership</option>
                          <option value="Feedback or Complaint">Feedback / Help Desk</option>
                        </select>
                      </div>
                    </div>

                    {/* Message Area */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        How Can We Help You? <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        placeholder="Tell us about your destination plans, travel dates, or specific questions..."
                        className="mt-1.5 w-full rounded-xl border border-slate-200 p-3.5 text-xs sm:text-sm outline-none focus:border-pub-secondary focus:ring-1 focus:ring-pub-secondary/20 transition resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B1F3A] text-xs sm:text-sm font-bold text-white shadow-md hover:bg-slate-800 disabled:opacity-50 transition"
                    >
                      {submitting ? (
                        "Transmitting inquiry..."
                      ) : (
                        <>
                          <Send size={14} />
                          <span>Send Message to Concierge</span>
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Frequently Asked Questions ── */}
      <section
        id="faqs"
        className="mx-auto max-w-4xl px-4 sm:px-6 pt-20 sm:pt-28"
      >
        <div className="text-center">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-pub-secondary">
            INSTANT ANSWERS
          </span>
          <h2 className="mt-1 text-2xl sm:text-3xl font-black text-slate-950 font-heading">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Quick solutions to the most common queries from travelers and partners.
          </p>
        </div>

        <div className="mt-10 space-y-3.5">
          {FAQS.map((faq) => {
            const isOpen = openFaqId === faq.id;

            return (
              <div
                key={faq.id}
                className={`transition-all duration-200 overflow-hidden rounded-2xl border ${
                  isOpen
                    ? "border-sky-300 bg-sky-50/50 p-6 shadow-2xs"
                    : "border-slate-200/80 bg-white p-5 hover:border-slate-300"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full flex items-center justify-between text-left gap-4 cursor-pointer"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block mb-1">
                      {faq.category}
                    </span>
                    <span
                      className={`text-sm sm:text-base font-bold font-heading transition-colors ${
                        isOpen ? "text-slate-950" : "text-slate-800 hover:text-slate-950"
                      }`}
                    >
                      {faq.question}
                    </span>
                  </div>

                  {isOpen ? (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pub-accent text-white shadow-xs">
                      <ChevronUp size={16} />
                    </span>
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
                      <ChevronDown size={16} />
                    </span>
                  )}
                </button>

                {isOpen && (
                  <div className="mt-3.5 text-xs sm:text-sm text-slate-600 font-normal leading-relaxed pt-2 border-t border-sky-200/60">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 5. "How can we help?" 4-Card Partner Hub ── */}
      <section className="mx-auto max-w-[1380px] px-4 sm:px-6 pt-20 sm:pt-28">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-pub-secondary">
              PARTNERSHIP CHANNELS
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-black text-slate-950 font-heading">
              Dedicated Solutions for Industry Partners
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md">
            Specialized business portals and rapid support desks for operators, travel agencies, and media.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Operators */}
          <div className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200">
            <div>
              <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80"
                  alt="Tour operators desk"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 rounded-md bg-[#0B1F3A]/80 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold text-white">
                  Tour Suppliers
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-base font-bold text-slate-950 font-heading">
                  Tour Operators
                </h3>
                <div className="mt-2.5 space-y-2 text-xs text-slate-600 leading-relaxed font-normal">
                  <p>
                    <strong className="text-slate-800 font-semibold">List Adventures:</strong>{" "}
                    Apply to join our vetted supplier network and showcase your multi-day expeditions.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 pt-0">
              <Link
                href="/portal/supplier/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-pub-secondary hover:underline"
              >
                <span>Supplier Portal</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Card 2: Travel Agents */}
          <div className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200">
            <div>
              <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80"
                  alt="Travel agents passport and ticket"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 rounded-md bg-[#0B1F3A]/80 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold text-white">
                  Travel Advisors
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-base font-bold text-slate-950 font-heading">
                  Travel Agents
                </h3>
                <div className="mt-2.5 space-y-2 text-xs text-slate-600 leading-relaxed font-normal">
                  <p>
                    <strong className="text-slate-800 font-semibold">Agent Bookings:</strong>{" "}
                    Unlock top-tier net rates, commission tracking, and client itinerary builders.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 pt-0">
              <Link
                href="/portal/agent/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-pub-secondary hover:underline"
              >
                <span>Agent Login</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Card 3: Distribution Partners */}
          <div className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200">
            <div>
              <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80"
                  alt="Distribution solutions"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 rounded-md bg-[#0B1F3A]/80 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold text-white">
                  API &amp; Distribution
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-base font-bold text-slate-950 font-heading">
                  Enterprise Solutions
                </h3>
                <div className="mt-2.5 space-y-2 text-xs text-slate-600 leading-relaxed font-normal">
                  <p>
                    <strong className="text-slate-800 font-semibold">Distribution API:</strong>{" "}
                    Seamlessly connect Tourvaa inventory into your OTAs, airline loyalty, or white-label platforms.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 pt-0">
              <Link
                href="/portal"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-pub-secondary hover:underline"
              >
                <span>Explore API Docs</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Card 4: Media */}
          <div className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200">
            <div>
              <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=600&q=80"
                  alt="Media press postcards"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 rounded-md bg-[#0B1F3A]/80 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold text-white">
                  Press Room
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-base font-bold text-slate-950 font-heading">
                  Media &amp; Press
                </h3>
                <div className="mt-2.5 space-y-2 text-xs text-slate-600 leading-relaxed font-normal">
                  <p>
                    <strong className="text-slate-800 font-semibold">Press Kit &amp; Data:</strong>{" "}
                    Access travel trend reports, press releases, high-res photography, and executive interviews.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 pt-0">
              <Link
                href="/about"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-pub-secondary hover:underline"
              >
                <span>Brand Assets</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. "Our Offices" Section with Dotted World Map ── */}
      <section
        id="offices"
        className="mx-auto max-w-[1380px] px-4 sm:px-6 pt-20 sm:pt-28"
      >
        <div className="max-w-xl">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-pub-secondary">
            GLOBAL FOOTPRINT
          </span>
          <h2 className="mt-1 text-2xl sm:text-3xl font-black text-slate-950 font-heading">
            Our Regional Headquarters
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 font-medium">
            Local knowledge. Worldwide coordination. Select an office below to inspect our regional headquarters and operational contact details.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 items-center">
          {/* Left Column: Office Cards */}
          <div className="space-y-3.5">
            {OFFICES.map((office) => {
              const isSelected = activeOfficeId === office.id;
              const meta = OFFICE_CONTACT_META[office.id];

              return (
                <button
                  type="button"
                  aria-pressed={isSelected}
                  key={office.id}
                  onClick={() => selectOffice(office.id)}
                  className={`w-full text-left cursor-pointer rounded-2xl p-5 transition-all duration-200 ${
                    isSelected
                      ? "bg-white border-2 border-pub-secondary shadow-md ring-2 ring-sky-100"
                      : "bg-white border border-slate-200/80 hover:border-slate-300 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-lg font-bold font-heading ${
                        isSelected ? "text-pub-secondary" : "text-slate-900"
                      }`}
                    >
                      {office.city}, {office.country}
                    </span>
                    {isSelected && (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                        Active Pin
                      </span>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5 font-medium">
                      <MapPin size={12} className="text-slate-400 shrink-0" />
                      <span>{office.addressLine1}, {office.addressLine2}</span>
                    </div>
                    {meta && (
                      <>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Clock size={12} className="text-slate-400 shrink-0" />
                          <span>{meta.hours}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold pt-1 text-pub-secondary">
                          <Phone size={12} className="shrink-0" />
                          <span>{meta.phone}</span>
                        </div>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Dotted World Map Graphic */}
          <div className="w-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <OfficesWorldMap
              activeOfficeId={activeOfficeId}
              onSelectOffice={selectOffice}
              selectionVersion={officeSelectionVersion}
            />
          </div>
        </div>
      </section>

      {/* ── Direct Inquiry Modal (Triggered when needed) ── */}
      {showInquiryModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowInquiryModal(false)}
        >
          <div
            className="relative max-w-lg w-full rounded-[24px] bg-white p-6 sm:p-8 shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowInquiryModal(false)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X size={16} />
            </button>

            {sent ? (
              <div className="py-8 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle size={32} />
                </span>
                <h3 className="mt-4 text-xl font-bold text-slate-950 font-heading">
                  Message Sent!
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-500">
                  Thank you for reaching out. One of our travel specialists will respond within 2 hours.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setShowInquiryModal(false);
                  }}
                  className="mt-6 rounded-xl bg-[#0B1F3A] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-950 font-heading">
                  Ask a Question
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Submit your travel question or reservation inquiry directly to our concierge.
                </p>

                {error && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={submitInquiry} className="mt-4 space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Your name"
                        className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-pub-secondary"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-pub-secondary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-pub-secondary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="How can we help you?"
                      className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-pub-secondary resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#0B1F3A] text-xs font-bold text-white shadow-md hover:bg-slate-800 disabled:opacity-50"
                  >
                    {submitting ? "Sending..." : "Submit Inquiry"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
