"use client";

/* eslint-disable @next/next/no-img-element */

import { FormEvent, useState } from "react";
import {
  LuCircleAlert as AlertCircle,
  LuCircleCheckBig as CheckCircle,
  LuChevronDown as ChevronDown,
} from "react-icons/lu";

import AboutReveal from "@/components/public/AboutReveal";
import publicApi, { subscribeNewsletter } from "@/lib/api/publicClient";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";

const INPUT_CLASS =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0B1527] focus:ring-4 focus:ring-[#0B1527]/10";

const INITIAL_FORM = {
  reservation: "no",
  name: "",
  phone: "",
  email: "",
  subject: "",
  message: "",
};

export default function ContactPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
  }

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribing(true);
    try {
      await subscribeNewsletter(newsletterEmail.trim());
      setNewsletterMessage("Thank you — travel tips are on their way!");
      setNewsletterEmail("");
    } catch (err: unknown) {
      setNewsletterMessage(getApiErrorMessage(err));
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <AboutReveal>
      <main className="overflow-hidden bg-white text-slate-900 pb-20">
        {/* Top Hero Landscape Banner */}
        <div className="mx-auto max-w-[1400px] px-5 pt-3">
          <section className="relative h-[300px] sm:h-[360px] md:h-[400px] w-full overflow-hidden rounded-[20px] bg-slate-900 shadow-md">
            <img
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80"
              alt="Panoramic mountain view"
              className="animate-tourvaa-hero h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-900/15" />
          </section>
        </div>

        {/* 2-Column Contact Showcase */}
        <div className="mx-auto max-w-[1400px] px-5 pt-8 sm:pt-10">
          <div data-reveal="scale" className="relative overflow-hidden rounded-[24px] bg-slate-900 shadow-xl min-h-[640px]">
            <img
              src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80"
              alt="Misty alpine mountain needles landscape"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-slate-950/20 to-slate-950/60" />

            <div className="relative grid min-h-[640px] items-stretch lg:grid-cols-[560px_1fr] p-4 sm:p-6 lg:p-8 gap-6">
              {/* Left Form Card */}
              <div className="rounded-[20px] bg-white p-6 sm:p-8 lg:p-9 shadow-2xl flex flex-col justify-center">
                {sent ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <CheckCircle size={36} />
                    </span>
                    <h2 className="mt-5 text-2xl font-black text-slate-950">Message Sent!</h2>
                    <p className="mt-2.5 max-w-sm text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                      Thank you for contacting Tourvaa. One of our local advisors will contact you within 24 hours.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSent(false);
                        setForm(INITIAL_FORM);
                      }}
                      className="mt-6 rounded-xl bg-[#0B1527] px-6 py-3 text-xs font-black text-white shadow-md hover:bg-[#15233C]"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                      Contact Us
                    </h2>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                      Fill out the form below and one of our local advisors will contact you within 24 hours.
                    </p>

                    {error && (
                      <div
                        role="alert"
                        className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-600"
                      >
                        <AlertCircle size={15} />
                        {error}
                      </div>
                    )}

                    <form onSubmit={submit} className="mt-5 space-y-4">
                      {/* Reservation query */}
                      <div>
                        <span className="block text-xs font-bold text-slate-900">
                          Do you have a reservation number?
                        </span>
                        <div className="mt-2 flex items-center gap-6 text-xs font-medium text-slate-700">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="reservation"
                              value="yes"
                              checked={form.reservation === "yes"}
                              onChange={() => set("reservation", "yes")}
                              className="accent-[#0B1527]"
                            />
                            <span>Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="reservation"
                              value="no"
                              checked={form.reservation === "no"}
                              onChange={() => set("reservation", "no")}
                              className="accent-[#0B1527]"
                            />
                            <span>No</span>
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700">
                            Full Name
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. James Anderson"
                            value={form.name}
                            onChange={(e) => set("name", e.target.value)}
                            className={`mt-1 ${INPUT_CLASS}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            value={form.phone}
                            onChange={(e) => set("phone", e.target.value)}
                            className={`mt-1 ${INPUT_CLASS}`}
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
                          placeholder="james@travelagency.com"
                          value={form.email}
                          onChange={(e) => set("email", e.target.value)}
                          className={`mt-1 ${INPUT_CLASS}`}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700">
                          Subject
                        </label>
                        <div className="relative mt-1">
                          <select
                            value={form.subject}
                            onChange={(e) => set("subject", e.target.value)}
                            className={`appearance-none pr-10 ${INPUT_CLASS}`}
                          >
                            <option value="">Select a trip category or general inquiry</option>
                            <option value="Tour Booking & Reservations">Tour Booking &amp; Reservations</option>
                            <option value="Custom Private Tour Request">Custom Private Tour Request</option>
                            <option value="Payment & Billing Support">Payment &amp; Billing Support</option>
                            <option value="Flight & Hotel Transfers">Flight &amp; Hotel Transfers</option>
                            <option value="General Question">General Question</option>
                          </select>
                          <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700">
                          Message
                        </label>
                        <textarea
                          required
                          rows={3}
                          placeholder="Tell us about your travel plans, destinations, and estimated dates..."
                          value={form.message}
                          onChange={(e) => set("message", e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0B1527] focus:ring-4 focus:ring-[#0B1527]/10 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-[#0B1527] px-6 text-sm font-black text-white shadow-md transition hover:bg-[#15233C] disabled:opacity-60"
                      >
                        {submitting ? "Sending..." : "Send Message"}
                      </button>

                      <p className="text-center text-[11px] text-slate-400">
                        Prefer a direct call? Visit our Direct Contact section.
                      </p>
                    </form>
                  </>
                )}
              </div>

              {/* Right Content Overlay */}
              <div className="flex flex-col justify-end p-6 sm:p-10 text-white">
                <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                  Get in touch with us
                </h2>
                <p className="mt-3 max-w-md text-sm sm:text-base leading-relaxed text-white/90 font-medium">
                  Whether you have questions about a tour, need help with a booking, or want personalised travel advice — our expert team is here to help.
                </p>

                <div className="mt-8 flex items-center gap-10 border-t border-white/20 pt-6">
                  <div>
                    <span className="block text-3xl font-black text-white">24hrs</span>
                    <span className="block text-xs font-semibold text-white/70">
                      Average response time
                    </span>
                  </div>
                  <div>
                    <span className="block text-3xl font-black text-white">4.9/5</span>
                    <span className="block text-xs font-semibold text-white/70">
                      Customer satisfaction
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Newsletter Subscribe Banner */}
          <div data-reveal className="mt-16 sm:mt-20">
            <section className="rounded-[24px] border border-slate-100/90 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                    Get Travel Tips Straight to Your Inbox
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium">
                    Subscribe to receive tactical gear updates, packing checklists, and sudden destination safety bulletins.
                  </p>
                </div>

                <form onSubmit={subscribe} className="flex w-full max-w-md items-center gap-3">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="h-12 flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0B1527] focus:bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={subscribing}
                    className="h-12 rounded-xl bg-[#0B1527] px-6 text-sm font-black text-white shadow-md hover:bg-[#15233C] transition disabled:opacity-60"
                  >
                    {subscribing ? "Subscribing..." : "Subscribe"}
                  </button>
                </form>
              </div>
              {newsletterMessage && (
                <p className="mt-3 text-xs font-bold text-emerald-600">{newsletterMessage}</p>
              )}
            </section>
          </div>
        </div>
      </main>
    </AboutReveal>
  );
}
