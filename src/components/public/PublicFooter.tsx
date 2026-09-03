"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { LuChevronDown as ChevronDown } from "react-icons/lu";
import { useCurrency } from "@/hooks/useCurrency";
import { PublicCountry, fetchPublicCountries } from "@/lib/api/publicClient";
import { usePublicSettings } from "@/providers/PublicSettingsProvider";
import DestinationsMegaPanel from "@/components/public/DestinationsMegaPanel";

const supportLinks = [
  ["Contact", "/contact"],
  ["Legal Notice", "/terms"],
  ["Privacy Policy.", "/privacy-policy"],
  ["General Terms and Conditions", "/terms"],
  ["Plan Your Trip", "/contact"],
] as const;

const companyLinks = [
  ["About us", "/about"],
  ["Blog", "/blogs"],
  ["Explore Tourvaa", "/destinations"],
  ["Tours", "/tours"],
  ["Traveller's Choice", "/tours?sort=rating_desc"],
] as const;

const loginLinks = [
  ["Travellers Login", "/login"],
  ["Agents login", "/agent-portal/login"],
  ["Affiliate login", "/affiliate-portal/login"],
  ["Supplier login", "/supplier-portal/login"],
] as const;

export default function PublicFooter() {
  const pathname = usePathname();
  const router = useRouter();
  const { settings } = usePublicSettings();
  const { code, symbol, currencies, setCode, forced } = useCurrency();

  const [countries, setCountries] = useState<PublicCountry[]>([]);
  const [country, setCountry] = useState("INDIA");
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);

  const currencyRef = useRef<HTMLDivElement>(null);
  const countryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetchPublicCountries()
      .then((items) => {
        if (active) setCountries(items);
      })
      .catch(() => {
        /* Fixed fallback list remains available. */
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setCountry((settings.country || settings.site_country || "INDIA").toUpperCase());
  }, [settings]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setCurrencyOpen(false);
      }
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setCountryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const countryOptions = useMemo(() => {
    const names = countries.length
      ? countries.map((item) => item.country_name.toUpperCase())
      : ["INDIA", "UNITED KINGDOM", "UNITED STATES", "UAE", "AUSTRALIA", "SINGAPORE", "NEW ZEALAND"];
    return [country, ...names].filter((item, index, array) => array.indexOf(item) === index);
  }, [countries, country]);

  const siteName = settings.site_name || settings.app_name || "Tourvaa";
  const tagline =
    settings.site_tagline ||
    settings.footer_description ||
    "Explore more, travel better, and create memories with Tourvaa.";

  return (
    <footer className="bg-white text-slate-700 pt-4 pb-6 sm:pb-8">
      {pathname === "/" && <DestinationsMegaPanel />}
      {/* Dark Navy Contained Container Card */}
        <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-8">
          <div className="rounded-2xl sm:rounded-3xl bg-pub-primary text-white p-8 sm:p-10 lg:p-12 shadow-xl">
            <div className="grid gap-8 sm:gap-10 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-[1.1fr_1.1fr_1fr_1.5fr]">
              {/* Column 1: Support */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-4 sm:mb-5 tracking-tight">
                  Support
                </h3>
                <ul className="space-y-3">
                  {supportLinks.map(([label, href]) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="group flex items-center gap-2 text-xs sm:text-sm text-slate-300 transition-colors hover:text-white"
                      >
                        <span className="text-slate-400 group-hover:text-white transition-colors">•</span>
                        <span>{label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 2: Our Company */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-4 sm:mb-5 tracking-tight">
                  Our Company
                </h3>
                <ul className="space-y-3">
                  {companyLinks.map(([label, href]) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="group flex items-center gap-2 text-xs sm:text-sm text-slate-300 transition-colors hover:text-white"
                      >
                        <span className="text-slate-400 group-hover:text-white transition-colors">•</span>
                        <span>{label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 3: Login */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-4 sm:mb-5 tracking-tight">
                  Login
                </h3>
                <ul className="space-y-3">
                  {loginLinks.map(([label, href]) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="group flex items-center gap-2 text-xs sm:text-sm text-slate-300 transition-colors hover:text-white"
                      >
                        <span className="text-slate-400 group-hover:text-white transition-colors">•</span>
                        <span>{label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 4: Brand & Utilities */}
              <div className="flex flex-col justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">
                    {siteName}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed max-w-sm mb-6">
                    {tagline}
                  </p>

                  {/* Currency & Country Selectors */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {/* Currency Selector Pill */}
                    <div ref={currencyRef} className="relative">
                      <button
                        type="button"
                        onClick={() => !forced && setCurrencyOpen((prev) => !prev)}
                        className="w-full rounded-xl bg-white px-3.5 sm:px-4 py-2.5 text-slate-900 flex items-center justify-between text-xs sm:text-sm font-bold shadow-sm focus:outline-none hover:bg-slate-50 transition"
                      >
                        <span className="truncate">
                          {symbol || ""} {code}
                        </span>
                        <ChevronDown
                          size={15}
                          className={`text-pub-accent font-black shrink-0 transition-transform ${
                            currencyOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {currencyOpen && !forced && (
                        <div className="absolute bottom-[calc(100%+6px)] left-0 z-50 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl">
                          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Select Currency
                          </div>
                          <div className="mt-1 max-h-48 overflow-y-auto space-y-0.5 no-scrollbar">
                            {currencies.length ? (
                              currencies.map((item) => (
                                <button
                                  key={item.code}
                                  type="button"
                                  onClick={() => {
                                    setCode(item.code);
                                    setCurrencyOpen(false);
                                  }}
                                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                                    item.code === code
                                      ? "bg-pub-accent/10 text-pub-accent font-bold"
                                      : "text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  <span>{item.code}</span>
                                  <span className="text-slate-400 font-normal">{item.symbol}</span>
                                </button>
                              ))
                            ) : (
                              <button
                                type="button"
                                onClick={() => setCurrencyOpen(false)}
                                className="w-full rounded-lg px-2.5 py-1.5 text-xs text-left font-semibold text-slate-700"
                              >
                                INR (₹)
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Country Selector Pill */}
                    <div ref={countryRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setCountryOpen((prev) => !prev)}
                        className="w-full rounded-xl bg-white px-3.5 sm:px-4 py-2.5 text-slate-900 flex items-center justify-between text-xs sm:text-sm font-bold shadow-sm focus:outline-none hover:bg-slate-50 transition"
                      >
                        <span className="truncate">{country}</span>
                        <ChevronDown
                          size={15}
                          className={`text-pub-accent font-black shrink-0 transition-transform ${
                            countryOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {countryOpen && (
                        <div className="absolute bottom-[calc(100%+6px)] right-0 z-50 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl">
                          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Select Country
                          </div>
                          <div className="mt-1 max-h-48 overflow-y-auto space-y-0.5 no-scrollbar">
                            {countryOptions.map((item) => (
                              <button
                                key={item}
                                type="button"
                                onClick={() => {
                                  setCountry(item);
                                  setCountryOpen(false);
                                  router.push(`/tours?country=${encodeURIComponent(item)}`);
                                }}
                                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                                  item === country
                                    ? "bg-pub-accent/10 text-pub-accent font-bold"
                                    : "text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                <span>{item}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Social Media Icons */}
                <div className="flex items-center gap-4 sm:gap-5 text-white/90">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Facebook"
                    className="transition-transform duration-200 hover:scale-125 hover:text-white"
                  >
                    <FaFacebookF size={15} />
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="transition-transform duration-200 hover:scale-125 hover:text-white"
                  >
                    <FaInstagram size={16} />
                  </a>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="YouTube"
                    className="transition-transform duration-200 hover:scale-125 hover:text-white"
                  >
                    <FaYoutube size={16} />
                  </a>
                  <a
                    href="https://whatsapp.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                    className="transition-transform duration-200 hover:scale-125 hover:text-white"
                  >
                    <FaWhatsapp size={16} />
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="X Twitter"
                    className="transition-transform duration-200 hover:scale-125 hover:text-white"
                  >
                    <FaXTwitter size={15} />
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="LinkedIn"
                    className="transition-transform duration-200 hover:scale-125 hover:text-white"
                  >
                    <FaLinkedinIn size={15} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Text */}
        <div className="mx-auto max-w-[1400px] px-4 pt-6 text-center text-xs text-slate-500">
          <p>
            Copyright © {new Date().getFullYear()} by Tourvaa Private Limited - All Right Reserved | Design & Developed by Ayatiworks
          </p>
        </div>
      </footer>
  );
}

