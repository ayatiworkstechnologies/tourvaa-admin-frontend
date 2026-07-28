"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LuFacebook as Facebook, LuInstagram as Instagram, LuLinkedin as Linkedin, LuMail as Mail, LuPhone as Phone, LuYoutube as Youtube } from "react-icons/lu";
import CurrencySelector from "@/components/public/CurrencySelector";
import { CmsExternalLink, fetchFooterLinks, fetchPublicSettings, subscribeNewsletter } from "@/lib/api/publicClient";

const exploreLinks = [["Destinations", "/destinations"], ["Tour Packages", "/tours"], ["Travel Styles", "/tours?sort=newest"], ["Special Offers", "/tours?sort=price_asc"], ["Travel Stories", "/blogs"]] as const;
const supportLinks = [["Contact Us", "/contact"], ["Cancellation Policy", "/cancellation-policy"], ["Booking Terms", "/terms"], ["Privacy Policy", "/privacy-policy"]] as const;
const partnerLinks = [["Become a Supplier", "/login?role=supplier"], ["Agent Login", "/login?role=agent"], ["Supplier Login", "/login?role=supplier"], ["Partner Support", "/contact"]] as const;
const accountLinks = [["Customer Login", "/login?role=traveller"], ["My Bookings", "/customer/bookings"], ["Wishlist", "/wishlist"], ["Profile", "/customer/profile"]] as const;
const paymentBadges = ["VISA", "Mastercard", "RuPay", "UPI"] as const;

function isSocialLink(link: CmsExternalLink) {
  return /facebook|instagram|linkedin|youtube|twitter|whatsapp|\bx\b/i.test(`${link.label} ${link.url}`);
}

function SocialIcon({ label }: { label: string }) {
  const value = label.toLowerCase();
  if (value.includes("facebook")) return <Facebook size={16} />;
  if (value.includes("instagram")) return <Instagram size={16} />;
  if (value.includes("linkedin")) return <Linkedin size={16} />;
  if (value.includes("youtube")) return <Youtube size={17} />;
  return <span className="text-xs font-black">↗</span>;
}

function NewsletterBox() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    try {
      await subscribeNewsletter(email.trim());
      setStatus("sent");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div>
      <h2 className="text-sm font-bold text-slate-950">Stay updated with Tourvaa</h2>
      <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-500">Get travel inspiration, deals and updates straight to your inbox.</p>
      <form onSubmit={submit} className="mt-4 flex gap-2">
        <label className="sr-only" htmlFor="footer-newsletter-email">Email address</label>
        <input
          id="footer-newsletter-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          className="w-full min-w-0 rounded border border-slate-300 bg-white px-4 py-2.5 text-xs outline-none focus:border-blue-500"
        />
        <button type="submit" disabled={status === "sending"} className="shrink-0 rounded bg-[#1478f2] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-60">
          {status === "sending" ? "..." : "Subscribe"}
        </button>
      </form>
      {status === "sent" && <p className="mt-2 text-[10px] font-semibold text-emerald-600">Thanks for subscribing!</p>}
      {status === "error" && <p className="mt-2 text-[10px] font-semibold text-rose-600">Could not subscribe right now. Please try again.</p>}
    </div>
  );
}

