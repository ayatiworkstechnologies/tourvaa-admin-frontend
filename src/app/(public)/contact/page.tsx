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
} from "react-icons/lu";
import publicApi from "@/lib/api/publicClient";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import OfficesWorldMap, { OFFICES } from "@/components/public/contact/OfficesWorldMap";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: "booking",
    question: "How do I book a tour package with Tourvaa?",
    answer:
      "Booking with Tourvaa is effortless. Simply browse our curated destinations, select your preferred departure date, choose between small group or private tailor-made options, and complete our secure checkout. You'll receive instant booking confirmation and direct access to your tour operator conversation dashboard.",
  },
  {
    id: "cancellation",
    question: "What is your cancellation and refund policy?",
    answer:
      "You can cancel your booking up to 14 days before your departure date for a full refund. For cancellations made between 7 to 13 days prior, we offer a 50% refund. Unfortunately, cancellations made within 7 days of the tour start date are non-refundable. Please read our detailed Terms & Conditions for specific destination and partner policies.",
  },
  {
    id: "group-discounts",
    question: "Are group discounts available for larger bookings?",
    answer:
      "Yes! We offer dedicated group pricing for parties of 6 or more travelers. Contact our specialist travel operations team or select the group inquiry option during tour selection for bespoke rates and tailored arrangements.",
  },
  {
    id: "insurance",
    question: "Does Tourvaa provide comprehensive travel insurance?",
    answer:
      "While our packages include full operational ground support and vetted local tour leaders, comprehensive travel medical insurance is strongly recommended for all journeys. You can easily add comprehensive insurance during checkout or through our accredited travel partners.",
  },
  {
    id: "payment-methods",
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards (Visa, MasterCard, American Express), bank wire transfers, and regional payment gateways with 256-bit bank-grade encryption and zero hidden fees.",
  },
  {
    id: "visa-assistance",
    question: "Do you offer visa assistance for international tours?",
    answer:
      "Yes, our destination teams provide official visa support letters, confirmed itinerary documentation, and tailored entry guidance for your embassy or e-Visa application upon booking confirmation.",
  },
];

