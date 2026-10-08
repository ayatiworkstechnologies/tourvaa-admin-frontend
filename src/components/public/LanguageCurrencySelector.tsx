"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LuCheck as Check, LuChevronDown as ChevronDown, LuGlobe as Globe, LuSearch as Search, LuSparkles as Sparkles, LuX as X } from "react-icons/lu";
import FlagIcon from "@/components/ui/FlagIcon";
import { PUBLIC_HEADER_COUNTRY_CODES, useCurrency } from "@/hooks/useCurrency";
import { PublicCountry, fetchPublicCountries } from "@/lib/api/publicClient";

const FALLBACK_CURRENCIES = [
  { code: "INR", symbol: "₹" }, { code: "USD", symbol: "$" }, { code: "EUR", symbol: "€" }, { code: "GBP", symbol: "£" },
  { code: "AUD", symbol: "A$" }, { code: "AED", symbol: "AED" }, { code: "SGD", symbol: "S$" }, { code: "CAD", symbol: "C$" },
  { code: "NZD", symbol: "NZ$" }, { code: "JPY", symbol: "¥" }, { code: "CHF", symbol: "CHF" }, { code: "THB", symbol: "฿" },
  { code: "MYR", symbol: "RM" }, { code: "IDR", symbol: "Rp" }, { code: "SAR", symbol: "SAR" }, { code: "QAR", symbol: "QAR" },
  { code: "TRY", symbol: "₺" }, { code: "ZAR", symbol: "R" },
];

type LanguageCurrencySelectorProps = {
  inverse?: boolean;
  plain?: boolean;
  /** Show a country picker in public-site headers. Portal headers remain currency-only. */
  showCountry?: boolean;
};

const COUNTRY_ORDER = new Map<string, number>(PUBLIC_HEADER_COUNTRY_CODES.map((code, index) => [code, index]));

