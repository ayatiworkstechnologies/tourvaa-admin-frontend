"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LuFacebook as Facebook, LuInstagram as Instagram, LuLinkedin as Linkedin, LuYoutube as Youtube } from "react-icons/lu";
import CurrencySelector from "@/components/public/CurrencySelector";
import DestinationsMegaPanel from "@/components/public/DestinationsMegaPanel";
import { CmsExternalLink, PublicCountry, fetchFooterLinks, fetchPublicCountries } from "@/lib/api/publicClient";
import { usePublicSettings } from "@/providers/PublicSettingsProvider";

const supportLinks = [
  ["Contact Us", "/contact"],
  ["Cancellation Policy", "/cancellation-policy"],
  ["Privacy Policy", "/privacy-policy"],
  ["Terms & Conditions", "/terms"],
] as const;

const companyLinks = [
  ["About us", "/about"],
  ["Blog", "/blogs"],
  ["Tours", "/tours"],
  ["Destinations", "/destinations"],
] as const;

const loginLinks = [
  ["Travellers Login", "/login?role=traveller"],
  ["Agents Login", "/agent-portal/login"],
  ["Supplier Login", "/supplier-portal/login"],
  ["Become a Supplier", "/supplier-portal"],
  ["Become an Agent", "/agent-portal"],
] as const;

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

export default function PublicFooter() {
  const pathname = usePathname();
  const router = useRouter();
  const { settings } = usePublicSettings();
  const [externalLinks, setExternalLinks] = useState<CmsExternalLink[]>([]);
  const [countries, setCountries] = useState<PublicCountry[]>([]);
  const [country, setCountry] = useState("INDIA");

  useEffect(() => {
    let active = true;
    fetchFooterLinks()
      .then((links) => { if (active) setExternalLinks(links); })
      .catch(() => { /* Static footer links remain available. */ });
    fetchPublicCountries()
      .then((items) => { if (active) setCountries(items); })
      .catch(() => { /* Fixed fallback list remains available. */ });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setCountry((settings.country || settings.site_country || "INDIA").toUpperCase());
  }, [settings]);

  const socialLinks = useMemo(() => externalLinks.filter(isSocialLink), [externalLinks]);
  const countryOptions = useMemo(() => {
    const names = countries.length
      ? countries.map((item) => item.country_name.toUpperCase())
      : ["INDIA", "UAE", "UNITED KINGDOM", "USA"];
    return [country, ...names].filter((item, index, array) => array.indexOf(item) === index);
  }, [countries, country]);
  const siteName = settings.site_name || settings.app_name || "Tourvaa";
  const tagline = settings.site_tagline || settings.footer_description || "Explore more, travel better, and create memories with Tourvaa.";

  return (
    <>
    {pathname === "/" && <DestinationsMegaPanel />}
    <footer className="bg-[#f5f5f5] text-slate-700">
      <div className="mx-auto grid max-w-[1380px] gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.3fr] lg:px-12">
        <FooterGroup title="Support" links={supportLinks} />
        <FooterGroup title="Our Company" links={companyLinks} />
        <FooterGroup title="Login" links={loginLinks} />
        <div>
          <Link href="/" className="text-lg font-black text-[#1478f2]">{siteName}</Link>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-500">{tagline}</p>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <CurrencySelector />
            <label className="sr-only" htmlFor="footer-country">Country</label>
            <select
              id="footer-country"
              value={country}
              onChange={(event) => {
                const value = event.target.value;
                setCountry(value);
                router.push(`/tours?country=${encodeURIComponent(value)}`);
              }}
              className="rounded border border-slate-300 bg-white px-4 py-2 text-xs font-semibold outline-none focus:border-blue-500"
            >
              {countryOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div className="mt-5 flex items-center gap-4">
            {socialLinks.length ? socialLinks.map((link) => <a key={link.id} href={link.url} target={link.open_in_new_tab ? "_blank" : undefined} rel={link.open_in_new_tab ? "noreferrer" : undefined} aria-label={link.label} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm transition hover:-translate-y-1 hover:bg-blue-600 hover:text-white"><SocialIcon label={link.label} /></a>) : <><Facebook className="text-blue-600" size={16} /><Instagram className="text-pink-500" size={16} /><Linkedin className="text-blue-700" size={16} /><Youtube className="text-red-600" size={17} /></>}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1380px] flex-col items-center justify-between gap-2 border-t border-slate-200 px-5 py-6 sm:flex-row sm:gap-4 lg:px-12">
        <p className="text-center text-[9px] text-slate-500 sm:text-left">Copyright © {new Date().getFullYear()} by Tourvaa Private Limited - All Right Reserved</p>
        <p className="text-center text-[9px] text-slate-400 sm:text-right">Design and Developed by Ayatiworks</p>
      </div>
    </footer>
    </>
  );
}

function FooterGroup({ title, links }: { title: string; links: ReadonlyArray<readonly [string, string]> }) {
  return <div><h2 className="text-sm font-bold text-slate-950">{title}</h2><div className="mt-5 flex flex-col gap-4">{links.map(([label, href]) => <Link href={href} key={label} className="text-xs transition hover:translate-x-1 hover:text-blue-600">{label}</Link>)}</div></div>;
}
