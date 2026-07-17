import Link from "next/link";
import {
  LuClock3 as Clock,
  LuFacebook as Facebook,
  LuInstagram as Instagram,
  LuLinkedin as Linkedin,
  LuMail as Mail,
  LuMapPin as MapPin,
  LuPhone as Phone,
  LuYoutube as Youtube,
} from "react-icons/lu";

const footerGroups = [
  { title: "Explore", links: [["Destinations", "/destinations"], ["Tour Packages", "/tours"], ["Experiences", "/#experiences"], ["Special Offers", "/tours"], ["Travel Guides", "/blogs"]] },
  { title: "Support", links: [["Contact Us", "/contact"], ["FAQs", "/contact"], ["Booking Support", "/contact"], ["Cancellation Policy", "/cancellation-policy"], ["Payment Info", "/terms"]] },
  { title: "Company", links: [["About Us", "/about"], ["Careers", "/contact"], ["Blog", "/blogs"], ["Partner With Us", "/join/supplier"], ["Press", "/contact"]] },
  { title: "Legal", links: [["Terms & Conditions", "/terms"], ["Privacy Policy", "/cookie-policy"], ["Refund Policy", "/cancellation-policy"], ["Cookie Policy", "/cookie-policy"]] },
] as const;

function TravelSkyline() {
  return (
    <svg viewBox="0 0 760 190" aria-hidden="true" className="h-full min-h-36 w-full text-white/35" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M0 170h760M15 55c60 8 71 66 132 55 52-9 27-65 87-55 48 8 41 61 101 55" strokeDasharray="7 9" />
      <path d="m24 49 28-13-8 14 20 11-6 7-23-9-9 16-6-3 7-19-14-7Z" fill="currentColor" stroke="none" />
      <path d="M368 170h70m-58 0 21-125 21 125m-35-80h28m-34 26h40m-48 28h56m-27-99-5-17m5 17 5-17" />
      <path d="M452 170h68V66h-68Zm9-104 25-28 25 28m-50 22h41m-41 25h41m-41 25h41m-20-98v130" />
      <circle cx="482" cy="82" r="10" /><path d="m478 82 5 3 5-8" />
      <path d="M534 170h49V91h-49Zm7-79 18-26 18 26m-30 25h24m-24 22h24m-12-70V47" />
      <path d="M596 170c1-33 16-60 39-79 23 19 38 46 39 79m-63-51h48m-57 24h66m-33-52v79" />
      <path d="M689 170v-53m0 12c-12-19-25-20-35-16 15 2 24 8 35 16Zm1-5c13-20 27-20 38-15-16 1-26 7-38 15Zm-1-3c-2-21-11-29-22-32 10 10 15 20 22 32Z" />
      <path d="M320 64c8-15 28-15 37 0 13-10 31-1 31 14h-86c0-10 8-17 18-14ZM551 41c8-13 25-13 33 0 12-8 27 0 27 13h-76c0-9 7-15 16-13ZM694 48c7-11 21-11 28 0 10-7 23 0 23 11h-64c0-7 6-13 13-11Z" />
      <path d="M713 18c0 19-13 35-29 35s-29-16-29-35c0-9 13-15 29-15s29 6 29 15Zm-29 35v19m-12-65 12 46m12-46-12 46" />
    </svg>
  );
}

export default function PublicFooter() {
  return (
    <footer className="bg-[radial-gradient(circle_at_25%_0%,#08706b_0%,#04524f_38%,#023b3b_100%)] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 pt-10 md:grid-cols-[.9fr_1.5fr] md:px-8 lg:pt-12">
        <div className="pb-8">
          <h2 className="max-w-md font-heading text-2xl font-black leading-tight md:text-3xl">Travel inspiration, offers and guides delivered to your inbox.</h2>
          <form className="mt-6 flex max-w-lg flex-col gap-3 sm:flex-row">
            <input type="email" name="email" required placeholder="Enter your email address" className="min-h-12 min-w-0 flex-1 rounded-lg border border-white/20 bg-white px-4 text-sm text-slate-900 shadow-lg outline-none focus:ring-2 focus:ring-orange-400" />
            <button type="submit" className="min-h-12 rounded-lg bg-orange-500 px-8 text-sm font-black text-white shadow-lg shadow-orange-950/20 transition hover:bg-orange-600">Subscribe</button>
          </form>
          <p className="mt-3 text-[10px] leading-5 text-white/55">By subscribing you agree to our Privacy Policy and consent to receive updates.</p>
        </div>
        <div className="hidden items-end overflow-hidden md:flex"><TravelSkyline /></div>
      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-9 sm:grid-cols-2 md:px-8 lg:grid-cols-[1.4fr_repeat(4,1fr)_1.3fr]">
          <div>
            <Link href="/" className="font-heading text-3xl font-black uppercase tracking-[0.06em]">Tourvaa<sup className="ml-1 text-sm text-orange-300">✦</sup></Link>
            <p className="mt-1 text-sm font-semibold text-white/65">Your World. Your Way.</p>
            <div className="mt-6 flex gap-3">
              {[Facebook, Instagram, Youtube, Linkedin].map((Icon, index) => <span key={index} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/35 text-white/85 transition hover:border-orange-300 hover:text-orange-300"><Icon size={16} /></span>)}
            </div>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}><h3 className="text-sm font-black text-white">{group.title}</h3><div className="mt-3 flex flex-col gap-2">{group.links.map(([label, href]) => <Link key={label} href={href} className="text-xs text-white/65 transition hover:text-orange-300">{label}</Link>)}</div></div>
          ))}

          <div><h3 className="text-sm font-black">Contact</h3><div className="mt-3 space-y-2.5 text-xs text-white/70"><p className="flex items-center gap-2"><Phone size={14} /> +91 98765 43210</p><p className="flex items-center gap-2"><Mail size={14} /> support@tourvaa.com</p><p className="flex items-center gap-2"><MapPin size={14} /> Chennai, India</p><p className="flex items-center gap-2"><Clock size={14} /> Mon–Sun (9AM–9PM)</p></div></div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-5 text-[11px] text-white/60 sm:flex-row md:px-8">
          <p>© {new Date().getFullYear()} Tourvaa. All rights reserved.</p>
          <div className="flex items-center gap-5 text-base font-black italic"><span className="text-white">VISA</span><span className="flex -space-x-2"><i className="h-5 w-5 rounded-full bg-red-500" /><i className="h-5 w-5 rounded-full bg-amber-400" /></span><span>RuPay</span><span className="tracking-tight">UPI</span></div>
        </div>
      </div>
    </footer>
  );
}
