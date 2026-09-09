"use client";

import { useEffect, useState } from "react";
import { getCurrencyList, loadCurrencyList, type CurrencyListItem } from "@/lib/utils/currency";

type Props = {
  value: string;
  onChange: (code: string) => void;
  className?: string;
  id?: string;
};

/** Shared currency dropdown backed by the DB-backed currency master list --
 * the single list of currencies offered anywhere a currency can be picked
 * (Settings, tour pricing, tour form, supplier profile, public selector), so
 * every picker stays in sync with what admins configure at /admin/settings/currencies. */
export default function CurrencySelect({ value, onChange, className, id }: Props) {
  const [list, setList] = useState<CurrencyListItem[]>(getCurrencyList());

  useEffect(() => {
    let active = true;
    loadCurrencyList().then((loaded) => {
      if (active) setList(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <select
      id={id}
      value={value || "USD"}
      onChange={(e) => onChange(e.target.value)}
      className={className ?? "w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"}
    >
      {list.map((c) => (
        <option key={c.code} value={c.code}>
          {c.symbol} - {c.code} - {c.name}
        </option>
      ))}
    </select>
  );
}
