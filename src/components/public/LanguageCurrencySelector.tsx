"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  LuCheck as Check,
  LuChevronDown as ChevronDown,
  LuGlobe as Globe,
  LuSearch as Search,
  LuX as X,
  LuSparkles as Sparkles,
} from "react-icons/lu";
import { useCurrency } from "@/hooks/useCurrency";

// ─── Languages ───────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: "en",    label: "English",        short: "EN" },
  { code: "ta",    label: "தமிழ்",           short: "TA" },
  { code: "hi",    label: "हिंदी",           short: "HI" },
  { code: "ar",    label: "العربية",          short: "AR" },
  { code: "fr",    label: "Français",         short: "FR" },
  { code: "de",    label: "Deutsch",          short: "DE" },
  { code: "es",    label: "Español",          short: "ES" },
  { code: "zh-CN", label: "中文 (简体)",       short: "ZH" },
  { code: "ja",    label: "日本語",            short: "JA" },
  { code: "ko",    label: "한국어",            short: "KO" },
  { code: "ru",    label: "Русский",           short: "RU" },
  { code: "pt",    label: "Português",         short: "PT" },
  { code: "it",    label: "Italiano",          short: "IT" },
  { code: "ms",    label: "Melayu",            short: "MS" },
  { code: "th",    label: "ไทย",               short: "TH" },
];

function getActiveLanguageCode(): string {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/googtrans=(?:\/en\/)?([a-zA-Z-]+)/);
  if (!match) return "en";
  const code = match[1];
  return code === "en" || !code ? "en" : code;
}

function applyLanguage(langCode: string) {
  const val = langCode === "en" ? "" : `/en/${langCode}`;
  const host = window.location.hostname;
  const apex = host.split(".").slice(-2).join(".");
  document.cookie = `googtrans=${val}; path=/; domain=${host}`;
  document.cookie = `googtrans=${val}; path=/; domain=.${apex}`;
  const gt = (window as unknown as { google?: { translate?: { TranslateElement?: { getInstance?: () => { setLanguage?: (code: string) => void } } } } }).google?.translate?.TranslateElement?.getInstance?.();
  if (gt?.setLanguage) {
    gt.setLanguage(langCode);
  } else {
    window.location.reload();
  }
}

// ─── Unified Component ────────────────────────────────────────────────────────

type Tab = "language" | "currency";

export default function LanguageCurrencySelector({
  inverse = false,
  plain = false,
}: {
  inverse?: boolean;
  plain?: boolean;
}) {
  const { code: currCode, symbol, currencies, setCode, isStale } = useCurrency();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("language");
  const [langCode, setLangCode] = useState("en");
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Read language from cookie on mount
  useEffect(() => {
    setLangCode(getActiveLanguageCode());
  }, []);

  // Close on outside click / Escape
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  // Reset search when tab changes
  useEffect(() => { setSearch(""); }, [tab]);

  const activeLang = LANGUAGES.find((l) => l.code === langCode) ?? LANGUAGES[0];

  // Currency list
  const currencyList = useMemo(() => {
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

  return (
    <div ref={ref} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Language & Currency"
        className={`group flex flex-col items-center gap-1 text-[10px] font-medium transition-colors focus:outline-none ${
          inverse ? "text-white hover:text-white/80" : "text-slate-700 hover:text-blue-600"
        }`}
      >
        <Globe
          size={18}
          className={`stroke-[1.8] transition group-hover:-translate-y-0.5 ${
            inverse ? "" : "group-hover:text-blue-600"
          }`}
        />
        <span className="flex items-center gap-0.5">
          <span className="font-semibold">
            {activeLang.short}
            <span className={`mx-0.5 ${inverse ? "text-white/40" : "text-slate-300"}`}>|</span>
            {currCode}&thinsp;{symbol || ""}
          </span>
          <ChevronDown
            size={10}
            className={`transition-transform duration-200 ${open ? "rotate-180 text-blue-600" : ""}`}
          />
        </span>
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[100] w-72 rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.22)] ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            <button
              type="button"
              onClick={() => setTab("language")}
              className={`flex-1 py-3 text-xs font-bold transition-colors ${
                tab === "language"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              🌐 Language
            </button>
            <button
              type="button"
              onClick={() => setTab("currency")}
              className={`flex-1 py-3 text-xs font-bold transition-colors ${
                tab === "currency"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              💱 Currency
            </button>
          </div>

          <div className="p-3">
            {/* ── Language Tab ── */}
            {tab === "language" && (
              <div className="max-h-64 overflow-y-auto space-y-0.5 pr-0.5 no-scrollbar">
                {LANGUAGES.map((lang) => {
                  const selected = lang.code === langCode;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setLangCode(lang.code);
                        setOpen(false);
                        applyLanguage(lang.code);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                        selected
                          ? "bg-[#0f2439] text-white shadow-sm"
                          : "text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`w-7 shrink-0 text-left font-black ${
                            selected ? "text-white" : "text-slate-500"
                          }`}
                        >
                          {lang.short}
                        </span>
                        <span
                          className={`${selected ? "text-slate-300" : "text-slate-600"}`}
                        >
                          {lang.label}
                        </span>
                      </span>
                      {selected && (
                        <Check size={13} className="shrink-0 text-[#d95d2c]" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Currency Tab ── */}
            {tab === "currency" && (
              <>
                {/* Search */}
                <div className="relative mb-2">
                  <Search
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search currency..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-7 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-700"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>

                <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5 no-scrollbar">
                  {currencyList.length ? (
                    currencyList.map((item) => {
                      const selected = item.code === currCode;
                      return (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => {
                            setCode(item.code);
                            setOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                            selected
                              ? "bg-[#0f2439] text-white shadow-sm"
                              : "text-slate-800 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-9 text-left font-black">{item.code}</span>
                            <span
                              className={`text-xs font-normal ${
                                selected ? "text-slate-300" : "text-slate-500"
                              }`}
                            >
                              {item.symbol || ""}
                            </span>
                          </div>
                          {selected && (
                            <Check size={13} className="shrink-0 text-[#d95d2c]" />
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <p className="py-6 text-center text-xs text-slate-400">
                      No currency found.
                    </p>
                  )}
                </div>

                {isStale && (
                  <div className="mt-2 border-t border-slate-100 px-1 pt-1.5 text-[9px] text-amber-600 font-semibold flex items-center gap-1">
                    <Sparkles size={9} />
                    <span>Cached exchange rates</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
