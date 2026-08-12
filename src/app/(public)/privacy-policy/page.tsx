import Link from "next/link";

import ConfiguredSupportEmail from "@/components/public/ConfiguredSupportEmail";

const sections = [
  {
    title: "1. What this page covers",
    content: "This is a summary of how Tourvaa handles personal information. It is provided for transparency while our full, legally-drafted Privacy Policy is finalised. If you need the complete policy - for example for a compliance review or a partnership agreement - please contact us directly and we will provide it.",
  },
  {
    title: "2. Information we collect",
    content: "Account details you provide when registering (name, email, phone); booking and travel details needed to arrange your trip; payment information, processed securely by our payment providers (we do not store full card numbers); and usage data collected via cookies, described in our Cookie Policy.",
  },
  {
    title: "3. How we use it",
    content: "To create and manage your account, process bookings and payments, communicate with you about your trips, and improve the platform. We do not sell your personal information to third parties.",
  },
  {
    title: "4. Sharing with suppliers and partners",
    content: "To fulfil a booking, relevant details (such as traveller names and dates) are shared with the tour supplier or agent handling your trip. Payment processing is handled by our payment gateway partners under their own security standards.",
  },
  {
    title: "5. Your choices",
    content: "You can review and update your account details at any time from your dashboard, manage cookie preferences via your browser, and contact us to request access to, correction of, or deletion of your personal data.",
  },
  {
    title: "6. Contact",
    content: "For any privacy question, or to request the complete Privacy Policy document, contact us via our Contact page.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <section className="bg-[#063c42] pb-14 pt-32 text-white">
        <div className="mx-auto max-w-4xl px-5 md:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-400">Legal</p>
          <h1 className="mt-2 text-4xl font-bold">Privacy Policy</h1>
          <p className="mt-3 text-sm text-white/60">Summary - last updated: July 2026</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-5 py-12 md:px-8">
        <div className="rounded-2xl border border-slate-100 bg-white p-7 shadow-sm md:p-10">
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
            This page summarises our data practices in plain language. It is not the full legal Privacy Policy - contact us if you need the complete document.
          </div>
          <div className="space-y-8">
            {sections.map((s) => (
              <section key={s.title}>
                <h2 className="mb-2 font-bold text-zinc-950">{s.title}</h2>
                <p className="text-sm leading-7 text-zinc-500">{s.content}</p>
              </section>
            ))}
          </div>
          <div className="mt-10 rounded-xl bg-slate-50 p-5 text-sm text-zinc-500">
            See also our{" "}
            <Link href="/cookie-policy" className="font-semibold text-teal-600 hover:underline">Cookie Policy</Link>{" "}
            and{" "}
            <Link href="/terms" className="font-semibold text-teal-600 hover:underline">Terms &amp; Conditions</Link>.
            Questions? Visit our <Link href="/contact" className="font-semibold text-teal-600 hover:underline">Contact page</Link>.
            <ConfiguredSupportEmail prefix=" You can also email " suffix="." className="font-semibold text-teal-600 hover:underline" />
          </div>
        </div>
      </div>
    </main>
  );
}
