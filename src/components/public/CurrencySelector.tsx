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
    <label className="inline-flex items-center gap-1" title={isStale ? "Using cached exchange rates" : "Display currency"}>
      <span className="sr-only">Display currency</span>
      <select
        aria-label="Display currency"
        value={code}
        disabled={loading}
        onChange={(event) => setCode(event.target.value)}
        className={`cursor-pointer text-xs font-black outline-none transition disabled:opacity-60 ${boxClass} ${textClass}`}
      >
        {currencies.length
          ? currencies.map((item) => (
              <option className="text-slate-900" key={item.code} value={item.code}>
                {item.symbol && item.symbol !== item.code ? `${item.symbol} ${item.code}` : item.code}
              </option>
            ))
          : <option value="USD">$ USD</option>}
      </select>
      {loading && <span className="inline-block h-2.5 w-2.5 shrink-0 animate-spin rounded-full border-[1.5px] border-current border-t-transparent opacity-60" aria-hidden="true" />}
      {!loading && isStale && (
        <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[8px] font-bold uppercase tracking-wide text-amber-500">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
          Cached
        </span>
      )}
    </label>
  );
}
