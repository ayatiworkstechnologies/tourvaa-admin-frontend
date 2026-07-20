import Link from "next/link";

const cookieTypes = [
  {
    name: "Essential Cookies",
    purpose: "These are necessary for the platform to function. They enable core features such as security, session management, and user authentication. You cannot opt out of these cookies.",
    examples: "Session tokens, CSRF protection, login state",
    duration: "Session or up to 30 days",
  },
  {
    name: "Analytical Cookies",
    purpose: "These help us understand how visitors interact with our website - which pages are visited most, where users drop off, and how the platform performs. This data is aggregated and anonymous.",
    examples: "Page views, session duration, referral source",
    duration: "Up to 13 months",
  },
  {
    name: "Preference Cookies",
    purpose: "These remember choices you make to improve your experience, such as your preferred currency, language, or filter settings.",
    examples: "Currency preference, last search filters",
    duration: "Up to 12 months",
  },
  {
    name: "Marketing Cookies",
    purpose: "These are used to deliver adverts more relevant to you and your interests. They may also be used to limit the number of times you see an advertisement. We use third-party services for this purpose.",
    examples: "Ad targeting, retargeting pixels",
    duration: "Up to 90 days",
  },
];

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <section className="bg-[#063c42] pb-14 pt-32 text-white">
        <div className="mx-auto max-w-4xl px-5 md:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-400">Legal</p>
          <h1 className="mt-2 text-4xl font-bold">Cookie Policy</h1>
          <p className="mt-3 text-sm text-white/60">Last updated: June 2026</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-5 py-12 md:px-8">
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-7 shadow-sm ring-1 border border-slate-100 shadow-sm ring-0">
            <h2 className="mb-3 font-bold text-zinc-950">What are cookies?</h2>
            <p className="text-sm leading-7 text-zinc-500">
              Cookies are small text files placed on your device when you visit a website. They allow the site to recognise your device, remember your preferences, and improve your experience over time. Cookies do not give us access to your device or any personal information beyond what you choose to share.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-7 shadow-sm ring-1 border border-slate-100 shadow-sm ring-0">
            <h2 className="mb-5 font-bold text-zinc-950">Types of cookies we use</h2>
            <div className="space-y-5">
              {cookieTypes.map((c) => (
                <div key={c.name} className="rounded-xl border border-zinc-200 p-5">
                  <p className="font-bold text-zinc-950">{c.name}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{c.purpose}</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-bold uppercase text-zinc-400">Examples</span>
                      <p className="mt-0.5 text-zinc-500">{c.examples}</p>
                    </div>
                    <div>
                      <span className="font-bold uppercase text-zinc-400">Duration</span>
                      <p className="mt-0.5 text-zinc-500">{c.duration}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {[
            ["Managing your cookie preferences", "Most web browsers allow you to control cookies through their settings. You can typically find cookie controls under Privacy or Security settings. Note that disabling certain cookies may affect the functionality of the Tourvaa platform - in particular, essential cookies cannot be disabled without preventing you from logging in or making bookings."],
            ["Third-party cookies", "Some features of our platform may use third-party services that set their own cookies. These include payment processors, analytics providers (such as Google Analytics), and marketing platforms. We do not have control over these cookies - please refer to the respective provider's privacy policies for details."],
            ["Changes to this policy", "We may update this Cookie Policy from time to time to reflect changes in technology or regulation. We will notify registered users of significant changes. The date at the top of this page always shows the most recent version."],
          ].map(([title, text]) => (
            <div key={String(title)} className="rounded-2xl bg-white p-7 shadow-sm ring-1 border border-slate-100 shadow-sm ring-0">
              <h2 className="mb-3 font-bold text-zinc-950">{String(title)}</h2>
              <p className="text-sm leading-7 text-zinc-500">{String(text)}</p>
            </div>
          ))}

          <div className="rounded-xl bg-teal-50 p-5 text-sm text-zinc-600">
            Questions? <Link href="/contact" className="font-bold text-teal-600 hover:underline">Contact us</Link> or see our <Link href="/terms" className="font-bold text-teal-600 hover:underline">Terms & Conditions</Link>.
          </div>
        </div>
      </div>
    </main>
  );
}
