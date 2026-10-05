"use client";

import { useEffect, useState } from "react";
import { LuPercent as Percent } from "react-icons/lu";
import api from "@/lib/api/client";
import Loader from "@/components/ui/Loader";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";

type Profile = {
  commission_percentage?: string | number | null;
  commission_accepted_at?: string | null;
};

export default function CommissionTab() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [platformMinRate, setPlatformMinRate] = useState<number | null>(null);
  const [requestedRate, setRequestedRate] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([api.get("/suppliers/me"), api.get("/settings/public")]).then(([profileRes, settingsRes]) => {
      if (profileRes.status === "fulfilled") setProfile(profileRes.value.data?.data ?? null);
      if (settingsRes.status === "fulfilled") {
        const raw = settingsRes.value.data?.data?.supplier_commission_percentage;
        if (raw !== undefined) setPlatformMinRate(Number(raw));
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading commission..." />;

  // Every supplier is meant to have commission_percentage populated at
  // approval time, but fall back to the live platform rate rather than
  // show a blank "-%" for any account that predates that.
  const effectiveRate = profile?.commission_percentage ?? platformMinRate;

  const raiseCommission = async () => {
    const nextRate = Number(requestedRate);
    const currentRate = Number(effectiveRate);
    if (!Number.isFinite(nextRate) || nextRate <= 0 || nextRate > 100) {
      setRequestMessage("Enter a commission percentage between 0 and 100.");
      return;
    }
    if (Number.isFinite(currentRate) && nextRate <= currentRate) {
      setRequestMessage(`Enter a rate higher than your current ${currentRate}% rate.`);
      return;
    }

    setSaving(true);
    setRequestMessage("");
    try {
      const response = await api.put("/suppliers/me", { commission_percentage: nextRate });
      setProfile(response.data?.data ?? ((current) => current ? { ...current, commission_percentage: nextRate } : { commission_percentage: nextRate }));
      setRequestedRate("");
      setRequestMessage("Your commission rate has been increased.");
    } catch (error) {
      setRequestMessage(getApiErrorMessage(error) || "Your commission rate could not be updated.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="flex items-center gap-2 text-lg font-black text-[#123024]"><Percent size={18} /> Commission %</h2>
      <p className="mt-1 text-sm text-[#647B6E]">
        This is the commission you&apos;ve agreed to offer Tourvaa on every booking. It applies to future bookings and cannot be lowered through supplier self-service.
      </p>
      <div className="mt-4 rounded-xl bg-[#F5FAF7] p-4">
        <p className="text-xs font-bold uppercase text-[#8AA099]">Your commission rate</p>
        <p className="mt-1 text-3xl font-black text-[#123024]">{effectiveRate ?? "-"}%</p>
        {profile?.commission_accepted_at && (
          <p className="mt-2 text-xs text-[#647B6E]">Agreed on {new Date(profile.commission_accepted_at).toLocaleDateString()}.</p>
        )}
      </div>
      <div className="mt-4 rounded-xl border border-[#DCEBE2] p-4">
        <h3 className="text-sm font-black text-[#123024]">Increase your commission rate</h3>
        <p className="mt-1 text-xs leading-5 text-[#647B6E]">
          You can raise the percentage Tourvaa retains from future bookings. A higher rate may support discretionary promotional consideration, but does not guarantee placement, visibility, or sales.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="supplier-commission-rate">New commission percentage</label>
          <div className="relative w-full sm:max-w-48">
            <input
              id="supplier-commission-rate"
              type="number"
              min={Number.isFinite(Number(effectiveRate)) ? Number(effectiveRate) + 0.01 : 0.01}
              max="100"
              step="0.01"
              value={requestedRate}
              onChange={(event) => setRequestedRate(event.target.value)}
              placeholder="New rate"
              className="w-full rounded-lg border border-[#C8DCD0] py-2 pl-3 pr-8 text-sm text-[#123024] outline-none focus:border-[#16833A] focus:ring-2 focus:ring-[#16833A]/15"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-bold text-[#647B6E]">%</span>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => void raiseCommission()}
            className="rounded-lg bg-[#16833A] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0D6B2C] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : "Increase rate"}
          </button>
        </div>
        {requestMessage && <p className="mt-2 text-xs text-[#526B5D]" role="status">{requestMessage}</p>}
      </div>
      <p className="mt-3 text-xs text-[#647B6E]">Use the Commission Calculator on your Earnings page any time to see exactly what a booking will pay out after commission.</p>
      <aside className="mt-5 rounded-xl border border-[#DCEBE2] bg-[#F8FCF9] p-4 text-xs leading-5 text-[#526B5D]">
        <h3 className="font-black uppercase tracking-wide text-[#123024]">Marketplace pricing agreement</h3>
        <p className="mt-2">
          The supplier acknowledges that the Tourvaa Marketplace may apply a markup, commission, or service fee to the supplier&apos;s offered base rate to fund promotional activities, agents, affiliate payouts, and platform maintenance. The final booking price shown to an end consumer is determined by the Tourvaa Marketplace, subject to any mutually agreed rate-parity or pricing-boundary clauses in the agreement.
        </p>
      </aside>
    </div>
  );
}
