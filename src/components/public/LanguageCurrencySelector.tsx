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
import { PUBLIC_HEADER_COUNTRY_CODES, useCurrency } from "@/hooks/useCurrency";
import { fetchPublicCountries, PublicCountry } from "@/lib/api/publicClient";
import FlagIcon from "@/components/ui/FlagIcon";

// ─── Unified Component ────────────────────────────────────────────────────────
// Language is handled by the Elfsight Website Translator, which renders its
// own picker (see components/public/ElfsightTranslator.tsx), so this selector
// only covers currency and country.

// Country leads: picking one sets the currency automatically, so it is the
// more useful entry point of the two.
type Tab = "country" | "currency";

// The public header intentionally offers a focused, business-approved set of
// countries and their matching display currencies rather than every ISO entry
// returned by the master-country API.
const HEADER_COUNTRY_ORDER = new Map<string, number>(
  PUBLIC_HEADER_COUNTRY_CODES.map((code, index) => [code, index]),
);

export default function LanguageCurrencySelector({
  inverse = false,
}: {
  inverse?: boolean;
  plain?: boolean;
}) {
  const { code: currCode, symbol, currencies, setCode, isStale, countryCode, setCountry } = useCurrency();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("country");
  const [search, setSearch] = useState("");
  const [countries, setCountries] = useState<PublicCountry[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetchPublicCountries().then((items) => { if (active) setCountries(items); }).catch(() => {});
    return () => { active = false; };
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
    const activeCurrencyCodes = new Set(
      countries.map((country) => country.currency_code?.toUpperCase()).filter(Boolean),
    );
    const allowed = activeCurrencyCodes.size
      ? list.filter((currency) => activeCurrencyCodes.has(currency.code.toUpperCase()))
      : list;
    if (!search.trim()) return allowed;
    const q = search.toLowerCase();
    return allowed.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        (c.symbol && c.symbol.toLowerCase().includes(q))
    );
  }, [countries, currencies, search]);

  // Country list - real countries once loaded, IP-detected by default (see
  // useCurrency.ts), manually changeable here.
  const countryList = useMemo(() => {
    const allowed = [...countries]
      .sort(
        (a, b) =>
          (HEADER_COUNTRY_ORDER.get(a.country_code.toUpperCase()) ?? 10000) -
            (HEADER_COUNTRY_ORDER.get(b.country_code.toUpperCase()) ?? 10000) ||
          a.country_name.localeCompare(b.country_name),
      );
    if (!search.trim()) return allowed;
    const q = search.toLowerCase();
    return allowed.filter((c) => c.country_name.toLowerCase().includes(q) || c.country_code.toLowerCase().includes(q));
  }, [countries, search]);

  const activeCountry = countries.find((c) => c.country_code === countryCode);
  const displayCountry = countryCode || activeCountry?.country_code || "IN";

  return (
    <div ref={ref} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Currency & Country"
        className={`group flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors focus:outline-none ${
          inverse ? "text-white hover:text-white/80" : "text-pub-primary hover:text-pub-secondary"
        }`}
      >
        <Globe
          size={18}
          className={`stroke-[1.8] transition-all duration-200 group-hover:-translate-y-0.5 ${
            inverse ? "" : "text-pub-primary group-hover:text-pub-secondary"
          }`}
        />
        <span className="flex items-center gap-0.5">
          <span className="flex items-center font-semibold">
            <span className="mr-1 h-2.5 w-4 overflow-hidden rounded-[2px]">
              <FlagIcon countryCode={displayCountry} />
            </span>
            <span>{displayCountry}</span>
            <span className={`mx-1 ${inverse ? "text-white/40" : "text-slate-300"}`}>|</span>
            <span>
              {currCode}
              {symbol && symbol !== currCode ? ` ${symbol}` : ""}
            </span>
          </span>
          <ChevronDown
            size={10}
            className={`transition-transform duration-200 ${
              open
                ? "rotate-180 text-pub-accent"
                : inverse
                  ? ""
                  : "text-pub-primary group-hover:text-pub-secondary"
            }`}
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
              onClick={() => setTab("country")}
              className={`flex-1 py-3 text-xs font-bold transition-colors ${
                tab === "country"
                  ? "border-b-2 border-pub-accent text-pub-accent"
                  : "text-slate-500 hover:text-pub-primary"
              }`}
            >
              🌍 Country
            </button>
            <button
              type="button"
              onClick={() => setTab("currency")}
              className={`flex-1 py-3 text-xs font-bold transition-colors ${
                tab === "currency"
                  ? "border-b-2 border-pub-accent text-pub-accent"
                  : "text-slate-500 hover:text-pub-primary"
              }`}
            >
              💱 Currency
            </button>
          </div>

          <div className="p-3">
            {/* ── Country Tab ── */}
            {tab === "country" && (
              <>
                <div className="relative mb-2">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search country..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-7 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-pub-accent focus:bg-white focus:ring-2 focus:ring-pub-accent/15"
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
                  {countryList.length ? (
                    countryList.map((item) => {
                      const selected = item.country_code === countryCode;
                      return (
                        <button
                          key={item.country_code}
                          type="button"
                          onClick={() => {
                            // Hand over the country's own currency so the
                            // switch is immediate rather than waiting on the
                            // /currency/context lookup.
                            void setCountry(item.country_code, item.currency_code);
                            setOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                            selected ? "bg-pub-primary text-white shadow-sm" : "text-slate-800 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="h-3 w-5 shrink-0 overflow-hidden rounded-[2px]">
                              <FlagIcon countryCode={item.country_code} />
                            </span>
                            <span className="truncate">{item.country_name}</span>
                          </div>
                          {selected && <Check size={13} className="shrink-0 text-[#d95d2c]" />}
                        </button>
                      );
                    })
                  ) : (
                    <p className="py-6 text-center text-xs text-slate-400">Loading countries...</p>
                  )}
                </div>

                <div className="mt-2 border-t border-slate-100 px-1 pt-1.5 text-[9px] font-semibold text-slate-400">
                  {activeCountry ? `Detected/selected: ${activeCountry.country_name}` : "Choosing a country updates the suggested currency too."}
                </div>
              </>
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-7 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-pub-accent focus:bg-white focus:ring-2 focus:ring-pub-accent/15"
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
                              ? "bg-pub-primary text-white shadow-sm"
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
