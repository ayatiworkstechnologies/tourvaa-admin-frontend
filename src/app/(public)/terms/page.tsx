import Link from "next/link";

import ConfiguredSupportEmail from "@/components/public/ConfiguredSupportEmail";
import LegalPageLayout, { LegalBullets, type LegalSection } from "@/components/public/LegalPageLayout";

const CANCELLATION_TIERS = [
  { window: "More than 60 days", refund: "Full refund minus a 3% platform processing fee" },
  { window: "30-59 days", refund: "75% of the total booking value" },
  { window: "14-29 days", refund: "50% of the total booking value" },
  { window: "7-13 days", refund: "25% of the total booking value" },
  { window: "Less than 7 days", refund: "No refund" },
];

const sections: LegalSection[] = [
  {
    id: "tourvaas-role",
    number: 1,
    label: "Tourvaa's Role",
    body: (
      <>
        <p>
          Tourvaa is an online travel marketplace that connects travellers with independent tour operators, activity
          providers, accommodation providers, transport providers, and other travel suppliers.
        </p>
        <p>
          Unless a booking confirmation states otherwise, Tourvaa acts as a booking platform and intermediary and
          does not directly operate the travel service.
        </p>
      </>
    ),
  },
  {
    id: "eligibility-and-accounts",
    number: 2,
    label: "Eligibility and Accounts",
    body: (
      <>
        <p>You must be at least 18 years old to create an account or make a booking.</p>
        <p>
          You must provide accurate information, keep your login credentials secure, and notify Tourvaa immediately
          if you suspect unauthorised access to your account.
        </p>
        <p>
          When booking for other travellers, you confirm that you have their permission and accept responsibility
          for their conduct, itinerary and payment.
        </p>
      </>
    ),
  },
  {
    id: "bookings-and-confirmation",
    number: 3,
    label: "Bookings and Confirmation",
    body: (
      <>
        <p>A booking is confirmed only after:</p>
        <LegalBullets
          items={[
            "The required payment has been received.",
            "The relevant supplier has accepted the booking.",
            "Tourvaa has issued a booking confirmation.",
          ]}
        />
        <p>Availability may change before confirmation.</p>
        <p>
          You should check the itinerary, traveller details, inclusions, exclusions, meeting information, and
          supplier-specific conditions immediately after receiving confirmation.
        </p>
      </>
    ),
  },
  {
    id: "prices-and-payments",
    number: 4,
    label: "Prices and Payments",
    body: (
      <>
        <p>The final payable amount will be displayed at checkout.</p>
        <p>
          Currency conversions shown on the platform are estimates. Your bank or payment provider may charge
          additional currency-conversion or transaction fees.
        </p>
        <p>Tourvaa may correct obvious technical, availability, or pricing errors. Where an error occurs, Tourvaa may offer:</p>
        <LegalBullets items={["The booking at the corrected price.", "A suitable alternative.", "A refund of the amount paid."]} />
      </>
    ),
  },
  {
    id: "cancellations-changes-refunds",
    number: 5,
    label: "Cancellations, Changes and Refunds",
    body: (
      <>
        <p>The cancellation policy displayed on the relevant tour page or during checkout will apply to the booking.</p>
        <p>Where no stricter supplier cancellation policy applies, the following standard cancellation policy applies:</p>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-2.5 font-bold text-slate-700">Cancellation Window</th>
                <th className="px-4 py-2.5 font-bold text-slate-700">Refund</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {CANCELLATION_TIERS.map((tier) => (
                <tr key={tier.window}>
                  <td className="px-4 py-2.5 font-semibold text-slate-900">{tier.window}</td>
                  <td className="px-4 py-2.5 text-slate-600">{tier.refund}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>Cancellation requests must be submitted through the My Bookings section.</p>
        <p>Approved refunds will normally be returned to the original payment method within 7-14 business days.</p>
        <p>Non-refundable costs may include:</p>
        <LegalBullets
          items={[
            "Supplier cancellation charges.",
            "Visa fees.",
            "Insurance fees.",
            "Permits.",
            "Flight or train tickets.",
            "Hotel charges.",
            "Attraction or event tickets.",
            "Payment processing charges.",
            "Other costs already committed for the booking.",
          ]}
        />
        <p>No-shows and unused services are not refundable.</p>
        <p>
          Where a supplier cancels the complete service, Tourvaa will provide a suitable alternative or facilitate a
          refund, subject to applicable law and supplier conditions.
        </p>
        <p>Booking changes are subject to supplier approval, availability, applicable administration charges, and price differences.</p>
      </>
    ),
  },
  {
    id: "traveller-responsibilities",
    number: 6,
    label: "Traveller Responsibilities",
    body: (
      <>
        <p>Travellers are responsible for obtaining and carrying all documentation required for their journey, including:</p>
        <LegalBullets
          items={[
            "Valid passports.",
            "Visas.",
            "Immigration permissions.",
            "Vaccination certificates.",
            "Travel insurance.",
            "Driving licenses.",
            "Activity permits.",
            "Health documentation.",
          ]}
        />
        <p>Travellers must assess whether a tour is suitable for their age, health, fitness, and mobility.</p>
        <p>Any relevant medical condition, accessibility requirement, allergy, pregnancy, or dietary requirement must be disclosed before booking.</p>
        <p>Tourvaa is not responsible where a traveller cannot participate due to missing, expired, inaccurate, or invalid documentation.</p>
      </>
    ),
  },
  {
    id: "safety-conduct-insurance",
    number: 7,
    label: "Safety, Conduct and Insurance",
    body: (
      <>
        <p>
          Travel involves risks related to weather, transportation, activities, vehicle locations, wildlife, local
          conditions, or limited medical facilities.
        </p>
        <p>Travellers must:</p>
        <LegalBullets
          items={[
            "Follow lawful instructions from suppliers and tour guides.",
            "Follow safety procedures.",
            "Use provided safety equipment.",
            "Respect local laws and customs.",
            "Avoid unlawful, abusive, dangerous, or disruptive behaviour.",
          ]}
        />
        <p>
          A traveller may be removed from a tour without a refund where their behaviour creates risk, causes serious
          disruption, damages property, or violates applicable law.
        </p>
        <p>Travellers may be responsible for any loss or damage caused by their actions.</p>
        <p>
          Comprehensive travel insurance covering medical emergencies, cancellation, trip interruption, baggage, and
          planned activities is strongly recommended.
        </p>
      </>
    ),
  },
  {
    id: "changes-and-force-majeure",
    number: 8,
    label: "Changes and Force Majeure",
    body: (
      <>
        <p>Routes, schedules, accommodation, transportation, or activities may be reasonably changed due to:</p>
        <LegalBullets
          items={[
            "Safety concerns.",
            "Weather conditions.",
            "Supplier availability.",
            "Transport disruption.",
            "Local events.",
            "Government restrictions.",
            "Operational requirements.",
          ]}
        />
        <p>Tourvaa and its suppliers are not responsible for delays, changes, or failure to provide services caused by events outside their reasonable control.</p>
        <p>Such events may include:</p>
        <LegalBullets
          items={[
            "Natural disasters.",
            "Epidemics or pandemics.",
            "War or terrorism.",
            "Civil unrest.",
            "Government restrictions.",
            "Border closures.",
            "Strikes.",
            "Severe weather.",
            "Major transport disruption.",
          ]}
        />
        <p>
          Depending on the circumstances, travellers may be offered an alternative service, travel credit,
          postponement, or partial refund in accordance with supplier conditions and applicable law.
        </p>
      </>
    ),
  },
  {
    id: "suppliers-agents-affiliates",
    number: 9,
    label: "Suppliers, Agents and Affiliates",
    body: (
      <>
        <p>Suppliers, agents, and affiliates must:</p>
        <LegalBullets
          items={[
            "Provide accurate information.",
            "Maintain required licences and insurance.",
            "Protect traveller information.",
            "Honour confirmed bookings.",
            "Follow applicable laws.",
            "Pay agreed fees and commissions.",
            "Avoid misleading or unauthorised marketing.",
            "Avoid fraudulent bookings or content.",
          ]}
        />
        <p>Tourvaa may suspend accounts, remove listings, withhold commissions, or terminate a partnership where a partner breaches these Terms.</p>
      </>
    ),
  },
  {
    id: "intellectual-property",
    number: 10,
    label: "Intellectual Property and Prohibited Use",
    body: (
      <>
        <p>Tourvaa&apos;s branding, software, layout, design, text, and original content are owned by Tourvaa or its licensors.</p>
        <p>Users must not:</p>
        <LegalBullets
          items={[
            "Copy or reproduce Tourvaa content without permission.",
            "Scrape or automatically extract platform data.",
            "Reverse engineer platform security.",
            "Interfere with platform security.",
            "Upload malicious code.",
            "Create fraudulent bookings.",
            "Misuse promotional offers.",
            "Use the platform for unlawful purposes.",
          ]}
        />
      </>
    ),
  },
  {
    id: "liability",
    number: 11,
    label: "Liability",
    body: (
      <>
        <p>To the maximum extent permitted by law, Tourvaa is not responsible for indirect, incidental, or consequential losses.</p>
        <p>Tourvaa is not responsible for the independent acts or omissions of third-party suppliers, except where applicable law requires otherwise.</p>
        <p>Tourvaa&apos;s total liability relating to a booking will not exceed the amount paid through the platform for the affected booking.</p>
        <p>Nothing in these Terms excludes consumer rights or liabilities that cannot legally be excluded.</p>
      </>
    ),
  },
  {
    id: "privacy-and-communications",
    number: 12,
    label: "Privacy and Communications",
    body: (
      <>
        <p>
          Tourvaa handles personal information according to the{" "}
          <Link href="/privacy-policy" className="font-semibold text-blue-600 hover:underline">
            Tourvaa Privacy Policy
          </Link>
          .
        </p>
        <p>Booking confirmations, vouchers, service updates, and important notices may be delivered through:</p>
        <LegalBullets items={["Email.", "SMS.", "Messaging services.", "App notifications.", "Dashboard notifications."]} />
        <p>Users are responsible for maintaining accurate contact information.</p>
      </>
    ),
  },
  {
    id: "complaints",
    number: 13,
    label: "Complaints",
    body: (
      <>
        <p>
          Any problem experienced during a tour should be reported immediately to the supplier, guide, or local
          representative so that they have an opportunity to resolve it.
        </p>
        <p>Unresolved complaints should be submitted within 30 days after the service ends.</p>
        <p>Complaints must include:</p>
        <LegalBullets
          items={[
            "Booking reference.",
            "Tour name.",
            "Travel dates.",
            "Details of the issue.",
            "Supporting photographs or documents.",
            "The resolution requested.",
          ]}
        />
        <p>
          Complaints may be sent to: <ConfiguredSupportEmail className="font-semibold text-blue-600 hover:underline" />
        </p>
      </>
    ),
  },
  {
    id: "governing-law",
    number: 14,
    label: "Governing Law, Updates and Contact",
    body: (
      <>
        <p>Tourvaa may update these Terms to reflect changes in service, technology, legal requirements, or business operations.</p>
        <p>The updated Terms will be published with a revised effective date.</p>
        <p>
          These Terms are governed by the laws of the United Arab Emirates, and disputes are subject to the courts
          of Dubai, unless mandatory consumer-protection laws require otherwise.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms & Conditions"
      subtitle="Everything you need to know before you go - from bookings and payments to cancellations and traveller responsibilities."
      intro="By accessing Tourvaa, creating an account, applying as a partner, or making a booking, you agree to these Terms and Conditions. These Terms apply to travellers, suppliers, accommodation providers, transport providers, and other travel suppliers."
      sections={sections}
    />
  );
}
