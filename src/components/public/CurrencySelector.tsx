"use client";

import { useCurrency } from "@/hooks/useCurrency";

export default function CurrencySelector({ inverse = false }: { inverse?: boolean }) {
  const { code, currencies, setCode, loading, isStale } = useCurrency();
  return (
    <label className="relative" title={isStale ? "Using cached exchange rates" : "Display currency"}>
      <span className="sr-only">Display currency</span>
      <select
        aria-label="Display currency"
        value={code}
        disabled={loading}
        onChange={(event) => setCode(event.target.value)}
        className={`cursor-pointer rounded-lg border px-2 py-2 text-xs font-black outline-none transition ${inverse ? "border-white/20 bg-white/10 text-white" : "border-slate-200 bg-white text-slate-700"}`}
      >
        {currencies.length ? currencies.map((item) => <option className="text-slate-900" key={item.code} value={item.code}>{item.code}</option>) : <option value="USD">USD</option>}
      </select>
      {isStale && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-amber-400" aria-label="Cached rates" />}
    </label>
  );
}
