import Link from "next/link";
import ConfiguredSupportEmail from "@/components/public/ConfiguredSupportEmail";
import LegalPageLayout, { LegalBullets, type LegalSection } from "@/components/public/LegalPageLayout";

const tiers = [
  { window: "More than 60 days before departure", refund: "Full refund minus platform processing fee (3%)", color: "text-emerald-700 bg-emerald-50" },
  { window: "30–59 days before departure", refund: "75% refund of total booking value", color: "text-emerald-700 bg-emerald-50" },
  { window: "14–29 days before departure", refund: "50% refund of total booking value", color: "text-amber-700 bg-amber-50" },
  { window: "7–13 days before departure", refund: "25% refund of total booking value", color: "text-amber-700 bg-amber-50" },
  { window: "Less than 7 days before departure", refund: "No refund (0%)", color: "text-rose-700 bg-rose-50" },
];

const sections: LegalSection[] = [
  {
    id: "cancellation-schedule",
    number: 1,
    label: "Standard Cancellation Schedule",
    body: (
      <>
        <p>
          The following cancellation schedule applies to most Tourvaa bookings. Individual tours may have custom or more restrictive operator policies — always verify the exact policy displayed on your specific tour detail page and booking voucher before confirming.
        </p>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
              <tr>
                <th className="px-4 py-3">Cancellation Window</th>
                <th className="px-4 py-3">Refund Eligibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {tiers.map((t, i) => (
                <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">{t.window}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-md px-2.5 py-1 text-xs font-bold ${t.color}`}>
                      {t.refund}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: "how-to-cancel",
    number: 2,
    label: "How to Cancel a Booking",
    body: (
      <>
        <p>
          To cancel an existing booking, log in to your Tourvaa account, go to{" "}
          <Link href="/profile/bookings" className="font-bold text-pub-secondary hover:underline">
            My Bookings
          </Link>
          , and select <strong>&quot;Cancel Booking&quot;</strong>.
        </p>
        <p>
          Cancellations must be initiated directly through the platform dashboard to qualify for an automated refund according to our schedule. Direct email or telephone requests may require manual verification.
        </p>
        <p>
          Approved refunds are processed within <strong>7–14 business days</strong> to the original payment method used during checkout. Depending on your financial institution, banking statement processing times may vary.
        </p>
      </>
    ),
  },
  {
    id: "force-majeure",
    number: 3,
    label: "Force Majeure & Unforeseen Events",
    body: (
      <>
        <p>
          In the event of official government travel advisories, natural disasters, severe weather events, border closures, or other force majeure circumstances rendering the tour impossible to operate safely:
        </p>
        <LegalBullets
          items={[
            "Tourvaa will coordinate with the local operator to issue either a full credit voucher (valid for 12 months) or a partial monetary refund.",
            "Any adjustments are made in accordance with applicable consumer protection laws and international airline/operator rules.",
            "Local flight or transportation legs booked independently outside Tourvaa are subject to their respective carrier terms.",
          ]}
        />
      </>
    ),
  },
  {
    id: "supplier-cancellations",
    number: 4,
    label: "Supplier & Operator-Initiated Cancellations",
    body: (
      <>
        <p>
          If an operator or supplier cancels a tour due to minimum participant thresholds not being met, extreme weather warnings, or unforeseen technical reasons:
        </p>
        <LegalBullets
          items={[
            "You are entitled to a 100% full refund of the total amount paid, including the platform fee.",
            "Tourvaa will notify you immediately via email and SMS.",
            "Where feasible, our concierge team will present alternative departures or comparable itineraries with equivalent inclusions.",
          ]}
        />
      </>
    ),
  },
  {
    id: "no-show-policy",
    number: 5,
    label: "No-Show & Late Arrival Policy",
    body: (
      <>
        <p>
          Failure to appear at the confirmed meeting point or departure location at the scheduled time is categorized as a <strong>&quot;No-Show&quot;</strong>.
        </p>
        <p>
          No-shows are treated as cancellations made with less than 7 days notice and are non-refundable. If you encounter unexpected transit delays, message the tour operator immediately through your Tourvaa booking dashboard.
        </p>
      </>
    ),
  },
  {
    id: "travel-insurance",
    number: 6,
    label: "Comprehensive Travel Insurance Recommendation",
    body: (
      <>
        <p>
          We strongly advise all travelers to obtain comprehensive travel medical, trip cancellation, and baggage insurance before departure. Travel insurance covers many non-refundable occurrences, including personal medical emergencies and family disruptions.
        </p>
        <p>
          Questions about your cancellation? Contact our support desk through the{" "}
          <Link href="/contact" className="font-bold text-pub-secondary hover:underline">
            Contact Us
          </Link>{" "}
          page or email <ConfiguredSupportEmail className="font-bold text-pub-secondary hover:underline" />.
        </p>
      </>
    ),
  },
];

export default function CancellationPolicyPage() {
  return (
    <LegalPageLayout
      eyebrow="Booking Guarantee & Rules"
      title="Cancellation Policy"
      subtitle="Understand your rights, refund timelines, and standard cancellation windows for all tours and travel packages booked through Tourvaa."
      intro="Our cancellation rules are designed to ensure fair terms for both adventurous travelers and independent local tour operators."
      sections={sections}
      lastUpdated="September 2026"
    />
  );
}