export default function LanguageCurrencySelector({ inverse = false, showCountry = false }: LanguageCurrencySelectorProps) {
  const { code: currCode, symbol, currencies, setCode, countryCode, countrySource, setCountry, forced, isStale } = useCurrency();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"country" | "currency">("country");
  const [search, setSearch] = useState("");
  const [countries, setCountries] = useState<PublicCountry[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showCountry) return;

    let active = true;
    fetchPublicCountries()
      .then((items) => {
        if (active) setCountries(items);
      })
      .catch(() => {
        // Currency selection remains available if the country catalogue is unavailable.
      });
    return () => {
      active = false;
    };
  }, [showCountry]);

  useEffect(() => {
    const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
    const esc = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, []);

  const enabledCurrencyCodes = useMemo(() => {
    // The Countries settings screen is the public availability source. USD
    // remains selectable as the safe fallback for an unlisted visitor
    // location, even if no enabled country uses USD at the moment.
    return new Set(["USD", ...countries.map((country) => country.currency_code?.toUpperCase()).filter(Boolean)]);
  }, [countries]);

  const currencyList = useMemo(() => {
    const list = currencies.length ? currencies : FALLBACK_CURRENCIES;
    const query = search.trim().toLowerCase();
    const publicCurrencies = showCountry
      ? list.filter((currency) => enabledCurrencyCodes.has(currency.code.toUpperCase()))
      : list;
    return query ? publicCurrencies.filter((currency) => currency.code.toLowerCase().includes(query) || currency.symbol?.toLowerCase().includes(query)) : publicCurrencies;
  }, [currencies, enabledCurrencyCodes, search, showCountry]);

  const countryList = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...countries]
      .filter((country) => {
        if (!query) return true;
        return [country.country_name, country.country_code, country.currency_code]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query));
      })
      .sort(
        (a, b) =>
          (COUNTRY_ORDER.get(a.country_code.toUpperCase()) ?? 10000) -
            (COUNTRY_ORDER.get(b.country_code.toUpperCase()) ?? 10000) ||
          a.country_name.localeCompare(b.country_name),
      );
  }, [countries, search]);

  const selectedCountry = useMemo(
    () => countries.find((country) => country.country_code.toUpperCase() === countryCode?.toUpperCase()),
    [countries, countryCode],
  );
  const countrySourceLabel = {
    cdn: "Auto-detected from your location.",
    ip: "Auto-detected from your IP address.",
    locale: "Based on your browser region.",
    saved: "Using your saved country preference.",
    manual: "Using your selected country.",
    unknown: "Choose a country to show its local currency.",
  }[countrySource];

  const selectCountry = (country: PublicCountry) => {
    void setCountry(country.country_code, country.currency_code);
    setOpen(false);
    setSearch("");
  };

  const selectTab = (tab: "country" | "currency") => {
    setActiveTab(tab);
    setSearch("");
  };

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-haspopup="dialog" title={showCountry ? "Location and currency" : "Currency"} className={`group flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors focus:outline-none ${inverse ? "text-white hover:text-white/80" : "text-pub-primary hover:text-pub-secondary"}`}>
        {showCountry && selectedCountry ? (
          <span className="flex h-[18px] w-[18px] items-center justify-center overflow-hidden rounded-full ring-1 ring-slate-200">
            <FlagIcon countryCode={selectedCountry.country_code} className="text-[18px] leading-none" />
          </span>
        ) : <Globe size={18} className={`stroke-[1.8] transition-all duration-200 group-hover:-translate-y-0.5 ${inverse ? "" : "text-pub-primary group-hover:text-pub-secondary"}`} />}
        <span className="flex items-center gap-0.5"><span>{currCode}{symbol && symbol !== currCode ? ` ${symbol}` : ""}</span><ChevronDown size={10} className={`transition-transform duration-200 ${open ? "rotate-180 text-pub-accent" : inverse ? "" : "text-pub-primary group-hover:text-pub-secondary"}`} /></span>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[100] w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.22)] ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-200">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-bold text-pub-primary">{showCountry ? "Location & currency" : "Choose currency"}</p>
            {showCountry && <p className="mt-0.5 text-[10px] font-medium text-slate-500">{countrySourceLabel} Enabled countries control the available currencies.</p>}
          </div>
          <div className="p-3">
            {showCountry && (
              <>
                <div role="tablist" aria-label="Location and currency selection" className="mb-3 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                  <button type="button" role="tab" aria-selected={activeTab === "country"} onClick={() => selectTab("country")} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${activeTab === "country" ? "bg-white text-pub-primary shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>Country</button>
                  <button type="button" role="tab" aria-selected={activeTab === "currency"} onClick={() => selectTab("currency")} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${activeTab === "currency" ? "bg-white text-pub-primary shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>Currency</button>
                </div>
              </>
            )}
            <div className="relative mb-2"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={showCountry && activeTab === "country" ? "Search country..." : "Search currency..."} className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-8 pr-7 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-pub-accent focus:bg-white focus:ring-2 focus:ring-pub-accent/15" />{search && <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-700" aria-label="Clear search"><X size={11} /></button>}</div>
            {showCountry && activeTab === "country" ? (
              <div role="tabpanel" className="no-scrollbar max-h-60 space-y-0.5 overflow-y-auto pr-0.5">
                {countryList.length ? countryList.map((country) => {
                  const selected = country.country_code.toUpperCase() === countryCode?.toUpperCase();
                  return <button key={country.country_code} type="button" onClick={() => selectCountry(country)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold transition ${selected ? "bg-pub-primary text-white shadow-sm" : "text-slate-800 hover:bg-slate-100"}`}><span className="flex min-w-0 items-center gap-2.5"><FlagIcon countryCode={country.country_code} className="text-base leading-none" /><span className="truncate">{country.country_name}</span></span><span className={`ml-3 shrink-0 text-[10px] font-bold ${selected ? "text-slate-300" : "text-slate-500"}`}>{country.currency_code || "—"}</span></button>;
                }) : <p className="py-6 text-center text-xs text-slate-400">No country found.</p>}
              </div>
            ) : (
              <div role="tabpanel" className="no-scrollbar max-h-60 space-y-0.5 overflow-y-auto pr-0.5">
                {currencyList.length ? currencyList.map((item) => {
                  const selected = item.code === currCode;
                  return <button key={item.code} type="button" disabled={forced} onClick={() => { setCode(item.code); setOpen(false); setSearch(""); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${selected ? "bg-pub-primary text-white shadow-sm" : "text-slate-800 hover:bg-slate-100"} ${forced ? "cursor-not-allowed opacity-60" : ""}`}><span className="flex items-center gap-2.5"><span className="w-9 text-left font-black">{item.code}</span><span className={`text-xs font-normal ${selected ? "text-slate-300" : "text-slate-500"}`}>{item.symbol || ""}</span></span>{selected && <Check size={13} className="shrink-0 text-[#d95d2c]" />}</button>;
                }) : <p className="py-6 text-center text-xs text-slate-400">No currency found.</p>}
              </div>
            )}
            {isStale && <div className="mt-2 flex items-center gap-1 border-t border-slate-100 px-1 pt-1.5 text-[9px] font-semibold text-amber-600"><Sparkles size={9} /><span>Cached exchange rates</span></div>}
          </div>
        </div>
      )}
    </div>
  );
}
