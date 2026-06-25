"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { currencySymbol, formatCurrency, formatCurrencyCompact } from "@/lib/currency";

let _cached: string | null = null;
let _promise: Promise<string> | null = null;

async function loadCurrency(): Promise<string> {
  if (_cached) return _cached;
  if (!_promise) {
    _promise = api
      .get("/settings/public")
      .then((r) => {
        _cached = (r.data?.data?.currency as string) || "USD";
        return _cached;
      })
      .catch(() => {
        _cached = "USD";
        return _cached;
      });
  }
  return _promise;
}

/** Forces a reload of the currency from the server — call after admin saves Settings. */
export function invalidateCurrencyCache() {
  _cached = null;
  _promise = null;
}

/**
 * Returns the current platform currency code + helpers.
 * Reads from /api/settings/public (no auth). Cached after first call.
 */
export function useCurrency() {
  const [code, setCode] = useState<string>(_cached ?? "USD");

  useEffect(() => {
    loadCurrency().then(setCode);
  }, []);

  return {
    code,
    symbol: currencySymbol(code),
    format: (amount: number | string | null | undefined) => formatCurrency(amount, code),
    formatCompact: (amount: number | string | null | undefined) => formatCurrencyCompact(amount, code),
  };
}
