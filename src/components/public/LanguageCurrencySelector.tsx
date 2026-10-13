"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LuChevronDown as ChevronDown, LuGlobe as Globe, LuSearch as Search, LuSparkles as Sparkles, LuX as X } from "react-icons/lu";
import FlagIcon from "@/components/ui/FlagIcon";
import { PUBLIC_HEADER_COUNTRY_CODES, useCurrency } from "@/hooks/useCurrency";
import { PublicCountry, fetchPublicCountries } from "@/lib/api/publicClient";
import { currencySymbol } from "@/lib/utils/currency";

// Keeps currency-only portal headers usable while live rate configuration loads.
const FALLBACK_CURRENCIES = [
  { code: "INR", symbol: "₹" }, { code: "USD", symbol: "$" }, { code: "EUR", symbol: "€" }, { code: "GBP", symbol: "£" },
  { code: "AED", symbol: "AED" }, { code: "AUD", symbol: "A$" }, { code: "CAD", symbol: "C$" }, { code: "SGD", symbol: "S$" },
];

type LanguageCurrencySelectorProps = {
  inverse?: boolean;
  plain?: boolean;
  showCountry?: boolean;
};

const COUNTRY_ORDER = new Map<string, number>(PUBLIC_HEADER_COUNTRY_CODES.map((code, index) => [code, index]));

export default function LanguageCurrencySelector({ inverse = false, showCountry = false }: LanguageCurrencySelectorProps) {
  const { code, symbol, currencies, setCode, countryCode, countrySource, setCountry, forced, isStale } = useCurrency();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [countries, setCountries] = useState<PublicCountry[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showCountry) return;
    let active = true;
    fetchPublicCountries().then((items) => active && setCountries(items)).catch(() => {});
    return () => { active = false; };
  }, [showCountry]);

  useEffect(() => {
    const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, []);

  const countryList = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...countries].filter((country) => !query || [country.country_name, country.country_code, country.currency_code]
      .filter(Boolean).some((value) => value!.toLowerCase().includes(query)))
      .sort((a, b) => (COUNTRY_ORDER.get(a.country_code.toUpperCase()) ?? 10000) - (COUNTRY_ORDER.get(b.country_code.toUpperCase()) ?? 10000) || a.country_name.localeCompare(b.country_name));
  }, [countries, search]);

  const currencyList = useMemo(() => {
    const query = search.trim().toLowerCase();
    const availableCurrencies = currencies.length ? currencies : FALLBACK_CURRENCIES;
    return availableCurrencies.filter((currency) => !query || currency.code.toLowerCase().includes(query) || currency.symbol?.toLowerCase().includes(query));
  }, [currencies, search]);

  const selectedCountry = useMemo(() => countries.find((country) => country.country_code.toUpperCase() === countryCode?.toUpperCase()), [countries, countryCode]);
  const sourceText = {
    cdn: "Using a location-based country suggestion.", ip: "Using a location-based country suggestion.", locale: "Based on your browser region.",
    saved: "Using your saved country preference.", manual: "Using your selected country.", unknown: "Choose a country to show its local currency.",
  }[countrySource];

  const selectCountry = (country: PublicCountry) => {
    void setCountry(country.country_code, country.currency_code);
    setOpen(false);
    setSearch("");
  };

  const selectCurrency = (currencyCode: string) => {
    setCode(currencyCode);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-haspopup="dialog" title={showCountry ? "Location and currency" : "Currency"} className={`group flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors focus:outline-none ${inverse ? "text-white hover:text-white/80" : "text-pub-primary hover:text-pub-secondary"}`}>
        {showCountry && selectedCountry ? <span className="flex h-[18px] w-[18px] items-center justify-center overflow-hidden rounded-full ring-1 ring-slate-200"><FlagIcon countryCode={selectedCountry.country_code} className="text-[18px] leading-none" /></span> : <Globe size={18} className={`stroke-[1.8] ${inverse ? "" : "text-pub-primary"}`} />}
        <span className="flex items-center gap-0.5"><span>{code}{symbol && symbol !== code ? ` ${symbol}` : ""}</span><ChevronDown size={10} className={`${open ? "rotate-180 text-pub-accent" : inverse ? "" : "text-pub-primary"} transition-transform`} /></span>
      </button>

      {open && <div role="dialog" aria-label={showCountry ? "Location and currency" : "Choose currency"} className="absolute right-0 top-[calc(100%+10px)] z-[100] w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.22)] ring-1 ring-slate-900/5">
        <div className="border-b border-slate-100 px-5 py-4"><p className="text-sm font-bold text-pub-primary">{showCountry ? "Location & currency" : "Choose currency"}</p>{showCountry && <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">{sourceText} Enabled countries control the available currencies.</p>}</div>
        <div className="p-4">
          <div className="relative mb-2"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={showCountry ? "Search country or currency..." : "Search currency..."} className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-9 pr-8 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-pub-accent focus:bg-white focus:ring-2 focus:ring-pub-accent/15" />{search && <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-700" aria-label="Clear search"><X size={12} /></button>}</div>
          {showCountry ? <div className="no-scrollbar max-h-72 space-y-0.5 overflow-y-auto pr-0.5">{countryList.length ? countryList.map((country) => {
            const selected = country.country_code.toUpperCase() === countryCode?.toUpperCase();
            const currencyCode = country.currency_code?.toUpperCase() || "USD";
            return <button key={country.country_code} type="button" onClick={() => selectCountry(country)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${selected ? "bg-pub-primary text-white shadow-sm" : "text-slate-800 hover:bg-slate-100"}`}><span className="flex min-w-0 items-center gap-2.5"><FlagIcon countryCode={country.country_code} className="text-lg leading-none" /><span className="truncate">{country.country_name}</span></span><span className={`ml-3 shrink-0 text-xs font-bold ${selected ? "text-slate-100" : "text-slate-500"}`}>{currencyCode} <span className="ml-1">{currencySymbol(currencyCode)}</span></span></button>;
          }) : <p className="py-6 text-center text-sm text-slate-400">No country found.</p>}</div> : <div className="no-scrollbar max-h-72 space-y-0.5 overflow-y-auto pr-0.5">{currencyList.map((currency) => <button key={currency.code} type="button" disabled={forced} onClick={() => selectCurrency(currency.code)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${currency.code === code ? "bg-pub-primary text-white" : "text-slate-800 hover:bg-slate-100"} ${forced ? "cursor-not-allowed opacity-60" : ""}`}><span>{currency.code}</span><span>{currency.symbol}</span></button>)}</div>}
          {isStale && <div className="mt-2 flex items-center gap-1 border-t border-slate-100 px-1 pt-2 text-[10px] font-semibold text-amber-600"><Sparkles size={10} /><span>Cached exchange rates</span></div>}
        </div>
      </div>}
    </div>
  );
}
