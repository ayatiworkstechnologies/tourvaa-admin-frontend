"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  LuCheck as Check,
  LuChevronDown as ChevronDown,
  LuGlobe as Globe,
  LuSearch as Search,
  LuSparkles as Sparkles,
  LuX as X,
} from "react-icons/lu";
import { FaCoins } from "react-icons/fa6";
import FlagIcon from "@/components/ui/FlagIcon";
import { useCurrency } from "@/hooks/useCurrency";

export type SupportedLanguage = {
  code: string;
  googleCode: string;
  name: string;
  nativeName: string;
  countryCode: string;
};

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "EN", googleCode: "en", name: "English", nativeName: "English (US/UK)", countryCode: "GB" },
  { code: "ES", googleCode: "es", name: "Spanish", nativeName: "Español", countryCode: "ES" },
  { code: "FR", googleCode: "fr", name: "French", nativeName: "Français", countryCode: "FR" },
  { code: "DE", googleCode: "de", name: "German", nativeName: "Deutsch", countryCode: "DE" },
  { code: "IT", googleCode: "it", name: "Italian", nativeName: "Italiano", countryCode: "IT" },
  { code: "PT", googleCode: "pt", name: "Portuguese", nativeName: "Português", countryCode: "PT" },
  { code: "RU", googleCode: "ru", name: "Russian", nativeName: "Русский", countryCode: "RU" },
  { code: "AR", googleCode: "ar", name: "Arabic", nativeName: "العربية", countryCode: "AE" },
  { code: "HI", googleCode: "hi", name: "Hindi", nativeName: "हिन्दी", countryCode: "IN" },
  { code: "BN", googleCode: "bn", name: "Bengali", nativeName: "বাংলা", countryCode: "IN" },
  { code: "TA", googleCode: "ta", name: "Tamil", nativeName: "தமிழ்", countryCode: "IN" },
  { code: "TE", googleCode: "te", name: "Telugu", nativeName: "తెలుగు", countryCode: "IN" },
  { code: "ZH", googleCode: "zh-CN", name: "Chinese (Simplified)", nativeName: "简体中文", countryCode: "CN" },
  { code: "ZH-TW", googleCode: "zh-TW", name: "Chinese (Traditional)", nativeName: "繁體中文", countryCode: "TW" },
  { code: "JA", googleCode: "ja", name: "Japanese", nativeName: "日本語", countryCode: "JP" },
  { code: "KO", googleCode: "ko", name: "Korean", nativeName: "한국어", countryCode: "KR" },
  { code: "TR", googleCode: "tr", name: "Turkish", nativeName: "Türkçe", countryCode: "TR" },
  { code: "NL", googleCode: "nl", name: "Dutch", nativeName: "Nederlands", countryCode: "NL" },
  { code: "PL", googleCode: "pl", name: "Polish", nativeName: "Polski", countryCode: "PL" },
  { code: "SV", googleCode: "sv", name: "Swedish", nativeName: "Svenska", countryCode: "SE" },
  { code: "EL", googleCode: "el", name: "Greek", nativeName: "Ελληνικά", countryCode: "GR" },
  { code: "TH", googleCode: "th", name: "Thai", nativeName: "ภาษาไทย", countryCode: "TH" },
  { code: "VI", googleCode: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", countryCode: "VN" },
  { code: "ID", googleCode: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", countryCode: "ID" },
  { code: "MS", googleCode: "ms", name: "Malay", nativeName: "Bahasa Melayu", countryCode: "MY" },
  { code: "HE", googleCode: "he", name: "Hebrew", nativeName: "עברית", countryCode: "IL" },
  { code: "FA", googleCode: "fa", name: "Persian", nativeName: "فارسی", countryCode: "IR" },
  { code: "TL", googleCode: "tl", name: "Filipino", nativeName: "Tagalog", countryCode: "PH" },
  { code: "DA", googleCode: "da", name: "Danish", nativeName: "Dansk", countryCode: "DK" },
  { code: "FI", googleCode: "fi", name: "Finnish", nativeName: "Suomi", countryCode: "FI" },
  { code: "NO", googleCode: "no", name: "Norwegian", nativeName: "Norsk", countryCode: "NO" },
  { code: "CS", googleCode: "cs", name: "Czech", nativeName: "Čeština", countryCode: "CZ" },
  { code: "HU", googleCode: "hu", name: "Hungarian", nativeName: "Magyar", countryCode: "HU" },
  { code: "RO", googleCode: "ro", name: "Romanian", nativeName: "Română", countryCode: "RO" },
  { code: "UK", googleCode: "uk", name: "Ukrainian", nativeName: "Українська", countryCode: "UA" },
];

const LANG_STORAGE_KEY = "tourvaa_display_language";

export default function CurrencySelector({
  inverse = false,
  plain = false,
}: {
  inverse?: boolean;
  plain?: boolean;
}) {
  const { code, symbol, currencies, setCode, loading, isStale, forced } = useCurrency();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"currency" | "language">("currency");
  const [langCode, setLangCode] = useState("EN");
  const [search, setSearch] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize and persist language
  useEffect(() => {
    try {
      // Check active translation cookie
      const cookies = document.cookie.split(";");
      let cookieLang: string | null = null;
      for (let c of cookies) {
        c = c.trim();
        if (c.startsWith("googtrans=")) {
          const val = c.substring("googtrans=".length);
          const parts = val.split("/");
          const codePart = parts[parts.length - 1]?.toLowerCase();
          if (codePart && codePart !== "en") {
            const found = SUPPORTED_LANGUAGES.find(
              (l) => l.googleCode.toLowerCase() === codePart || l.code.toLowerCase() === codePart
            );
            if (found) cookieLang = found.code;
          }
        }
      }

      if (cookieLang) {
        setLangCode(cookieLang);
        localStorage.setItem(LANG_STORAGE_KEY, cookieLang);
      } else {
        const saved = localStorage.getItem(LANG_STORAGE_KEY);
        if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
          setLangCode(saved);
        }
      }
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const selectLanguage = (selectedLang: SupportedLanguage) => {
    setLangCode(selectedLang.code);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, selectedLang.code);

      const targetGoogle = selectedLang.googleCode;
      if (typeof document !== "undefined") {
        const domain = window.location.hostname;
        const isIpOrLocalhost = domain === "localhost" || /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(domain);

        // Delete previous cookies
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        if (!isIpOrLocalhost) {
          document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
          document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain};`;
        }

        if (targetGoogle && targetGoogle !== "en") {
          const cookieVal = `/en/${targetGoogle}`;
          document.cookie = `googtrans=${cookieVal}; path=/;`;
          if (!isIpOrLocalhost) {
            document.cookie = `googtrans=${cookieVal}; path=/; domain=${domain};`;
            document.cookie = `googtrans=${cookieVal}; path=/; domain=.${domain};`;
          }
        }

        const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
        if (combo && combo.value !== targetGoogle) {
          combo.value = targetGoogle;
          combo.dispatchEvent(new Event("change", { bubbles: true }));
        }

        // Fast reload to ensure complete translation of all DOM nodes
        setTimeout(() => {
          window.location.reload();
        }, 150);
      }
    } catch {
      /* ignore storage errors */
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Filtered languages
  const filteredLanguages = useMemo(() => {
    if (!search.trim()) return SUPPORTED_LANGUAGES;
    const q = search.toLowerCase();
    return SUPPORTED_LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [search]);

  // Filtered currencies
  const filteredCurrencies = useMemo(() => {
    const list = currencies.length
      ? currencies
      : [
          { code: "INR", symbol: "₹" },
          { code: "USD", symbol: "$" },
          { code: "EUR", symbol: "€" },
          { code: "GBP", symbol: "£" },
          { code: "AUD", symbol: "A$" },
          { code: "AED", symbol: "AED" },
          { code: "SGD", symbol: "S$" },
          { code: "CAD", symbol: "C$" },
          { code: "NZD", symbol: "NZ$" },
          { code: "JPY", symbol: "¥" },
          { code: "CHF", symbol: "CHF" },
          { code: "THB", symbol: "฿" },
          { code: "MYR", symbol: "RM" },
          { code: "IDR", symbol: "Rp" },
          { code: "SAR", symbol: "SAR" },
          { code: "QAR", symbol: "QAR" },
          { code: "TRY", symbol: "₺" },
          { code: "ZAR", symbol: "R" },
        ];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        (c.symbol && c.symbol.toLowerCase().includes(q))
    );
  }, [currencies, search]);

  const displayLabel = `${langCode} | ${code} ${symbol || ""}`.trim();

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="group flex flex-col items-center gap-1 text-[10px] font-medium text-slate-700 hover:text-blue-600 transition-colors focus:outline-none"
        title="Change language and currency"
      >
        <Globe
          size={18}
          className="stroke-[1.8] transition group-hover:-translate-y-0.5 group-hover:text-blue-600 text-slate-700"
        />
        <span className="flex items-center gap-0.5">
          <span className="font-semibold">{displayLabel}</span>
          <ChevronDown
            size={10}
            className={`transition-transform duration-200 ${open ? "rotate-180 text-blue-600" : ""}`}
          />
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[100] w-84 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.22)] ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-200">
          {/* Header Switcher Tabs */}
          <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-xs font-bold mb-3">
            <button
              type="button"
              onClick={() => {
                setActiveTab("currency");
                setSearch("");
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
                activeTab === "currency"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <FaCoins size={12} className={activeTab === "currency" ? "text-[#d95d2c]" : "text-slate-400"} />
              <span>Currency ({code})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("language");
                setSearch("");
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
                activeTab === "language"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Globe size={13} className={activeTab === "language" ? "text-blue-600" : "text-slate-400"} />
              <span>Language ({langCode})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === "currency" ? "Search currency..." : "Search language..."}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-7 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-700"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Tab 1: Currency Selection */}
          {activeTab === "currency" && (
            <div>
              <div className="max-h-64 overflow-y-auto space-y-1 pr-1 no-scrollbar">
                {filteredCurrencies.length ? (
                  filteredCurrencies.map((item) => {
                    const isSelected = item.code === code;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => {
                          setCode(item.code);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                          isSelected
                            ? "bg-[#0f2439] text-white shadow-sm"
                            : "text-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-9 text-left font-black">{item.code}</span>
                          <span
                            className={`text-xs font-normal ${
                              isSelected ? "text-slate-300" : "text-slate-500"
                            }`}
                          >
                            {item.symbol || ""}
                          </span>
                        </div>
                        {isSelected && <Check size={14} className="text-[#d95d2c] font-black shrink-0" />}
                      </button>
                    );
                  })
                ) : (
                  <p className="py-6 text-center text-xs text-slate-400">No currency found.</p>
                )}
              </div>
              {isStale && (
                <div className="mt-2 border-t border-slate-100 px-2 pt-1.5 text-[9px] text-amber-600 font-semibold flex items-center gap-1">
                  <Sparkles size={10} />
                  <span>Cached exchange rates</span>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Language Selection */}
          {activeTab === "language" && (
            <div>
              <div className="max-h-64 overflow-y-auto space-y-1 pr-1 no-scrollbar">
                {filteredLanguages.length ? (
                  filteredLanguages.map((item) => {
                    const isSelected = item.code === langCode;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => {
                          selectLanguage(item);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                          isSelected
                            ? "bg-[#0f2439] text-white shadow-sm"
                            : "text-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FlagIcon
                            countryCode={item.countryCode}
                            className="h-3.5 w-4.5 shrink-0 rounded-xs border border-slate-200 shadow-xs"
                          />
                          <div className="truncate text-left">
                            <span className="block font-bold">{item.name}</span>
                            <span
                              className={`block text-[10px] font-normal ${
                                isSelected ? "text-slate-300" : "text-slate-400"
                              }`}
                            >
                              {item.nativeName}
                            </span>
                          </div>
                        </div>
                        {isSelected && <Check size={14} className="text-[#d95d2c] font-black shrink-0" />}
                      </button>
                    );
                  })
                ) : (
                  <p className="py-6 text-center text-xs text-slate-400">No language found.</p>
                )}
              </div>
            </div>
          )}

          {/* Footer Summary */}
          <div className="mt-3 border-t border-slate-100 pt-2.5 flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>
              Active: <b className="text-slate-700">{langCode}</b> • <b className="text-slate-700">{code} ({symbol || ""})</b>
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[#0f2439] font-bold hover:underline"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
