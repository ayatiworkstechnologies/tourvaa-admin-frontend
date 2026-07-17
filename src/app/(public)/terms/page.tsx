import Link from "next/link";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: "By accessing or using the Tourvaa platform (the \"Service\"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the Service. These terms apply to all visitors, registered users, and partners including suppliers, agents, and affiliates.",
  },
  {
    title: "2. Definitions",
    content: "\"Tourvaa\", \"we\", \"our\", or \"us\" refers to Tourvaa NZ LLC, registered in the Dubai World Trade Centre Free Zone, UAE. \"User\" means any person who accesses the platform. \"Tour\" means any travel product or service listed by a verified supplier. \"Booking\" means a confirmed reservation for a tour.",
  },
  {
    title: "3. Account Registration",
    content: "To access booking and account features, you must register and provide accurate, complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us immediately at hello@tourvaa.com if you suspect unauthorised access.",
  },
  {
    title: "4. Bookings and Payments",
    content: "All bookings are subject to availability and confirmation by the relevant supplier. Payment terms, including deposit and balance schedules, will be specified at the time of booking. Prices displayed are inclusive of applicable taxes unless stated otherwise. Payment is processed in AED unless a different currency is shown.",
  },
  {
    title: "5. Cancellations and Refunds",
    content: "Cancellation and refund terms vary by tour and supplier. The specific policy applicable to your booking will be displayed before you confirm your reservation. Tourvaa's platform fee (where applicable) is non-refundable. We are not liable for supplier-initiated cancellations but will work to facilitate alternatives or refunds according to the supplier's policy.",
  },
  {
    title: "6. Supplier and Agent Conduct",
    content: "Partners accessing the Tourvaa platform as suppliers or agents agree to maintain accurate listings, respond to bookings within the specified timeframe, and comply with all applicable laws. Misrepresentation of tour content, fraudulent bookings, or conduct harmful to customers will result in account suspension.",
  },
  {
    title: "7. Intellectual Property",
    content: "All content on the Tourvaa platform — including text, images, logos, and software — is the property of Tourvaa NZ LLC or its licensors and is protected by copyright law. You may not reproduce, distribute, or create derivative works without express written permission.",
  },
  {
    title: "8. Limitation of Liability",
    content: "Tourvaa acts as a technology platform connecting travellers with tour suppliers. We are not the tour operator for listed tours and are not liable for any death, injury, loss, or damage arising from tour participation. Our total liability to any user shall not exceed the amount paid for the specific booking in question.",
  },
  {
    title: "9. Governing Law",
    content: "These terms are governed by the laws of the UAE. Any disputes shall be resolved through the courts of Dubai or through arbitration in accordance with the DIAC rules, at Tourvaa's election.",
  },
  {
    title: "10. Changes to Terms",
    content: "We may update these terms from time to time. We will notify registered users of material changes by email or in-platform notification. Continued use of the Service after changes constitutes acceptance of the revised terms.",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <section className="bg-[#063c42] pb-14 pt-32 text-white">
        <div className="mx-auto max-w-4xl px-5 md:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-400">Legal</p>
          <h1 className="mt-2 text-4xl font-bold">Terms & Conditions</h1>
          <p className="mt-3 text-sm text-white/60">Last updated: June 2026</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-5 py-12 md:px-8">
        <div className="rounded-2xl bg-white p-7 shadow-sm ring-1 border border-slate-100 shadow-sm ring-0 md:p-10">
          <p className="mb-8 text-sm leading-7 text-zinc-500">
            Please read these Terms and Conditions carefully before using the Tourvaa platform. These terms constitute a legally binding agreement between you and Tourvaa NZ LLC.
          </p>
          <div className="space-y-8">
            {sections.map((s) => (
              <section key={s.title}>
                <h2 className="mb-2 font-bold text-zinc-950">{s.title}</h2>
                <p className="text-sm leading-7 text-zinc-500">{s.content}</p>
              </section>
            ))}
          </div>
          <div className="mt-10 rounded-xl bg-slate-50 p-5 text-sm text-zinc-500">
            Questions about these terms? Contact us at{" "}
            <a href="mailto:hello@tourvaa.com" className="font-semibold text-teal-600 hover:underline">hello@tourvaa.com</a>{" "}
            or visit our <Link href="/contact" className="font-semibold text-teal-600 hover:underline">Contact page</Link>.
          </div>
        </div>
      </div>
    </main>
  );
}
