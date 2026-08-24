"use client";

import { useEffect, useState } from "react";
import { LuPercent as Percent } from "react-icons/lu";
import api from "@/lib/api/client";
import Loader from "@/components/ui/Loader";

type Profile = {
  commission_percentage?: string | number | null;
  commission_accepted_at?: string | null;
};

export default function CommissionTab() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [platformMinRate, setPlatformMinRate] = useState<number | null>(null);
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

  return (
    <div>
      <h2 className="flex items-center gap-2 text-lg font-black text-[#123024]"><Percent size={18} /> Commission %</h2>
      <p className="mt-1 text-sm text-[#647B6E]">
        This is the commission you&apos;ve agreed to offer Tourvaa on every booking, set when you created your account.
        It&apos;s the floor used on every pricing slab you add -- you may raise it for a specific tour, never lower it.
      </p>
      <div className="mt-4 rounded-xl bg-[#F5FAF7] p-4">
        <p className="text-xs font-bold uppercase text-[#8AA099]">Your commission rate</p>
        <p className="mt-1 text-3xl font-black text-[#123024]">{effectiveRate ?? "-"}%</p>
        {profile?.commission_accepted_at && (
          <p className="mt-2 text-xs text-[#647B6E]">Agreed on {new Date(profile.commission_accepted_at).toLocaleDateString()}.</p>
        )}
      </div>
      <p className="mt-3 text-xs text-[#647B6E]">Use the Commission Calculator on your Earnings page any time to see exactly what a booking will pay out after commission.</p>
    </div>
  );
}
