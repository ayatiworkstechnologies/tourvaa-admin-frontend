"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";

type Form = {
  contact_name: string;
  phone: string;
  agency_name: string;
  address: string;
};

export default function AgencyDetailsTab() {
  const toast = useToast();
  const { dashboard, refreshSession } = useAuthContext();
  const agentId = (dashboard?.user as Record<string, unknown>)?.agent_id ?? dashboard?.user?.id;
  const [form, setForm] = useState<Form>({
    contact_name: "",
    phone: "",
    agency_name: "",
    address: "",
  });
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    if (!agentId) return;
    api.get(`/agents/${agentId}`).then((res) => {
      const d = res.data?.data ?? res.data ?? {};
      setForm({
        contact_name: d.contact_name || "",
        phone: d.phone || "",
        agency_name: d.agency_name || d.company_name || "",
        address: d.address || "",
      });
    }).catch(() => {});
  }, [agentId]);

  const set = (k: keyof Form, v: string) => {
    setState("idle");
    setForm((f) => ({ ...f, [k]: v }));
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!agentId) return;
    setState("saving");
    try {
      await api.patch(`/agents/${agentId}`, {
        contact_name: form.contact_name,
        phone: form.phone,
        agency_name: form.agency_name,
        address: form.address,
      });
      await refreshSession();
      setState("saved");
      toast.success("Agency details updated.");
    } catch {
      setState("error");
      toast.error("Could not save agency details.");
    }
  }

  return (
    <form onSubmit={save} className="rounded-xl border border-[#E7EAF0] bg-white p-6 shadow-sm max-w-2xl">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-bold text-[#121826]">Agency Details</h2>
        <button
          type="submit"
          disabled={state === "saving"}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60 transition-colors"
        >
          {state === "saving" ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
          Save Changes
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-xs font-bold uppercase text-[#667085]">Agency / Company Name <span className="text-red-500">*</span></span>
          <input
            required
            value={form.agency_name}
            onChange={(e) => set("agency_name", e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
            placeholder="Agency name"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase text-[#667085]">Contact Person Name <span className="text-red-500">*</span></span>
          <input
            required
            value={form.contact_name}
            onChange={(e) => set("contact_name", e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
            placeholder="Contact person"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase text-[#667085]">Business Phone <span className="text-red-500">*</span></span>
          <input
            required
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
            placeholder="Phone number"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="text-xs font-bold uppercase text-[#667085]">Business Address <span className="text-red-500">*</span></span>
          <input
            required
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
            placeholder="Agency address"
          />
        </label>
      </div>

      {state === "saved" && <p className="mt-4 text-sm font-bold text-emerald-700">Agency details updated successfully.</p>}
      {state === "error" && <p className="mt-4 text-sm font-bold text-red-600">Could not save details. Please try again.</p>}
    </form>
  );
}