export default function PublicFooter() {
  const [externalLinks, setExternalLinks] = useState<CmsExternalLink[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [country, setCountry] = useState("INDIA");

  useEffect(() => {
    let active = true;
    Promise.allSettled([fetchFooterLinks(), fetchPublicSettings()]).then(([linksResult, settingsResult]) => {
      if (!active) return;
      if (linksResult.status === "fulfilled") setExternalLinks(linksResult.value);
      if (settingsResult.status === "fulfilled") {
        setSettings(settingsResult.value);
        setCountry((settingsResult.value.country || settingsResult.value.site_country || "INDIA").toUpperCase());
      }
    });
    return () => { active = false; };
  }, []);

  const socialLinks = useMemo(() => externalLinks.filter(isSocialLink), [externalLinks]);
  const siteName = settings.site_name || settings.app_name || "Tourvaa";
  const tagline = settings.site_tagline || settings.footer_description || "Making travel simple, memorable and meaningful.";
  const supportEmail = settings.support_email || settings.contact_email || "";
  const supportPhone = settings.support_phone || settings.contact_phone || "";

  return (
    <footer className="mt-10 bg-[#f5f5f5] text-slate-700">
      <div className="mx-auto grid max-w-[1380px] gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.3fr] lg:px-12">
        <FooterGroup title="Explore" links={exploreLinks} />
        <FooterGroup title="Support" links={supportLinks} />
        <FooterGroup title="Partners" links={partnerLinks} />
        <FooterGroup title="My Account" links={accountLinks} />
      </div>

      <div className="mx-auto grid max-w-[1380px] gap-10 border-t border-slate-200 px-6 py-10 sm:grid-cols-2 lg:px-12">
        <NewsletterBox />
        <div>
          <Link href="/" className="text-lg font-black text-[#1478f2]">{siteName}</Link>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-500">{tagline}</p>
          {(supportEmail || supportPhone) && <div className="mt-4 space-y-2 text-[11px] text-slate-500">{supportEmail && <a href={`mailto:${supportEmail}`} className="flex items-center gap-2 hover:text-blue-600"><Mail size={13} />{supportEmail}</a>}{supportPhone && <a href={`tel:${supportPhone}`} className="flex items-center gap-2 hover:text-blue-600"><Phone size={13} />{supportPhone}</a>}</div>}
          <div className="mt-5 grid grid-cols-2 gap-4">
            <CurrencySelector />
            <label className="sr-only" htmlFor="footer-country">Country</label>
            <select id="footer-country" value={country} onChange={(event) => setCountry(event.target.value)} className="rounded border border-slate-300 bg-white px-4 py-2 text-xs font-semibold outline-none focus:border-blue-500">
              {[country, "INDIA", "UAE", "UNITED KINGDOM", "USA"].filter((item, index, array) => array.indexOf(item) === index).map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div className="mt-5 flex items-center gap-4">
            {socialLinks.length ? socialLinks.map((link) => <a key={link.id} href={link.url} target={link.open_in_new_tab ? "_blank" : undefined} rel={link.open_in_new_tab ? "noreferrer" : undefined} aria-label={link.label} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm transition hover:-translate-y-1 hover:bg-blue-600 hover:text-white"><SocialIcon label={link.label} /></a>) : <><Facebook className="text-blue-600" size={16} /><Instagram className="text-pink-500" size={16} /><Linkedin className="text-blue-700" size={16} /><Youtube className="text-red-600" size={17} /></>}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 px-5 py-6">
        <div className="mx-auto flex max-w-[1380px] flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-[9px] text-slate-500">Tourvaa · Making travel simple, memorable and meaningful.</p>
          <div className="flex items-center gap-2">
            {paymentBadges.map((badge) => (
              <span key={badge} className="rounded border border-slate-300 bg-white px-2.5 py-1 text-[9px] font-bold tracking-wide text-slate-600">{badge}</span>
            ))}
          </div>
        </div>
        <p className="mt-4 text-center text-[9px] text-slate-500">© {new Date().getFullYear()} Tourvaa Private Limited. All rights reserved.</p>
      </div>
    </footer>
  );
}

function FooterGroup({ title, links }: { title: string; links: ReadonlyArray<readonly [string, string]> }) {
  return <div><h2 className="text-sm font-bold text-slate-950">{title}</h2><div className="mt-5 flex flex-col gap-4">{links.map(([label, href]) => <Link href={href} key={label} className="text-xs transition hover:translate-x-1 hover:text-blue-600">{label}</Link>)}</div></div>;
}
