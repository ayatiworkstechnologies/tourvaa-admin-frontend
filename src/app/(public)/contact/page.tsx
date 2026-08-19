"use client";

/* eslint-disable @next/next/no-img-element */

import { FormEvent, useState } from "react";
import {
  LuCircleAlert as AlertCircle,
  LuCircleCheckBig as CheckCircle,
  LuSend as Send,
} from "react-icons/lu";

import AboutReveal from "@/components/public/AboutReveal";
import publicApi, { subscribeNewsletter } from "@/lib/api/publicClient";
import { usePublicSettings } from "@/providers/PublicSettingsProvider";

const INPUT_CLASS = "min-h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

const INITIAL_FORM = {
  reservation: "no",
  name: "",
  phone: "",
  email: "",
  subject: "",
  message: "",
};

export default function ContactPage() {
  const { companyAddress, supportEmail, supportPhone, supportPhoneHref } = usePublicSettings();
  const [form, setForm] = useState(INITIAL_FORM);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");

  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await publicApi.post("/contact", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        enquiry_type: form.subject,
        subject: form.subject,
        message: `Reservation number: ${form.reservation === "yes" ? "Yes" : "No"}\n\n${form.message}`,
      });
      setSent(true);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof message === "string" ? message : "Could not send your message. Please try again or contact us directly.");
    } finally {
      setSubmitting(false);
    }
  }

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newsletterEmail.trim()) return;
    try {
      await subscribeNewsletter(newsletterEmail.trim());
      setNewsletterMessage("Thank you — travel tips are on their way!");
      setNewsletterEmail("");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setNewsletterMessage(typeof message === "string" ? message : "Could not subscribe right now. Please try again.");
    }
  }

  return (
    <AboutReveal>
      <main className="overflow-hidden bg-white text-[#111827]">
        <section className="relative mt-20 h-[260px] overflow-hidden sm:h-[330px] lg:h-[390px]">
          <img src="/images/destination-alpine.jpg" alt="Snow-covered mountains overlooking an alpine valley" className="animate-tourvaa-hero h-full w-full object-cover" />
          <div className="absolute inset-0 bg-slate-900/10" />
        </section>

        <section className="p-4 sm:p-6 lg:p-7">
          <div data-reveal="scale" className="relative mx-auto max-w-[1480px] overflow-hidden rounded-[28px] bg-slate-900 shadow-[0_20px_55px_rgba(15,23,42,.16)]">
            <img src="/images/destination-alpine.jpg" alt="Mist-covered mountain peaks" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/30 via-slate-900/10 to-slate-950/15" />

            <div className="relative grid min-h-[820px] gap-0 lg:grid-cols-[minmax(520px,700px)_1fr]">
              <div className="m-5 rounded-2xl bg-white p-6 shadow-2xl sm:m-7 sm:p-9 lg:m-6 lg:p-10">
                {sent ? (
                  <div className="flex h-full min-h-[640px] flex-col items-center justify-center text-center">
                    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle size={40} /></span>
                    <h1 className="mt-6 text-3xl font-black">Message received</h1>
                    <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">Thank you for contacting Tourvaa. One of our local advisors will contact you within 24 hours.</p>
                    <button type="button" onClick={() => { setSent(false); setForm(INITIAL_FORM); }} className="mt-8 rounded-lg bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-500">Send another message</button>
                  </div>
                ) : (
                  <>
                    <h1 className="font-heading text-3xl font-black tracking-tight sm:text-4xl">Contact Us</h1>
                    <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">Fill out the form below and one of our local advisors will contact you within 24 hours.</p>

                    {error && <div role="alert" className="mt-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600"><AlertCircle size={17} />{error}</div>}

                    <form onSubmit={submit} className="mt-8">
                      <fieldset className="border-b border-slate-200 pb-6">
                        <legend className="text-sm font-black text-slate-800">Do you have a reservation number?</legend>
                        <div className="mt-4 flex gap-7">
                          {["yes", "no"].map((option) => (
                            <label key={option} className="flex cursor-pointer items-center gap-3 text-sm font-semibold capitalize">
                              <input type="radio" name="reservation" value={option} checked={form.reservation === option} onChange={(event) => set("reservation", event.target.value)} className="h-5 w-5 accent-blue-600" />
                              {option}
                            </label>
                          ))}
                        </div>
                      </fieldset>

                      <div className="mt-7 grid gap-5 sm:grid-cols-2">
                        <label><span className="mb-2 block text-xs font-bold">Full Name</span><input required value={form.name} onChange={(event) => set("name", event.target.value)} placeholder="e.g. James Anderson" className={INPUT_CLASS} /></label>
                        <label><span className="mb-2 block text-xs font-bold">Phone Number</span><input required type="tel" value={form.phone} onChange={(event) => set("phone", event.target.value)} placeholder="+1 (555) 000-0000" className={INPUT_CLASS} /></label>
                      </div>
                      <label className="mt-5 block"><span className="mb-2 block text-xs font-bold">Email Address</span><input required type="email" value={form.email} onChange={(event) => set("email", event.target.value)} placeholder="james@travelagency.com" className={INPUT_CLASS} /></label>
                      <label className="mt-5 block"><span className="mb-2 block text-xs font-bold">Subject</span><select required value={form.subject} onChange={(event) => set("subject", event.target.value)} className={`${INPUT_CLASS} appearance-auto`}><option value="" disabled>Select a trip category or general inquiry</option><option>Trip planning</option><option>Existing booking</option><option>Payment support</option><option>Partnership</option><option>General inquiry</option></select></label>
                      <label className="mt-5 block"><span className="mb-2 block text-xs font-bold">Message</span><textarea required rows={6} value={form.message} onChange={(event) => set("message", event.target.value)} placeholder="Tell us about your travel plans, destinations, and estimated dates..." className={`${INPUT_CLASS} resize-none py-4`} /></label>

                      <button type="submit" disabled={submitting} className="mt-7 flex min-h-13 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
                        {submitting ? "Sending..." : <><Send size={16} /> Send Message</>}
                      </button>
                      <p className="mt-6 text-center text-sm text-slate-500">
                        {supportPhone ? <>Prefer a direct call? Call <a href={`tel:${supportPhoneHref}`} className="font-semibold text-blue-600 hover:underline">{supportPhone}</a>.</> : "Prefer another way to reach us? Send the form above and our team will reply."}
                      </p>
                    </form>
                  </>
                )}
              </div>

              <div className="relative flex min-h-[440px] items-end px-8 pb-10 text-white sm:px-12 lg:min-h-0 lg:px-10 lg:pb-12 xl:px-14">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/15 to-transparent lg:bg-gradient-to-t" />
                <div data-reveal="right" className="relative max-w-2xl">
                  <h2 className="font-heading text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Get in touch with us</h2>
                  <p className="mt-4 text-sm leading-6 text-white/75 sm:text-base">Whether you have questions about a tour, need help with a booking, or want personalised travel advice — our expert team is here to help.</p>
                  <div className="mt-7 grid max-w-lg grid-cols-2 border-t border-white/25 pt-7">
                    <div><strong className="block text-3xl font-black">24hrs</strong><span className="mt-2 block text-xs text-white/65">Average response time</span></div>
                    <div><strong className="block text-3xl font-black">4.9/5</strong><span className="mt-2 block text-xs text-white/65">Customer satisfaction</span></div>
                  </div>
                  {(supportEmail || supportPhone || companyAddress) && (
                    <address className="mt-7 space-y-1 border-t border-white/25 pt-6 text-sm not-italic text-white/75">
                      {supportEmail && <p><a href={`mailto:${supportEmail}`} className="hover:text-white hover:underline">{supportEmail}</a></p>}
                      {supportPhone && <p><a href={`tel:${supportPhoneHref}`} className="hover:text-white hover:underline">{supportPhone}</a></p>}
                      {companyAddress && <p>{companyAddress}</p>}
                    </address>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div data-reveal className="mx-auto flex max-w-[1320px] flex-col gap-8 px-5 py-12 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-16">
            <div>
              <h2 className="font-heading text-2xl font-black tracking-tight sm:text-3xl">Get Travel Tips Straight to Your Inbox</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Subscribe to receive tactical gear updates, packing checklists, and sudden destination safety bulletins.</p>
            </div>
            <form onSubmit={subscribe} className="w-full lg:max-w-[520px]">
              <div className="flex flex-col gap-3 sm:flex-row">
                <label htmlFor="contact-newsletter-email" className="sr-only">Email address</label>
                <input id="contact-newsletter-email" required type="email" value={newsletterEmail} onChange={(event) => { setNewsletterEmail(event.target.value); setNewsletterMessage(""); }} placeholder="Enter your email address" className="min-h-12 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" />
                <button type="submit" className="min-h-12 rounded-lg bg-blue-600 px-8 text-sm font-black text-white shadow-lg shadow-blue-600/15 transition hover:-translate-y-0.5 hover:bg-blue-500">Subscribe</button>
              </div>
              {newsletterMessage && <p role="status" className="mt-2 text-sm font-semibold text-emerald-600">{newsletterMessage}</p>}
            </form>
          </div>
        </section>
      </main>
    </AboutReveal>
  );
}
