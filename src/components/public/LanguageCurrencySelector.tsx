"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LuCheck as Check, LuChevronDown as ChevronDown, LuGlobe as Globe, LuSearch as Search, LuSparkles as Sparkles, LuX as X } from "react-icons/lu";
import { useCurrency } from "@/hooks/useCurrency";

// Language is handled by the Elfsight Website Translator. The public header
// intentionally exposes only the viewing currency, not a country filter.
const FALLBACK_CURRENCIES = [
  { code: "INR", symbol: "₹" }, { code: "USD", symbol: "$" }, { code: "EUR", symbol: "€" }, { code: "GBP", symbol: "£" },
  { code: "AUD", symbol: "A$" }, { code: "AED", symbol: "AED" }, { code: "SGD", symbol: "S$" }, { code: "CAD", symbol: "C$" },
  { code: "NZD", symbol: "NZ$" }, { code: "JPY", symbol: "¥" }, { code: "CHF", symbol: "CHF" }, { code: "THB", symbol: "฿" },
  { code: "MYR", symbol: "RM" }, { code: "IDR", symbol: "Rp" }, { code: "SAR", symbol: "SAR" }, { code: "QAR", symbol: "QAR" },
  { code: "TRY", symbol: "₺" }, { code: "ZAR", symbol: "R" },
];

export default function LanguageCurrencySelector({ inverse = false }: { inverse?: boolean; plain?: boolean }) {
  const { code: currCode, symbol, currencies, setCode, isStale } = useCurrency();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
    const esc = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, []);

  const currencyList = useMemo(() => {
    const list = currencies.length ? currencies : FALLBACK_CURRENCIES;
    const query = search.trim().toLowerCase();
    return query ? list.filter((currency) => currency.code.toLowerCase().includes(query) || currency.symbol?.toLowerCase().includes(query)) : list;
  }, [currencies, search]);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-haspopup="dialog" title="Currency" className={`group flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors focus:outline-none ${inverse ? "text-white hover:text-white/80" : "text-pub-primary hover:text-pub-secondary"}`}>
        <Globe size={18} className={`stroke-[1.8] transition-all duration-200 group-hover:-translate-y-0.5 ${inverse ? "" : "text-pub-primary group-hover:text-pub-secondary"}`} />
        <span className="flex items-center gap-0.5"><span>{currCode}{symbol && symbol !== currCode ? ` ${symbol}` : ""}</span><ChevronDown size={10} className={`transition-transform duration-200 ${open ? "rotate-180 text-pub-accent" : inverse ? "" : "text-pub-primary group-hover:text-pub-secondary"}`} /></span>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[100] w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.22)] ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-200">
          <div className="border-b border-slate-100 px-4 py-3 text-xs font-bold text-pub-primary">Choose currency</div>
          <div className="p-3">
            <div className="relative mb-2"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search currency..." className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-8 pr-7 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-pub-accent focus:bg-white focus:ring-2 focus:ring-pub-accent/15" />{search && <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-700" aria-label="Clear currency search"><X size={11} /></button>}</div>
            <div className="no-scrollbar max-h-56 space-y-0.5 overflow-y-auto pr-0.5">
              {currencyList.length ? currencyList.map((item) => {
                const selected = item.code === currCode;
                return <button key={item.code} type="button" onClick={() => { setCode(item.code); setOpen(false); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${selected ? "bg-pub-primary text-white shadow-sm" : "text-slate-800 hover:bg-slate-100"}`}><span className="flex items-center gap-2.5"><span className="w-9 text-left font-black">{item.code}</span><span className={`text-xs font-normal ${selected ? "text-slate-300" : "text-slate-500"}`}>{item.symbol || ""}</span></span>{selected && <Check size={13} className="shrink-0 text-[#d95d2c]" />}</button>;
              }) : <p className="py-6 text-center text-xs text-slate-400">No currency found.</p>}
            </div>
            {isStale && <div className="mt-2 flex items-center gap-1 border-t border-slate-100 px-1 pt-1.5 text-[9px] font-semibold text-amber-600"><Sparkles size={9} /><span>Cached exchange rates</span></div>}
          </div>
        </div>
      )}
    </div>
  );
}
