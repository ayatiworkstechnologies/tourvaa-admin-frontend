"use client";

import { useState } from "react";
import { CheckCircle2, Mail, MapPinned, MessageSquare, Phone } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setSent(true);
    setSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-[#F7F9FC] pb-20">
      <section className="bg-[#0F172A] py-14 text-white">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#43A9F6]">Contact</p>
          <h1 className="mt-2 text-4xl font-bold">Get in touch</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
            Whether you have a tour enquiry, partnership question, or just need help planning your trip — our team will get back to you within 24 hours.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[400px_1fr]">
          {/* Contact info */}
          <aside className="space-y-5">
            {[
              [Mail, "Email us", "hello@tourvaa.com", "We reply within 24 hours on business days."],
              [Phone, "Call us", "+971 4 123 4567", "Available Sun–Thu, 9am–6pm GST."],
              [MapPinned, "Our office", "Dubai, UAE", "Registered in DWTC Free Zone."],
            ].map(([Icon, label, value, note]) => {
              const I = Icon as typeof Mail;
              return (
                <div key={String(label)} className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#E7EAF0]">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E7F5FF] text-[#0284C7]">
                    <I size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-[#667085]">{String(label)}</p>
                    <p className="mt-0.5 font-bold text-[#121826]">{String(value)}</p>
                    <p className="mt-0.5 text-xs text-[#98A2B3]">{String(note)}</p>
                  </div>
                </div>
              );
            })}

            <div className="rounded-2xl bg-[#0284C7] p-5 text-white">
              <MessageSquare size={20} className="text-white/80" />
              <p className="mt-3 font-bold">Urgent travel support?</p>
              <p className="mt-1 text-sm text-white/80">For in-trip emergencies, use the live chat widget in the bottom-right corner of this page.</p>
            </div>
          </aside>

          {/* Contact form */}
          <div className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-[#E7EAF0]">
            {sent ? (
              <div className="flex flex-col items-center py-12 text-center">
                <CheckCircle2 size={48} className="text-emerald-500" />
                <p className="mt-4 text-xl font-bold text-[#121826]">Message sent!</p>
                <p className="mt-2 text-sm text-[#667085]">We will get back to you within 24 hours on business days.</p>
                <button type="button" onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }} className="mt-6 rounded-xl border border-[#E7EAF0] px-5 py-2.5 text-sm font-bold text-[#667085] hover:bg-[#F7F9FC]">
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <h2 className="mb-5 text-lg font-bold text-[#121826]">Send a message</h2>
                <form onSubmit={submit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-[#667085]">Name</label>
                      <input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your full name" className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-[#43A9F6]" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-[#667085]">Email</label>
                      <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-[#43A9F6]" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-[#667085]">Subject</label>
                    <input required value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="How can we help?" className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-[#43A9F6]" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-[#667085]">Message</label>
                    <textarea required rows={6} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Tell us more about your enquiry…" className="w-full resize-none rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-[#43A9F6]" />
                  </div>
                  <button type="submit" disabled={submitting} className="w-full rounded-xl bg-[#0284C7] py-3.5 text-sm font-bold text-white hover:bg-[#0369A1] disabled:opacity-60">
                    {submitting ? "Sending…" : "Send Message"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
