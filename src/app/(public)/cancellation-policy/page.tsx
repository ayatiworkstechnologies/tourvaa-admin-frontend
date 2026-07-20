import Link from "next/link";

const tiers = [
  { window: "More than 60 days before departure", refund: "Full refund minus platform processing fee (3%)" },
  { window: "30–59 days before departure", refund: "75% refund of total booking value" },
  { window: "14–29 days before departure", refund: "50% refund of total booking value" },
  { window: "7–13 days before departure", refund: "25% refund of total booking value" },
  { window: "Less than 7 days before departure", refund: "No refund (0%)" },
];

export default function CancellationPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <section className="bg-[#063c42] pb-14 pt-32 text-white">
        <div className="mx-auto max-w-4xl px-5 md:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-400">Policy</p>
          <h1 className="mt-2 text-4xl font-bold">Cancellation Policy</h1>
          <p className="mt-3 text-sm text-white/60">Last updated: June 2026</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-5 py-12 md:px-8">
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-7 shadow-sm ring-1 border border-slate-100 shadow-sm ring-0">
            <h2 className="mb-4 font-bold text-zinc-950">Standard Cancellation Schedule</h2>
            <p className="mb-5 text-sm leading-6 text-zinc-500">
              The following cancellation schedule applies to most Tourvaa bookings. Individual tours may have more restrictive policies - always check the specific policy shown on the tour detail page before booking.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="rounded-tl-xl px-4 py-3 text-left text-xs font-bold uppercase text-zinc-500">Cancellation Window</th>
                    <th className="rounded-tr-xl px-4 py-3 text-left text-xs font-bold uppercase text-zinc-500">Refund Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {tiers.map((t, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 font-semibold text-zinc-950">{t.window}</td>
                      <td className={`px-4 py-3 ${i === tiers.length - 1 ? "text-red-500 font-bold" : "text-emerald-600 font-semibold"}`}>{t.refund}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {[
            ["How to Cancel", "To cancel a booking, log into your Tourvaa account, navigate to My Bookings, and select Cancel Booking. Cancellations must be initiated through the platform to qualify for a refund. Email or phone cancellations are not accepted as the official cancellation method.\n\nRefunds are processed within 7–14 business days to the original payment method. In some cases, processing times may vary based on your bank or card issuer."],
            ["Force Majeure", "In the event of government travel advisories, natural disasters, pandemics, or other force majeure circumstances that make a tour impossible to operate, Tourvaa will offer either a full credit note (valid for 12 months) or a partial refund at our discretion in accordance with applicable UAE consumer protection law."],
            ["Supplier-Initiated Cancellations", "If a tour is cancelled by the supplier for any reason, you are entitled to a full refund of the amount paid, including the platform fee. We will notify you immediately and, where possible, offer alternative tour options of comparable value."],
            ["No-Show Policy", "Failure to appear at the confirmed departure point at the specified time is treated as a cancellation within 7 days. No refund will be issued for no-shows."],
            ["Travel Insurance", "We strongly recommend purchasing comprehensive travel insurance that covers trip cancellation, medical emergencies, and personal liability. Tourvaa does not provide travel insurance but can refer you to approved insurance partners."],
          ].map(([title, text]) => (
            <div key={String(title)} className="rounded-2xl bg-white p-7 shadow-sm ring-1 border border-slate-100 shadow-sm ring-0">
              <h2 className="mb-3 font-bold text-zinc-950">{String(title)}</h2>
              <p className="whitespace-pre-line text-sm leading-7 text-zinc-500">{String(text)}</p>
            </div>
          ))}

          <div className="rounded-xl bg-teal-50 p-5 text-sm text-zinc-600">
            Questions about a cancellation?{" "}
            <Link href="/contact" className="font-bold text-teal-600 hover:underline">Contact us</Link>{" "}
            or email <a href="mailto:hello@tourvaa.com" className="font-bold text-teal-600 hover:underline">hello@tourvaa.com</a>.
          </div>
        </div>
      </div>
    </main>
  );
}
