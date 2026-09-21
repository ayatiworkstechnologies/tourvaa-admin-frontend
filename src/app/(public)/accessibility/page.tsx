import Link from "next/link";
import ConfiguredSupportEmail from "@/components/public/ConfiguredSupportEmail";
import LegalPageLayout, { LegalBullets, type LegalSection } from "@/components/public/LegalPageLayout";

const features = [
  { title: "Keyboard Navigation", desc: "All interactive elements, forms, modal dialogs, and navigation menus are fully operable via keyboard with clear outline focus indicators." },
  { title: "Screen Reader Support", desc: "Semantic HTML5, ARIA roles, and accessible names are structured for screen readers including NVDA, JAWS, and Apple VoiceOver." },
  { title: "Optimal Color Contrast", desc: "All textual and graphic user interface elements strictly adhere to WCAG 2.1 AA contrast ratios (minimum 4.5:1 for body copy)." },
  { title: "Responsive Fluid Scaling", desc: "The platform dynamically responds up to 200% zoom without truncation, horizontal clipping, or loss of booking functionality." },
  { title: "Descriptive Media Alt Text", desc: "Tour photography and destination imagery incorporate contextually meaningful alt descriptions for visually impaired guests." },
  { title: "Form Field Clarity & Errors", desc: "All form inputs provide unambiguous labels, error validation banners, and helper hints with explicit screen reader announcements." },
];

const sections: LegalSection[] = [
  {
    id: "our-commitment",
    number: 1,
    label: "Our Commitment to Accessible Travel",
    body: (
      <>
        <p>
          At Tourvaa, we believe exploring the world should be inclusive and accessible to everyone. We continually enhance our platform design and digital experience to ensure guests of all abilities can search, compare, book, and communicate with local tour operators with total ease.
        </p>
        <p>
          We conform our platform to the <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong> standards developed by the World Wide Web Consortium (W3C).
        </p>
      </>
    ),
  },
  {
    id: "digital-features",
    number: 2,
    label: "Implemented Digital Accessibility Features",
    body: (
      <div className="grid gap-4 sm:grid-cols-2 mt-2">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4">
            <h3 className="text-sm font-bold text-slate-950">{f.title}</h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed font-normal">{f.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "known-limitations",
    number: 3,
    label: "Third-Party Content & Known Limitations",
    body: (
      <>
        <p>
          While we strive for comprehensive accessibility across all touchpoints, some third-party embeds (such as dynamic map widgets, external bank authentication gateways, or operator video trailers) may have technical limitations outside our direct development control.
        </p>
        <p>
          We actively work alongside our technology partners and suppliers to encourage accessible standards across external booking components.
        </p>
      </>
    ),
  },
  {
    id: "feedback-and-support",
    number: 4,
    label: "Accessibility Feedback & Assistance Desk",
    body: (
      <>
        <p>
          If you encounter any accessibility barrier on Tourvaa, require assistance completing a reservation, or wish to request special dietary or mobility accommodations for an upcoming tour, our specialized accessibility desk is ready to support you:
        </p>
        <LegalBullets
          items={[
            "Direct Accessibility Email: accessibility@tourvaa.com",
            "General Support Desk: Available 24/7 through the Tourvaa Contact Hub",
            "Target Response Time: Within 24 hours on all accessibility inquiries",
          ]}
        />
        <p className="mt-3">
          You can also reach our general support team via{" "}
          <Link href="/contact" className="font-bold text-pub-secondary hover:underline">
            Contact Us
          </Link>{" "}
          or email <ConfiguredSupportEmail className="font-bold text-pub-secondary hover:underline" />.
        </p>
      </>
    ),
  },
];

export default function AccessibilityPage() {
  return (
    <LegalPageLayout
      eyebrow="Universal Inclusion"
      title="Accessibility Statement"
      subtitle="Tourvaa is dedicated to providing an inclusive, barrier-free digital booking platform for travelers of all abilities worldwide."
      intro="This statement reflects our ongoing dedication to WCAG 2.1 Level AA compliance and accessible adventure travel."
      sections={sections}
      lastUpdated="September 2026"
    />
  );
}
