"use client";

import { CURRENCY_LIST } from "@/lib/utils/currency";

type Props = {
  value: string;
  onChange: (code: string) => void;
  className?: string;
  id?: string;
};

/** Shared currency dropdown backed by CURRENCY_LIST -- the single list of
 * currencies offered anywhere a currency can be picked (Settings, tour
 * pricing, tour form, public selector), so every picker stays in sync. */
export default function CurrencySelect({ value, onChange, className, id }: Props) {
  return (
    <select
      id={id}
      value={value || "USD"}
      onChange={(e) => onChange(e.target.value)}
      className={className ?? "w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"}
    >
      {CURRENCY_LIST.map((c) => (
        <option key={c.code} value={c.code}>
          {c.symbol} - {c.code} - {c.name}
        </option>
      ))}
    </select>
  );
}
