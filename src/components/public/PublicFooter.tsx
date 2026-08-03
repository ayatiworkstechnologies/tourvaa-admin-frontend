"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LuCompass as Compass, LuFacebook as Facebook, LuGlobe as Globe, LuInstagram as Instagram, LuLinkedin as Linkedin, LuMapPin as MapPin, LuYoutube as Youtube } from "react-icons/lu";
import CurrencySelector from "@/components/public/CurrencySelector";
import {
  CmsExternalLink,
  fetchFooterLinks,
  fetchPublicCategories,
  fetchPublicCities,
  fetchPublicCountries,
  fetchPublicSettings,
  PublicCategory,
  PublicCity,
  PublicCountry,
} from "@/lib/api/publicClient";

const supportLinks = [["Contact Us", "/contact"], ["Cancellation Policy", "/cancellation-policy"], ["Privacy Policy", "/privacy-policy"], ["Terms & Conditions", "/terms"]] as const;
const companyLinks = [["About us", "/about"], ["Blog", "/blogs"], ["Tours", "/tours"], ["Destinations", "/destinations"]] as const;
const loginLinks = [["Travellers Login", "/login?role=traveller"], ["Agents Login", "/login?role=agent"]] as const;

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

type MegaTab = "destinations" | "countries" | "categories";

const megaTabs: { key: MegaTab; label: string; icon: React.ElementType }[] = [
  { key: "destinations", label: "Destinations", icon: MapPin },
  { key: "countries", label: "Top countries to visit", icon: Globe },
  { key: "categories", label: "Top attraction categories", icon: Compass },
];

function DestinationsMegaPanel() {
  const [tab, setTab] = useState<MegaTab>("destinations");
  const [cities, setCities] = useState<PublicCity[]>([]);
  const [countries, setCountries] = useState<PublicCountry[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([fetchPublicCities(), fetchPublicCountries(), fetchPublicCategories()]).then(([citiesRes, countriesRes, categoriesRes]) => {
      if (!active) return;
      if (citiesRes.status === "fulfilled") setCities(citiesRes.value);
      if (countriesRes.status === "fulfilled") setCountries(countriesRes.value);
      if (categoriesRes.status === "fulfilled") setCategories(categoriesRes.value);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const items =
    tab === "destinations"
      ? cities.filter((c) => (c.tour_count || 0) > 0).slice(0, 16).map((c) => ({ key: `city-${c.id}`, label: c.city_name, count: c.tour_count || 0, href: `/tours?city=${encodeURIComponent(c.city_name)}` }))
      : tab === "countries"
        ? countries.filter((c) => (c.tour_count || 0) > 0).slice(0, 16).map((c) => ({ key: `country-${c.id}`, label: c.country_name, count: c.tour_count || 0, href: `/tours?country=${encodeURIComponent(c.country_name)}` }))
        : categories.filter((c) => (c.tour_count || 0) > 0).slice(0, 16).map((c) => ({ key: `cat-${c.id}`, label: c.category_name, count: c.tour_count || 0, href: `/tours?category=${encodeURIComponent(c.slug)}` }));

  if (!loading && cities.length === 0 && countries.length === 0 && categories.length === 0) return null;
  const activeTab = megaTabs.find((item) => item.key === tab) ?? megaTabs[0];

  return (
    <div className="bg-white pb-10 pt-2">
      <div className="mx-auto max-w-[1380px] px-6 lg:px-12">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,.06)] sm:p-7">
          <div className="inline-flex flex-wrap gap-1 rounded-full bg-slate-100 p-1">
            {megaTabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${tab === item.key ? "bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,.35)]" : "text-slate-500 hover:text-slate-800"}`}
              >
                <item.icon size={13} />
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 12 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100" />)
              : items.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-[0_8px_20px_rgba(15,23,42,.08)]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                      <activeTab.icon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-slate-900">{item.label}</span>
                      <span className="block text-[10px] text-slate-400">{item.count} tour{item.count === 1 ? "" : "s"} &amp; activities</span>
                    </span>
                  </Link>
                ))}
          </div>
        </div>
      </div>
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
  const tagline = settings.site_tagline || settings.footer_description || "Explore more, travel better, and create memories with Tourvaa.";

  return (
    <>
      <DestinationsMegaPanel />
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
          <p className="text-center text-[9px] text-slate-500">© {new Date().getFullYear()} Tourvaa Private Limited. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

function FooterGroup({ title, links }: { title: string; links: ReadonlyArray<readonly [string, string]> }) {
  return <div><h2 className="text-sm font-bold text-slate-950">{title}</h2><div className="mt-5 flex flex-col gap-4">{links.map(([label, href]) => <Link href={href} key={label} className="text-xs transition hover:translate-x-1 hover:text-blue-600">{label}</Link>)}</div></div>;
}
