import Link from "next/link";

import ConfiguredSupportEmail from "@/components/public/ConfiguredSupportEmail";
import LegalPageLayout, { LegalBullets, type LegalSection } from "@/components/public/LegalPageLayout";

const sections: LegalSection[] = [
  {
    id: "information-we-collect",
    number: 1,
    label: "Information We Collect",
    body: (
      <>
        <p>Tourvaa may collect the following categories of information.</p>
        <LegalBullets
          items={[
            "Account and Contact Information: Name, Email address, Phone number, Country, Account credentials, Profile Information.",
            "Booking and Traveller Information: Destination, Travel dates, Passenger details, Travel preferences, Accommodation preferences, Special requests, Passport or identification information where required.",
            "Payment Information: Tourvaa may collect transaction references, payment status, billing information, refund details, and limited payment information.",
            "Partner Information: Suppliers, agents, and affiliates may be required to provide: Business information, Company registration details, Licence information, Tax details, Banking information, Identity-verification documents.",
            "Communications and Content: Support requests, Messages, Reviews, Ratings, Uploaded images or documents, Survey responses, Complaint information.",
            "Technical and Usage Information: IP address, Browser type, Device type, Operating system, Pages viewed, Referral source, Session activity, Search activity, Cookie identifiers, Error and performance information.",
            "Sensitive Information: Tourvaa may collect health, dietary, medical, or accessibility information only where you voluntarily provide it and it is necessary to arrange or deliver a travel service.",
          ]}
        />
      </>
    ),
  },
  {
    id: "how-we-collect-information",
    number: 2,
    label: "How We Collect Information",
    body: (
      <>
        <p>Tourvaa collects information:</p>
        <LegalBullets
          items={[
            "Directly from you.",
            "Automatically through the platform.",
            "Through cookies and similar technologies.",
            "From suppliers and agents.",
            "From payment providers.",
            "From identity-verification providers.",
            "From partners involved in your booking.",
          ]}
        />
      </>
    ),
  },
  {
    id: "how-we-use-information",
    number: 3,
    label: "How We Use Information",
    body: (
      <>
        <p>Tourvaa may use personal information to:</p>
        <LegalBullets
          items={[
            "Create and manage user accounts.",
            "Process and manage bookings.",
            "Process payments and refunds.",
            "Manage supplier, agent, and affiliate relationships.",
            "Share booking details with relevant service providers.",
            "Send booking confirmations and vouchers.",
            "Provide customer support.",
            "Send service and safety updates.",
            "Prevent fraud and protect accounts.",
            "Enforce Tourvaa policies.",
            "Comply with legal obligations.",
            "Analyse platform performance.",
            "Fix errors and technical issues.",
            "Improve search and user experience.",
            "Personalise content and recommendations.",
            "Send promotional communications where permitted.",
          ]}
        />
      </>
    ),
  },
  {
    id: "legal-grounds",
    number: 4,
    label: "Legal Grounds for Processing",
    body: (
      <>
        <p>Depending on the applicable law, Tourvaa may process personal information:</p>
        <LegalBullets
          items={[
            "To fulfil a contract.",
            "To comply with legal obligations.",
            "For legitimate business and security interests.",
            "To protect a person's vital interests.",
            "Based on your consent.",
          ]}
        />
        <p>Where processing is based on consent, you may withdraw that consent for future processing.</p>
        <p>Withdrawal of consent does not affect processing that occurred before the consent was withdrawn.</p>
      </>
    ),
  },
  {
    id: "when-we-share-information",
    number: 5,
    label: "When We Share Information",
    body: (
      <>
        <p>Tourvaa may share information with:</p>
        <LegalBullets
          items={[
            "Tour operators.",
            "Activity providers.",
            "Hotels and accommodation providers.",
            "Transport providers.",
            "Travel agents.",
            "Payment processors.",
            "Hosting and technology providers.",
            "Analytics providers.",
            "Communication providers.",
            "Customer-support providers.",
            "Identity-verification providers.",
            "Professional advisers.",
            "Insurers.",
            "Government or regulatory authorities.",
            "Parties involved in a corporate transaction.",
          ]}
        />
        <p>Tourvaa shares only the information reasonably necessary to provide the relevant service.</p>
        <p>Third-party recipients may process information according to their own privacy policies.</p>
        <p>Tourvaa does not sell personal information.</p>
      </>
    ),
  },
  {
    id: "international-data-transfers",
    number: 6,
    label: "International Data Transfers",
    body: (
      <>
        <p>Travel bookings may require personal information to be transferred to suppliers or service providers in other countries.</p>
        <p>Tourvaa may also use technology and hosting providers located outside your country.</p>
        <p>Where required, Tourvaa will use reasonable contractual, technical, and organisational safeguards for international data transfers.</p>
      </>
    ),
  },
  {
    id: "data-retention",
    number: 7,
    label: "Data Retention",
    body: (
      <>
        <p>Tourvaa retains information only for as long as reasonably necessary to:</p>
        <LegalBullets
          items={[
            "Manage accounts and bookings.",
            "Provide customer support.",
            "Resolve complaints and disputes.",
            "Prevent fraud.",
            "Meet legal and tax obligations.",
            "Maintain required business records.",
            "Protect Tourvaa's legal rights.",
          ]}
        />
        <p>Information that is no longer required may be deleted, anonymised, or securely archived.</p>
      </>
    ),
  },
  {
    id: "information-security",
    number: 8,
    label: "Information Security",
    body: (
      <>
        <p>Tourvaa uses reasonable administrative, technical, and organisational measures to protect personal information.</p>
        <p>However, no online system or data-transmission method is completely secure.</p>
        <p>Users are responsible for:</p>
        <LegalBullets
          items={[
            "Protecting their passwords.",
            "Avoiding the sharing of login credentials.",
            "Using secure devices.",
            "Informing Tourvaa of suspected unauthorised access.",
          ]}
        />
      </>
    ),
  },
  {
    id: "privacy-rights",
    number: 9,
    label: "Your Privacy Rights and Choices",
    body: (
      <>
        <p>Depending on your location and applicable law, you may have the right to:</p>
        <LegalBullets
          items={[
            "Access your personal information.",
            "Correct inaccurate information.",
            "Request deletion of information.",
            "Restrict certain processing.",
            "Object to certain processing.",
            "Request data portability.",
            "Withdraw consent.",
            "Unsubscribe from marketing communications.",
            "Manage non-essential cookies.",
          ]}
        />
        <p>You may review and update your account information through your dashboard.</p>
        <p>
          Privacy requests may be sent to: <ConfiguredSupportEmail className="font-semibold text-blue-600 hover:underline" />
        </p>
        <p>Tourvaa may need to verify your identity before completing a request.</p>
        <p>Certain information may be retained where required by law or necessary to protect legal rights.</p>
      </>
    ),
  },
  {
    id: "childrens-information",
    number: 10,
    label: "Children's Information",
    body: (
      <>
        <p>Persons under 18 years old cannot independently create bookings through Tourvaa.</p>
        <p>Information relating to a minor may be provided by a parent or authorised guardian when required for a family booking.</p>
        <p>The parent or guardian is responsible for ensuring that the information is provided lawfully and accurately.</p>
      </>
    ),
  },
  {
    id: "cookies-and-third-party-links",
    number: 11,
    label: "Cookies and Third-Party Links",
    body: (
      <>
        <p>
          Tourvaa uses cookies and similar technologies as explained in the{" "}
          <Link href="/cookie-policy" className="font-semibold text-blue-600 hover:underline">
            Tourvaa Cookie Policy
          </Link>
          .
        </p>
        <p>The platform may contain links to third-party websites and services, including:</p>
        <LegalBullets
          items={[
            "Supplier websites.",
            "Payment services.",
            "Map providers.",
            "Social-media platforms.",
            "Insurance services.",
            "Visa services.",
          ]}
        />
        <p>Third-party websites and services are governed by their own privacy policies. Tourvaa is not responsible for their privacy practices.</p>
      </>
    ),
  },
  {
    id: "changes-and-contact",
    number: 12,
    label: "Changes and Contact",
    body: (
      <>
        <p>Tourvaa may update this Privacy Policy to reflect changes in law, technology, services, or business operations.</p>
        <p>The revised Policy will display a new effective date.</p>
        <p>
          Privacy questions and rights requests may be submitted through the{" "}
          <Link href="/contact" className="font-semibold text-blue-600 hover:underline">
            Tourvaa Contact page
          </Link>{" "}
          or sent to: <ConfiguredSupportEmail className="font-semibold text-blue-600 hover:underline" />
        </p>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="This Privacy Policy explains how Tourvaa collects, uses, shares, stores, and protects personal information when you use the Tourvaa website, application, traveller account, or partner dashboard."
      intro="By using Tourvaa, you acknowledge the practices described in this Policy."
      sections={sections}
    />
  );
}
