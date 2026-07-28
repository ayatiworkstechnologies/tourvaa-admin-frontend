"use client";

import { useEffect, useState } from "react";
import { LuLoaderCircle as Loader2, LuRefreshCw as RefreshCw } from "react-icons/lu";
import api from "@/lib/api/client";
import Loader from "@/components/ui/Loader";
import { useToast } from "@/hooks/useToast";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";

type RatesPayload = {
  base: string;
  rates: Record<string, number>;
  source: string;
  rate_date?: string | null;
  is_stale: boolean;
  fetched_at?: string | null;
};

export default function CurrencyRatesSection() {
  const toast = useToast();
  const [data, setData] = useState<RatesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/currency/admin/rates");
      setData(res.data?.data ?? null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await api.post("/currency/admin/refresh");
      setData(res.data?.data ?? null);
      toast.success("Exchange rates refreshed.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) return <Loader label="Loading exchange rates..." />;
  if (!data) return <p className="text-sm text-dash-muted">Could not load exchange rates.</p>;

  const rateEntries = Object.entries(data.rates).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dash-border bg-dash-bg p-4">
        <div className="text-sm">
          <p className="font-bold text-dash-text">Base currency: {data.base}</p>
          <p className="text-xs text-dash-muted">
            Source: {data.source} {data.is_stale && <span className="font-bold text-amber-700">(stale fallback)</span>}
            {data.rate_date ? ` · Rate date: ${data.rate_date}` : ""}
            {data.fetched_at ? ` · Fetched: ${new Date(data.fetched_at).toLocaleString()}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60"
        >
          {refreshing ? <Loader2 className="animate-spin" size={15} /> : <RefreshCw size={15} />}
          Refresh Now
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {rateEntries.map(([code, rate]) => (
          <div key={code} className="rounded-xl border border-dash-border p-3 text-sm">
            <p className="font-bold text-dash-text">{code}</p>
            <p className="text-dash-muted">{Number(rate).toFixed(4)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
