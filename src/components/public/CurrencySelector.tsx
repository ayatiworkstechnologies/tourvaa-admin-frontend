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
import { useCurrency } from "@/hooks/useCurrency";

// Language switching lives in the Elfsight Website Translator widget now
// (see ElfsightTranslator.tsx) - it renders its own floating language
// picker with its own UI, and doesn't expose a public API to drive from
// custom code (confirmed with Elfsight's own staff on their community
// forum), so it can't be embedded inside this dropdown. This component is
// currency-only.

export default function CurrencySelector({
  inverse = false,
  plain = false,
}: {
  inverse?: boolean;
  plain?: boolean;
}) {
  const { code, symbol, currencies, setCode, isStale } = useCurrency();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

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

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`group flex flex-col items-center gap-1 text-[10px] font-medium transition-colors focus:outline-none ${
          inverse ? "text-white hover:text-white/80" : "text-slate-700 hover:text-blue-600"
        }`}
        title="Change currency"
      >
        <Globe
          size={18}
          className={`stroke-[1.8] transition group-hover:-translate-y-0.5 ${inverse ? "" : "group-hover:text-blue-600"}`}
        />
        <span className="flex items-center gap-0.5">
          <span className="font-semibold">{code} {symbol || ""}</span>
          <ChevronDown size={10} className={`transition-transform duration-200 ${open ? "rotate-180 text-blue-600" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[100] w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.22)] ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-200">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-950">Select currency</span>
          </div>

          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
                <X size={12} />
              </button>
            )}
          </div>

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
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isSelected ? "bg-[#0f2439] text-white shadow-sm" : "text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-9 text-left font-black">{item.code}</span>
                      <span className={`text-xs font-normal ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
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
    </div>
  );
}
