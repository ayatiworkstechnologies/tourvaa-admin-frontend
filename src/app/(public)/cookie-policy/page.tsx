import ConfiguredSupportEmail from "@/components/public/ConfiguredSupportEmail";
import LegalPageLayout, { LegalBullets, type LegalSection } from "@/components/public/LegalPageLayout";

const sections: LegalSection[] = [
  {
    id: "types-of-cookies",
    number: 1,
    label: "Types of Cookies We Use",
    body: (
      <>
        <div>
          <h3 className="font-bold text-slate-900">Essential Cookies</h3>
          <p className="mt-1">Essential cookies are required for the platform to function properly. They may be used for:</p>
          <LegalBullets
            items={[
              "Account login.",
              "Session management.",
              "Platform security.",
              "Fraud prevention.",
              "Booking and checkout processes.",
              "Saving temporary booking information.",
              "Core platform features.",
            ]}
          />
          <p className="mt-2">These cookies cannot be disabled through the Tourvaa cookie preference tool.</p>
          <p>Typical duration: Session to 30 days.</p>
        </div>

        <div>
          <h3 className="font-bold text-slate-900">Analytics Cookies</h3>
          <p className="mt-1">Analytics cookies help Tourvaa understand how users interact with the platform. They may collect information about:</p>
          <LegalBullets
            items={[
              "Page visits.",
              "User journeys.",
              "Traffic sources.",
              "Errors.",
              "Platform performance.",
              "Feature usage.",
              "Search activity.",
            ]}
          />
          <p className="mt-2">This information helps Tourvaa improve the platform and user experience.</p>
          <p>Typical duration: Up to 13 months.</p>
        </div>

        <div>
          <h3 className="font-bold text-slate-900">Preference Cookies</h3>
          <p className="mt-1">Preference cookies remember choices made by users, including:</p>
          <LegalBullets
            items={[
              "Preferred currency.",
              "Language.",
              "Destination.",
              "Search filters.",
              "Display preferences.",
              "Saved settings.",
            ]}
          />
          <p className="mt-2">Typical duration: Up to 12 months.</p>
        </div>

        <div>
          <h3 className="font-bold text-slate-900">Marketing Cookies</h3>
          <p className="mt-1">Marketing cookies may be used to:</p>
          <LegalBullets
            items={[
              "Measure advertising campaigns.",
              "Understand referral activity.",
              "Limit repeated advertisements.",
              "Personalise promotional messages.",
              "Display relevant advertisements on approved third-party channels.",
            ]}
          />
          <p className="mt-2">Marketing cookies will be used only where permission is required and has been provided.</p>
          <p>Typical duration: Up to 90 days.</p>
        </div>

        <p>Actual cookie names and durations may vary depending on the provider and platform configuration.</p>
        <p>Tourvaa may also use local storage, session storage, tracking pixels, and software-development kits for similar purposes.</p>
      </>
    ),
  },
  {
    id: "consent-and-preferences",
    number: 2,
    label: "Consent and Cookie Preferences",
    body: (
      <>
        <p>Essential cookies are used because they are necessary to provide Tourvaa&apos;s services.</p>
        <p>Where required by law, analytics, preference, and marketing cookies will be activated only after you provide consent.</p>
        <p>You may update or withdraw your cookie choices at any time through the Tourvaa cookie preference settings.</p>
        <p>Withdrawing consent does not affect information processed before consent was withdrawn.</p>
      </>
    ),
  },
  {
    id: "third-party-cookies",
    number: 3,
    label: "Third-Party Cookies",
    body: (
      <>
        <p>Tourvaa may use third-party services for:</p>
        <LegalBullets
          items={[
            "Payment processing.",
            "Analytics.",
            "Maps.",
            "Customer support.",
            "Security.",
            "Advertising.",
            "Marketing measurement.",
          ]}
        />
        <p>Examples may include payment gateways, analytics services, map providers, and advertising platforms.</p>
        <p>These third parties may place or access cookies on your device and process information according to their own privacy policies.</p>
      </>
    ),
  },
  {
    id: "browser-and-device-controls",
    number: 4,
    label: "Browser and Device Controls",
    body: (
      <>
        <p>Most browsers allow you to manage cookies through their Privacy or Security settings.</p>
        <p>You may be able to:</p>
        <LegalBullets
          items={[
            "Block cookies.",
            "Delete stored cookies.",
            "Limit third-party cookies.",
            "Receive alerts before cookies are stored.",
            "Clear site data.",
          ]}
        />
        <p>Blocking essential cookies may prevent certain Tourvaa features from working properly, including:</p>
        <LegalBullets
          items={["Account login.", "Saved preferences.", "Checkout.", "Booking management.", "Payment processing."]}
        />
        <p>Cookie settings may need to be managed separately on each browser and device you use.</p>
      </>
    ),
  },
  {
    id: "cookie-retention",
    number: 5,
    label: "Cookie Retention",
    body: (
      <>
        <p>Session cookies are deleted when the browser or session is closed.</p>
        <p>Persistent cookies remain on the device until they expire or are manually deleted.</p>
        <p>Tourvaa periodically reviews its use of cookies and retains cookie-related information only for as long as necessary for:</p>
        <LegalBullets
          items={[
            "The purposes described in this Policy.",
            "Platform security.",
            "Legal compliance.",
            "Fraud prevention.",
            "Dispute resolution.",
          ]}
        />
      </>
    ),
  },
  {
    id: "changes-and-contact",
    number: 6,
    label: "Changes and Contact",
    body: (
      <>
        <p>Tourvaa may update this Cookie Policy when its technologies, vendors, legal obligations, or platform features change.</p>
        <p>The updated version will display a revised effective date.</p>
        <p>
          Questions regarding this Cookie Policy may be sent to:{" "}
          <ConfiguredSupportEmail className="font-semibold text-blue-600 hover:underline" />
        </p>
      </>
    ),
  },
];

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      subtitle="This Cookie Policy explains how Tourvaa uses cookies and similar technologies on its website, application, and associated services."
      intro="Cookies are small files stored on your browser or device. They help Tourvaa operate securely, remember preferences, understand platform performance, and support relevant marketing where permission is required."
      sections={sections}
    />
  );
}
