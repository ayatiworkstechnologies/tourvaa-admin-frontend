import Link from "next/link";

const features = [
  ["Keyboard navigation", "All interactive elements — menus, forms, buttons, and links — are fully operable using a keyboard alone. Focus states are visible at all times."],
  ["Screen reader support", "We use semantic HTML5 elements and ARIA labels where necessary to ensure compatibility with assistive technologies such as NVDA, VoiceOver, and JAWS."],
  ["Text contrast", "All text meets WCAG 2.1 AA contrast requirements, with a minimum contrast ratio of 4.5:1 for body text and 3:1 for large text and interface components."],
  ["Resizable text", "The platform remains usable when text is scaled up to 200% using browser zoom without loss of functionality or content."],
  ["Image descriptions", "All meaningful images include descriptive alt text. Decorative images have null alt attributes so screen readers skip them."],
  ["Form accessibility", "All form fields are labelled explicitly. Error messages are associated with their respective inputs and announced to assistive technologies."],
  ["No seizure-inducing content", "We do not use animations that flash more than three times per second. Motion is kept minimal and purposeful."],
];

export default function AccessibilityPage() {
  return (
    <main className="min-h-screen bg-[#F7F9FC] pb-20">
      <section className="bg-[#0F172A] py-14 text-white">
        <div className="mx-auto max-w-4xl px-5 md:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#43A9F6]">Accessibility</p>
          <h1 className="mt-2 text-4xl font-bold">Accessibility Statement</h1>
          <p className="mt-3 text-sm text-white/60">Last updated: June 2026</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-5 py-12 md:px-8">
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-[#E7EAF0]">
            <h2 className="mb-3 font-bold text-[#121826]">Our commitment</h2>
            <p className="text-sm leading-7 text-[#667085]">
              Tourvaa is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone and apply relevant accessibility standards.
            </p>
            <p className="mt-3 text-sm leading-7 text-[#667085]">
              We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA. These guidelines explain how to make web content more accessible to people with disabilities.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-[#E7EAF0]">
            <h2 className="mb-5 font-bold text-[#121826]">Accessibility features</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {features.map(([title, desc]) => (
                <div key={title} className="rounded-xl border border-[#E7EAF0] p-4">
                  <p className="font-bold text-[#121826]">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-[#667085]">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {[
            ["Known limitations", "While we strive for full accessibility, some third-party content embedded in the platform (such as map iframes or external video players) may not fully meet WCAG 2.1 AA standards. We work to identify and address these issues as they are reported."],
            ["Feedback and contact", "We welcome your feedback on the accessibility of the Tourvaa platform. If you experience accessibility barriers, please contact us so we can address the issue promptly:\n\n• Email: accessibility@tourvaa.com\n• Contact form: tourvaa.com/contact\n\nWe aim to respond to accessibility feedback within 2 business days."],
            ["Technical specifications", "Tourvaa uses the following technologies: HTML5, CSS3, JavaScript (React / Next.js). Accessibility has been tested with NVDA on Windows and VoiceOver on macOS and iOS."],
          ].map(([title, text]) => (
            <div key={String(title)} className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-[#E7EAF0]">
              <h2 className="mb-3 font-bold text-[#121826]">{String(title)}</h2>
              <p className="whitespace-pre-line text-sm leading-7 text-[#667085]">{String(text)}</p>
            </div>
          ))}

          <div className="rounded-xl bg-[#E7F5FF] p-5 text-sm text-[#344054]">
            Need help accessing any part of our platform?{" "}
            <Link href="/contact" className="font-bold text-[#0284C7] hover:underline">Contact our team</Link>{" "}
            and we will assist you directly.
          </div>
        </div>
      </div>
    </main>
  );
}