export default function ContactPage() {
  const [openFaqId, setOpenFaqId] = useState<string>("cancellation"); // Opened by default per reference image
  const [activeOfficeId, setActiveOfficeId] = useState<string>("nz"); // NZ active by default per reference image

  const [officeSelectionVersion, setOfficeSelectionVersion] = useState(0);
  const selectOffice = (id: string) => {
    setActiveOfficeId(id);
    setOfficeSelectionVersion((version) => version + 1);
  };

  // Ask Question / Contact Modal state
  const [showInquiryModal, setShowInquiryModal] = useState<boolean>(false);
  const [form, setForm] = useState({
    reservation: "no",
    name: "",
    phone: "",
    email: "",
    subject: "General Question",
    message: "",
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [sent, setSent] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent("tourvaa:open-chat"));
  };

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? "" : id));
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
    <main className="min-h-screen bg-[#FAFAFB] text-slate-900 pb-20">
      {/* ── 1. Hero Landscape Banner ── */}
      <div className="mx-auto max-w-[1380px] px-4 sm:px-6 pt-4 sm:pt-6">
        <section className="relative h-[260px] sm:h-[300px] w-full overflow-hidden rounded-[26px] bg-slate-900 shadow-md">
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1800&q=80"
            alt="Misty mountain valley landscape"
            className="h-full w-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/45 to-transparent" />

          {/* Hero Content */}
          <div className="relative z-10 flex h-full flex-col justify-center px-6 sm:px-10 lg:px-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              Contact us
            </h1>
            <p className="mt-2.5 max-w-2xl text-xs sm:text-sm font-medium leading-relaxed text-white/90">
              Tourvaa is the Adventure Booking Platform linking the world&apos;s largest series and multi-day organised adventures worldwide.
            </p>

            {/* Quick Action Pills */}
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <a
                href="#help-cards"
                className="inline-flex items-center rounded-full border border-white/30 bg-black/25 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/20 hover:border-white/50"
              >
                Help &amp; services
              </a>
              <button
                type="button"
                onClick={() => setShowInquiryModal(true)}
                className="inline-flex items-center rounded-full border border-white/30 bg-black/25 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/20 hover:border-white/50"
              >
                Ask a question
              </button>
              <a
                href="#faqs"
                className="inline-flex items-center rounded-full border border-white/30 bg-black/25 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/20 hover:border-white/50"
              >
                Check out our FAQs
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* ── 2. Three Support Cards Grid ── */}
      <section id="help-cards" className="mx-auto max-w-[1380px] px-4 sm:px-6 pt-8 sm:pt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Existing Booking */}
          <div className="flex flex-col justify-between rounded-[22px] border border-slate-200/90 bg-white p-7 shadow-sm transition hover:border-slate-300 hover:shadow-md">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <Calendar size={20} />
              </div>
              <h3 className="mt-5 text-base font-bold text-slate-950 leading-snug">
                Questions about existing booking or inquiry?
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                We recommend using the booking conversation page to contact the operator directly for any questions about your booking or inquiry.
              </p>
            </div>
            <Link
              href="/profile/bookings"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#0A1128] hover:bg-slate-850 text-white text-xs font-bold px-5 py-2.5 w-fit shadow-xs transition"
            >
              <span>Check my bookings</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Card 2: Let's chat */}
          <div className="flex flex-col justify-between rounded-[22px] border border-slate-200/90 bg-white p-7 shadow-sm transition hover:border-slate-300 hover:shadow-md">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <MessageCircle size={20} />
              </div>
              <h3 className="mt-5 text-base font-bold text-slate-950 leading-snug">
                Let&apos;s chat
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                Chat with our virtual assistant Scout, or get connected with a human. We are available 24/7 to assist you.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenChat}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#0A1128] hover:bg-slate-850 text-white text-xs font-bold px-5 py-2.5 w-fit shadow-xs transition"
            >
              <span>Start chat</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Card 3: Help Center */}
          <div className="flex flex-col justify-between rounded-[22px] border border-slate-200/90 bg-white p-7 shadow-sm transition hover:border-slate-300 hover:shadow-md">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <HelpCircle size={20} />
              </div>
              <h3 className="mt-5 text-base font-bold text-slate-950 leading-snug">
                Help Center
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                Whether you&apos;re a traveller, operator, or partner, we&apos;ve got answers to some of our most frequently asked questions just a click away.
              </p>
            </div>
            <Link
              href="/help-centre"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#0A1128] hover:bg-slate-850 text-white text-xs font-bold px-5 py-2.5 w-fit shadow-xs transition"
            >
              <span>See all questions</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. Frequently Asked Questions Section ── */}
      <section id="faqs" className="mx-auto max-w-4xl px-4 sm:px-6 pt-16 sm:pt-20">
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
          Frequently Asked Questions
        </h2>

        <div className="mt-10 space-y-3">
          {FAQS.map((faq) => {
            const isOpen = openFaqId === faq.id;

            return (
              <div
                key={faq.id}
                className={`transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "rounded-2xl border-2 border-sky-400/80 bg-sky-50/50 p-6 shadow-xs"
                    : "border-b border-slate-200/80 py-4 px-2 hover:border-slate-300"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full flex items-center justify-between text-left gap-4"
                >
                  <span
                    className={`text-sm sm:text-base font-bold transition-colors ${
                      isOpen ? "text-slate-950" : "text-slate-800 hover:text-slate-950"
                    }`}
                  >
                    {faq.question}
                  </span>

                  {isOpen ? (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E4572E] text-white shadow-xs">
                      <ChevronUp size={16} />
                    </span>
                  ) : (
                    <span className="text-[#E4572E] hover:text-[#c24118] shrink-0">
                      <ChevronDown size={18} />
                    </span>
                  )}
                </button>

                {isOpen && (
                  <div className="mt-3.5 text-xs sm:text-sm text-slate-600 font-normal leading-relaxed pt-1">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 4. "How can we help?" 4-Card Grid ── */}
      <section className="mx-auto max-w-[1380px] px-4 sm:px-6 pt-20 sm:pt-24">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
          How can we help?
        </h2>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Operators */}
          <div className="flex flex-col justify-between overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-xs transition hover:shadow-md">
            <div>
              <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80"
                  alt="Tour operators desk"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-5">
                <h3 className="text-base font-bold text-slate-950">Operators</h3>
                <div className="mt-2.5 space-y-2 text-xs text-slate-600 leading-relaxed">
                  <p>
                    <strong className="text-slate-800">I want to be an operator:</strong> Get in touch with our Business Development team to list your adventures.
                  </p>
                  <p>
                    <strong className="text-slate-800">I&apos;m an operator:</strong> Log in to your Operator Dashboard to talk to our team or have a browse of our FAQs.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 pt-0">
              <Link
                href="/portal/supplier/login"
                className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-900"
              >
                <span>Operator Portal</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Card 2: Travel Agents */}
          <div className="flex flex-col justify-between overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-xs transition hover:shadow-md">
            <div>
              <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80"
                  alt="Travel agents passport and ticket"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-5">
                <h3 className="text-base font-bold text-slate-950">Travel Agents</h3>
                <div className="mt-2.5 space-y-2 text-xs text-slate-600 leading-relaxed">
                  <p>
                    <strong className="text-slate-800">I want to book adventures:</strong> For more information and to sign up, check out our Booking Platform for Travel Agents.
                  </p>
                  <p>
                    <strong className="text-slate-800">I&apos;m a Tourvaa Travel Agent:</strong> Log in to your Agent Portal to talk to our team and view our FAQs.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 pt-0">
              <Link
                href="/portal/agent/login"
                className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-900"
              >
                <span>Agent Portal</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Card 3: Distribution Partners */}
          <div className="flex flex-col justify-between overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-xs transition hover:shadow-md">
            <div>
              <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80"
                  alt="Distribution solutions"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-5">
                <h3 className="text-base font-bold text-slate-950">Distribution Partners</h3>
                <div className="mt-2.5 space-y-2 text-xs text-slate-600 leading-relaxed">
                  <p>
                    <strong className="text-slate-800">I want to be a partner:</strong> For more information and to sign up, check out our Distribution Solutions.
                  </p>
                  <p>
                    <strong className="text-slate-800">I&apos;m a partner:</strong> Log in to your Partner Portal to talk to our team and view the Partner Help Centre.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 pt-0">
              <Link
                href="/portal"
                className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-900"
              >
                <span>Distribution Solutions</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Card 4: Media */}
          <div className="flex flex-col justify-between overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-xs transition hover:shadow-md">
            <div>
              <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=600&q=80"
                  alt="Media press postcards"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-5">
                <h3 className="text-base font-bold text-slate-950">Media</h3>
                <div className="mt-2.5 space-y-2 text-xs text-slate-600 leading-relaxed">
                  <p>
                    <strong className="text-slate-800">Journalist looking for our Press page?</strong> It houses everything you could need from an overview of what we do and who we are, as well as our brand guidelines and company logos.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 pt-0">
              <Link
                href="/about"
                className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-900"
              >
                <span>Press &amp; Brand Assets</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. "Our Offices" Section with Dotted World Map ── */}
      <section className="mx-auto max-w-[1380px] px-4 sm:px-6 pt-20 sm:pt-24">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
          Our Offices
        </h2>

        <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500">Local knowledge. A world of possibilities. Select an office to explore where we call home.</p>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 items-center">
          {/* Left Column: Office Cards */}
          <div className="space-y-3">
            {OFFICES.map((office) => {
              const isSelected = activeOfficeId === office.id;

              return (
                <button
                  type="button"
                  aria-pressed={isSelected}
                  key={office.id}
                  onClick={() => selectOffice(office.id)}
                  className={`w-full text-left cursor-pointer rounded-2xl p-5 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-sky-600 ${
                    isSelected
                      ? "bg-white border border-sky-200 shadow-[0_8px_30px_-12px_rgba(2,132,199,0.25)]"
                      : "bg-transparent border border-slate-200/70 hover:bg-white"
                  }`}
                >
                  <span
                    className={`block text-lg font-bold tracking-tight ${
                      isSelected ? "text-[#0284C7]" : "text-slate-900"
                    }`}
                  >
                    {office.country}
                  </span>
                  <span className="block mt-2 text-xs sm:text-sm text-slate-700 font-medium leading-snug">
                    {office.addressLine1}
                  </span>
                  <span className="block text-xs sm:text-sm text-slate-700 font-medium leading-snug">
                    {office.addressLine2}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Column: Dotted World Map Graphic */}
          <div className="w-full">
            <OfficesWorldMap
              activeOfficeId={activeOfficeId}
              onSelectOffice={selectOffice}
              selectionVersion={officeSelectionVersion}
            />
          </div>
        </div>
      </section>

      {/* ── Direct Inquiry Modal (Triggered by "Ask a question") ── */}
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
                <h3 className="mt-4 text-xl font-bold text-slate-950">
                  Message Sent!
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-500">
                  Thank you for reaching out. One of our travel specialists will respond within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setShowInquiryModal(false);
                  }}
                  className="mt-6 rounded-full bg-[#0A1128] px-6 py-2.5 text-xs font-bold text-white shadow-md"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950">
                  Ask a Question
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Submit your travel question or reservation inquiry directly to our team.
                </p>

                {error && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={submitInquiry} className="mt-4 space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700">
                      Do you have an existing booking?
                    </label>
                    <div className="mt-1.5 flex gap-4 text-xs font-medium text-slate-700">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="reservation"
                          value="yes"
                          checked={form.reservation === "yes"}
                          onChange={() => setForm({ ...form, reservation: "yes" })}
                          className="accent-[#0A1128]"
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="reservation"
                          value="no"
                          checked={form.reservation === "no"}
                          onChange={() => setForm({ ...form, reservation: "no" })}
                          className="accent-[#0A1128]"
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Your name"
                        className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-sky-600"
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
                        className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-sky-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-sky-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700">
                      Message
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="How can we help you?"
                      className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-sky-600 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#0A1128] text-xs font-bold text-white shadow-md hover:bg-slate-850 disabled:opacity-50"
                  >
                    {submitting ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send size={13} />
                        <span>Send Message</span>
                      </>
                    )}
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
