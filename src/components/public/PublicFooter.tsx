"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { CmsFooterSection, PublicCountry, fetchFooterSections, fetchPublicCountries } from "@/lib/api/publicClient";
import { usePublicSettings } from "@/providers/PublicSettingsProvider";

// Used only if the CMS-managed /cms/footer fetch fails or returns nothing,
// so a backend hiccup never blanks the footer - see the useEffect below.
const FALLBACK_FOOTER_SECTIONS: CmsFooterSection[] = [
  {
    id: -1,
    title: "Support",
    links: [
      { id: -1, label: "Contact", url: "/contact", open_in_new_tab: false },
      { id: -2, label: "Legal Notice", url: "/terms", open_in_new_tab: false },
      { id: -3, label: "Privacy Policy", url: "/privacy-policy", open_in_new_tab: false },
      { id: -4, label: "General Terms and Conditions", url: "/terms", open_in_new_tab: false },
      { id: -5, label: "Plan Your Trip", url: "/contact", open_in_new_tab: false },
    ],
  },
  {
    id: -2,
    title: "Our Company",
    links: [
      { id: -6, label: "About us", url: "/about", open_in_new_tab: false },
      { id: -7, label: "Blog", url: "/blogs", open_in_new_tab: false },
      { id: -8, label: "Explore Tourvaa", url: "/destinations", open_in_new_tab: false },
      { id: -9, label: "Tours", url: "/tours", open_in_new_tab: false },
      { id: -10, label: "Traveller's Choice", url: "/tours?sort=rating_desc", open_in_new_tab: false },
    ],
  },
  {
    id: -3,
    title: "Login",
    links: [
      { id: -11, label: "Travellers Login", url: "/login", open_in_new_tab: false },
      { id: -12, label: "Agents login", url: "/agent-portal/login", open_in_new_tab: false },
      { id: -13, label: "Affiliate login", url: "/affiliate-portal/login", open_in_new_tab: false },
      { id: -14, label: "Supplier login", url: "/supplier-portal/login", open_in_new_tab: false },
    ],
  },
];

export default function PublicFooter() {
  const router = useRouter();
  const { settings } = usePublicSettings();
  const { code, symbol, currencies, setCode, forced, countryCode, setCountry } = useCurrency();

  const [countries, setCountries] = useState<PublicCountry[]>([]);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [footerSections, setFooterSections] = useState<CmsFooterSection[]>(FALLBACK_FOOTER_SECTIONS);

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
    let active = true;
    fetchFooterSections()
      .then((sections) => {
        if (active && sections.length > 0) setFooterSections(sections);
      })
      .catch(() => {
        /* Fixed fallback list remains available. */
      });
    return () => {
      active = false;
    };
  }, []);

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
    if (countries.length) {
      return countries.map((item) => ({ code: item.country_code, name: item.country_name.toUpperCase() }));
    }
    return [
      { code: "IN", name: "INDIA" },
      { code: "GB", name: "UNITED KINGDOM" },
      { code: "US", name: "UNITED STATES" },
      { code: "AE", name: "UAE" },
      { code: "AU", name: "AUSTRALIA" },
      { code: "SG", name: "SINGAPORE" },
      { code: "NZ", name: "NEW ZEALAND" },
    ];
  }, [countries]);
  const countryName = countryOptions.find((item) => item.code === countryCode)?.name || countryCode || "INDIA";

  const siteName = settings.site_name || settings.app_name || "Tourvaa";
  const tagline =
    settings.site_tagline ||
    settings.footer_description ||
    "Explore more, travel better, and create memories with Tourvaa.";

  return (
    <footer className="bg-white text-slate-700 pt-4 pb-6 sm:pb-8">
      {/* Dark Navy Contained Container Card */}
        <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-8">
          <div className="rounded-2xl sm:rounded-3xl bg-pub-primary text-white p-8 sm:p-10 lg:p-12 shadow-xl">
            <div className="grid gap-8 sm:gap-10 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-[1.1fr_1.1fr_1fr_1.5fr]">
              {/* Columns 1-3: CMS-managed footer sections (Support / Our Company / Login by default - see Admin > CMS > Footer) */}
              {footerSections.map((section) => (
                <div key={section.id}>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-4 sm:mb-5 tracking-tight">
                    {section.title}
                  </h3>
                  <ul className="space-y-3">
                    {section.links.map((link) => (
                      <li key={link.id}>
                        <Link
                          href={link.url}
                          target={link.open_in_new_tab ? "_blank" : undefined}
                          rel={link.open_in_new_tab ? "noreferrer" : undefined}
                          className="group flex items-center gap-2 text-xs sm:text-sm text-slate-300 transition-colors hover:text-white"
                        >
                          <span className="text-slate-400 group-hover:text-white transition-colors">•</span>
                          <span>{link.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

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
                        <span className="truncate">{countryName}</span>
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
                                key={item.code}
                                type="button"
                                onClick={() => {
                                  void setCountry(item.code);
                                  setCountryOpen(false);
                                  router.push(`/tours?country=${encodeURIComponent(item.name)}`);
                                }}
                                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                                  item.code === countryCode
                                    ? "bg-pub-accent/10 text-pub-accent font-bold"
                                    : "text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                <span>{item.name}</span>
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
                    <FaFacebookF size={16} />
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
                    <FaXTwitter size={16} />
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="LinkedIn"
                    className="transition-transform duration-200 hover:scale-125 hover:text-white"
                  >
                    <FaLinkedinIn size={16} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Text -- extra bottom padding keeps this clear of
            the fixed chat-widget launcher button, which otherwise sits
            directly over this text once the page is scrolled all the way
            down (the launcher has nothing left to hide behind at that
            point). */}
        <div className="mx-auto max-w-[1400px] px-4 pt-6 pb-20 sm:pb-24 text-center text-xs text-slate-500">
          <p>
            Copyright © {new Date().getFullYear()} by Tourvaa Private Limited - All Right Reserved | Design & Developed by Ayatiworks
          </p>
        </div>
      </footer>
  );
}

