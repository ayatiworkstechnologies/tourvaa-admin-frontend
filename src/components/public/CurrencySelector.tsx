"use client";

import { useCurrency } from "@/hooks/useCurrency";

export default function CurrencySelector({ inverse = false, plain = false }: { inverse?: boolean; plain?: boolean }) {
  const { code, currencies, setCode, loading, isStale, forced } = useCurrency();
  const boxClass = plain ? "" : `rounded-lg border px-2 py-2 ${inverse ? "border-white/20 bg-white/10" : "border-slate-200 bg-white"}`;
  const textClass = inverse ? "text-white" : "text-slate-700";

  if (forced) {
    return (
      <span title="Site currency (set by admin)" className={`text-xs font-black ${boxClass} ${textClass}`}>
        {code}
      </span>
    );
  }

  return (
    <label className="relative" title={isStale ? "Using cached exchange rates" : "Display currency"}>
      <span className="sr-only">Display currency</span>
      <select
        aria-label="Display currency"
        value={code}
        disabled={loading}
        onChange={(event) => setCode(event.target.value)}
        className={`cursor-pointer text-xs font-black outline-none transition ${boxClass} ${textClass}`}
      >
        {currencies.length
          ? currencies.map((item) => (
              <option className="text-slate-900" key={item.code} value={item.code}>
                {item.symbol && item.symbol !== item.code ? `${item.symbol} ${item.code}` : item.code}
              </option>
            ))
          : <option value="USD">$ USD</option>}
      </select>
      {isStale && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-amber-400" aria-label="Cached rates" />}
    </label>
  );
}
