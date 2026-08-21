"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LuBriefcase as Briefcase, LuCheck as Check, LuCircleCheckBig as CheckCircle2, LuFileText as FileText, LuPercent as Percent, LuPartyPopper as PartyPopper } from "react-icons/lu";
import api from "@/lib/api/client";
import { SupplierPageShell } from "@/components/supplier/SupplierPage";
import Loader from "@/components/ui/Loader";

type SupplierProfile = {
  supplier_name?: string;
  commission_percentage?: string | number | null;
  business_info?: Record<string, unknown> | null;
  documents?: { document_type?: string; status?: string }[];
};

type DocRequirement = { document_type: string; label: string; required?: boolean };

const STEPS = ["Welcome", "Business Profile", "Commission & Payout", "Documents", "Finish"] as const;

export default function SupplierOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [docRequirements, setDocRequirements] = useState<DocRequirement[]>([]);
  const [platformMinRate, setPlatformMinRate] = useState<number | null>(null);
  const [commissionAccepted, setCommissionAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      api.get("/suppliers/me"),
      api.get("/suppliers/document-requirements"),
      api.get("/settings/public"),
    ]).then(([profileRes, docsRes, settingsRes]) => {
      if (profileRes.status === "fulfilled") setProfile(profileRes.value.data?.data ?? null);
      if (docsRes.status === "fulfilled") setDocRequirements(docsRes.value.data?.data ?? []);
      if (settingsRes.status === "fulfilled") {
        const raw = settingsRes.value.data?.data?.supplier_commission_percentage;
        if (raw !== undefined) setPlatformMinRate(Number(raw));
      }
    }).finally(() => setLoading(false));
  }, []);

  // Every supplier is meant to have commission_percentage populated at
  // approval time (services.suppliers.approve_supplier), but fall back to
  // the live platform rate rather than show a blank "-%" for any account
  // that predates that, or where approval happened through another path.
  const effectiveRate = profile?.commission_percentage ?? platformMinRate;
  const onCommissionStep = step === 2;

  async function finish() {
    setFinishing(true);
    try {
      await api.post("/suppliers/me/onboarding/complete");
      router.replace("/supplier/dashboard");
    } finally {
      setFinishing(false);
    }
  }

  if (loading) return <SupplierPageShell><Loader label="Loading your onboarding..." /></SupplierPageShell>;

  const approvedDocTypes = new Set((profile?.documents ?? []).filter((d) => d.status === "approved").map((d) => d.document_type));
  const businessEntries = Object.entries(profile?.business_info ?? {}).filter(([, v]) => v !== null && v !== undefined && v !== "");

  return (
    <SupplierPageShell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${i <= step ? "bg-[#16833A] text-white" : "bg-white text-[#8AA093] ring-1 ring-[#DCEBE2]"}`}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`mx-1 h-0.5 flex-1 ${i < step ? "bg-[#16833A]" : "bg-[#DCEBE2]"}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-[#DCEBE2] bg-white p-6 shadow-[0_10px_32px_-27px_rgba(15,82,48,.7)]">
          {step === 0 && (
            <div className="text-center">
              <PartyPopper size={40} className="mx-auto text-[#16833A]" />
              <h1 className="mt-3 text-xl font-black text-[#123024]">Welcome to Tourvaa, {profile?.supplier_name || "Supplier"}!</h1>
              <p className="mt-2 text-sm text-[#647B6E]">Your account has been approved. Let&apos;s quickly walk through a few things before you get started.</p>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black text-[#123024]"><Briefcase size={18} /> Confirm your business profile</h2>
              <p className="mt-1 text-sm text-[#647B6E]">This is what we have on file. You can update it any time from My Profile.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {businessEntries.length === 0 ? (
                  <p className="rounded-lg bg-[#F5FAF7] p-4 text-sm font-semibold text-[#647B6E]">No business registration details submitted yet - add them from your profile.</p>
                ) : (
                  businessEntries.map(([key, value]) => (
                    <div key={key} className="rounded-lg bg-[#F5FAF7] p-4">
                      <p className="text-xs font-bold uppercase text-[#8AA093]">{key.replace(/_/g, " ")}</p>
                      <p className="mt-1 text-sm font-semibold text-[#123024]">{String(value)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black text-[#123024]"><Percent size={18} /> Tourvaa&apos;s commission</h2>
              <p className="mt-1 text-sm text-[#647B6E]">This is Tourvaa&apos;s fixed commission rate for your account - the percentage deducted from your own price on every booking. It is set by Tourvaa, with a platform minimum of {platformMinRate ?? "-"}%; you may ask Tourvaa to raise it, but it can never go lower.</p>
              <div className="mt-4 rounded-xl bg-[#F5FAF7] p-4">
                <p className="text-xs font-bold uppercase text-[#8AA099]">Tourvaa commission rate</p>
                <p className="mt-1 text-2xl font-black text-[#123024]">{effectiveRate ?? "-"}%</p>
              </div>
              <p className="mt-3 text-xs text-[#647B6E]">Use the Commission Calculator on your Earnings page any time to see exactly what a booking will pay out after commission.</p>
              <label className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#DCEBE2] bg-white p-3">
                <input type="checkbox" checked={commissionAccepted} onChange={(e) => setCommissionAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#16833A]" />
                <span className="text-sm font-semibold text-[#123024]">I accept Tourvaa&apos;s commission rate of {effectiveRate ?? "-"}% to continue.</span>
              </label>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black text-[#123024]"><FileText size={18} /> Documents checklist</h2>
              <p className="mt-1 text-sm text-[#647B6E]">Upload and get these approved from My Profile → Documents to unlock all operational features.</p>
              <div className="mt-4 space-y-2">
                {docRequirements.map((doc) => (
                  <div key={doc.document_type} className="flex items-center justify-between rounded-lg bg-[#F5FAF7] px-4 py-3">
                    <span className="text-sm font-semibold text-[#123024]">{doc.label}</span>
                    {approvedDocTypes.has(doc.document_type) ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><CheckCircle2 size={14} /> Approved</span>
                    ) : (
                      <span className="text-xs font-bold text-amber-700">{doc.required ? "Required" : "Optional"}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center">
              <CheckCircle2 size={40} className="mx-auto text-[#16833A]" />
              <h1 className="mt-3 text-xl font-black text-[#123024]">You&apos;re all set</h1>
              <p className="mt-2 text-sm text-[#647B6E]">Head to your dashboard to create your first tour and start taking bookings.</p>
            </div>
          )}

          <div className="mt-6 flex justify-between gap-3">
            <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="rounded-xl border border-[#DCEBE2] px-4 py-2.5 text-sm font-bold text-[#365A45] disabled:opacity-40">Back</button>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={() => setStep((s) => s + 1)} disabled={onCommissionStep && !commissionAccepted} className="rounded-xl bg-[#16833A] px-5 py-2.5 text-sm font-black text-white hover:bg-[#117331] disabled:cursor-not-allowed disabled:opacity-40">Continue</button>
            ) : (
              <button type="button" onClick={() => void finish()} disabled={finishing} className="rounded-xl bg-[#16833A] px-5 py-2.5 text-sm font-black text-white hover:bg-[#117331] disabled:opacity-60">{finishing ? "Finishing..." : "Go to dashboard"}</button>
            )}
          </div>
        </div>
      </div>
    </SupplierPageShell>
  );
}
