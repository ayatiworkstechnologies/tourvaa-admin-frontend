"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LuFacebook as Facebook, LuInstagram as Instagram, LuLinkedin as Linkedin, LuMail as Mail, LuPhone as Phone, LuYoutube as Youtube } from "react-icons/lu";
import CurrencySelector from "@/components/public/CurrencySelector";
import { CmsExternalLink, fetchFooterLinks, fetchPublicSettings } from "@/lib/api/publicClient";

const supportLinks = [["Contact", "/contact"], ["Legal Notice", "/terms"], ["Privacy Policy", "/cookie-policy"], ["General Terms and Conditions", "/terms"], ["Plan Your Trip", "/contact"]] as const;
const loginLinks = [["Travellers Login", "/login"], ["Agents login", "/login"]] as const;
const companyFallback = [["About us", "/about"], ["Blog", "/blogs"], ["Explore Tourvaa", "/tours"], ["Tours", "/tours"], ["Traveller’s Choice", "/tours"]] as const;

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
  const companyLinks = useMemo(() => {
    const managed = externalLinks.filter((link) => !isSocialLink(link));
    return managed.length ? managed.map((link) => ({ label: link.label, href: link.url, external: link.open_in_new_tab })) : companyFallback.map(([label, href]) => ({ label, href, external: false }));
  }, [externalLinks]);
  const siteName = settings.site_name || settings.app_name || "Tourvaa";
  const tagline = settings.site_tagline || settings.footer_description || "Explore more, travel better, and create memories with Tourvaa.";
  const supportEmail = settings.support_email || settings.contact_email || "";
  const supportPhone = settings.support_phone || settings.contact_phone || "";

  return (
    <footer className="mt-10 bg-[#f5f5f5] text-slate-700">
      <div className="mx-auto grid max-w-[1380px] gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_.9fr_1.5fr] lg:px-12">
        <FooterGroup title="Support" links={supportLinks} />
        <div><h2 className="text-sm font-bold text-slate-950">Our Company</h2><div className="mt-5 flex flex-col gap-4">{companyLinks.slice(0, 7).map((link) => link.external ? <a href={link.href} target="_blank" rel="noreferrer" key={`${link.label}-${link.href}`} className="text-xs transition hover:translate-x-1 hover:text-blue-600">{link.label}</a> : <Link href={link.href} key={`${link.label}-${link.href}`} className="text-xs transition hover:translate-x-1 hover:text-blue-600">{link.label}</Link>)}</div></div>
        <FooterGroup title="Login" links={loginLinks} />

        <div>
          <Link href="/" className="text-lg font-black text-[#1478f2]">{siteName}</Link>
          <p className="mt-5 max-w-xs text-xs leading-relaxed text-slate-500">{tagline}</p>
          {(supportEmail || supportPhone) && <div className="mt-4 space-y-2 text-[11px] text-slate-500">{supportEmail && <a href={`mailto:${supportEmail}`} className="flex items-center gap-2 hover:text-blue-600"><Mail size={13} />{supportEmail}</a>}{supportPhone && <a href={`tel:${supportPhone}`} className="flex items-center gap-2 hover:text-blue-600"><Phone size={13} />{supportPhone}</a>}</div>}
          <div className="mt-7 grid grid-cols-2 gap-4">
            <CurrencySelector />
            <label className="sr-only" htmlFor="footer-country">Country</label>
            <select id="footer-country" value={country} onChange={(event) => setCountry(event.target.value)} className="rounded border border-slate-300 bg-white px-4 py-2 text-xs font-semibold outline-none focus:border-blue-500">
              {[country, "INDIA", "UAE", "UNITED KINGDOM", "USA"].filter((item, index, array) => array.indexOf(item) === index).map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div className="mt-6 flex items-center gap-4">
            {socialLinks.length ? socialLinks.map((link) => <a key={link.id} href={link.url} target={link.open_in_new_tab ? "_blank" : undefined} rel={link.open_in_new_tab ? "noreferrer" : undefined} aria-label={link.label} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm transition hover:-translate-y-1 hover:bg-blue-600 hover:text-white"><SocialIcon label={link.label} /></a>) : <><Facebook className="text-blue-600" size={16} /><Instagram className="text-pink-500" size={16} /><Linkedin className="text-blue-700" size={16} /><Youtube className="text-red-600" size={17} /></>}
          </div>
        </div>
      </div>
      <div className="px-5 pb-8 text-center text-[9px] text-slate-500">Copyright © {new Date().getFullYear()} by {settings.company_name || `${siteName} Private Limited`} - All Rights Reserved | Design &amp; Developed by Ayatiworks</div>
    </footer>
  );
}

function FooterGroup({ title, links }: { title: string; links: ReadonlyArray<readonly [string, string]> }) {
  return <div><h2 className="text-sm font-bold text-slate-950">{title}</h2><div className="mt-5 flex flex-col gap-4">{links.map(([label, href]) => <Link href={href} key={label} className="text-xs transition hover:translate-x-1 hover:text-blue-600">{label}</Link>)}</div></div>;
}
