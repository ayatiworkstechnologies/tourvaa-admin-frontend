"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";
import { useGeoCities, useGeoCountries, useGeoStates } from "@/hooks/useGeo";

type Form = {
  supplier_name: string;
  supplier_type: string;
  years_in_operation: string;
  business_registration_number: string;
  gst_tax_number: string;
  target_market: string;
  destinations_sold: string;
  country_id: string;
  city_id: string;
};

const BUSINESS_TYPES = ["dmc", "tour_operator", "transport_provider", "hotel", "activity_provider", "other"];

export default function CompanyInfoTab() {
  const toast = useToast();
  const { refreshSession } = useAuthContext();
  const [form, setForm] = useState<Form>({
    supplier_name: "",
    supplier_type: "",
    years_in_operation: "",
    business_registration_number: "",
    gst_tax_number: "",
    target_market: "",
    destinations_sold: "",
    country_id: "",
    city_id: "",
  });
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [selectedStateId, setSelectedStateId] = useState("");
  const { countries } = useGeoCountries();
  const { states } = useGeoStates(form.country_id ? Number(form.country_id) : null);
  const { cities } = useGeoCities(
    selectedStateId ? Number(selectedStateId) : null,
    form.country_id ? Number(form.country_id) : null
  );

  useEffect(() => {
    api.get("/suppliers/me").then(res => {
      const d = res.data?.data ?? res.data ?? {};
      setForm({
        supplier_name: d.supplier_name || d.name || "",
        supplier_type: d.supplier_type || "",
        years_in_operation: String(d.years_in_operation || 0),
        business_registration_number: d.business_info?.business_registration_number || "",
        gst_tax_number: d.business_info?.gst_tax_number || "",
        target_market: d.business_info?.target_market || "",
        destinations_sold: d.business_info?.destinations_sold || "",
        country_id: String(d.country_id || ""),
        city_id: String(d.city_id || ""),
      });
    }).catch(() => {});
  }, []);

  const set = (k: keyof Form, v: string) => {
    setState("idle");
    setForm(f => ({ ...f, [k]: v }));
  };

  const setCountry = (value: string) => {
    setSelectedStateId("");
    setForm(f => ({ ...f, country_id: value, city_id: "" }));
    setState("idle");
  };

  const setCompanyState = (value: string) => {
    setSelectedStateId(value);
    setForm(f => ({ ...f, city_id: "" }));
    setState("idle");
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    try {
      const payload = {
        supplier_name: form.supplier_name,
        supplier_type: form.supplier_type,
        years_in_operation: parseInt(form.years_in_operation) || 0,
        country_id: parseInt(form.country_id) || null,
        city_id: parseInt(form.city_id) || null,
        business_info: {
          business_registration_number: form.business_registration_number,
          gst_tax_number: form.gst_tax_number,
          target_market: form.target_market,
          destinations_sold: form.destinations_sold,
        }
      };
      await api.patch("/suppliers/me", payload);
      await refreshSession();
      setState("saved");
      toast.success("Company info updated.");
    } catch {
      setState("error");
      toast.error("Could not save. Please try again.");
    }
  }

  return (
    <form onSubmit={save} className="rounded-xl border border-[#E7EAF0] bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-bold text-[#121826]">Business Details</h2>
        <button type="submit" disabled={state === "saving"}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
          {state === "saving" ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
          Save Changes
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-xs font-bold uppercase text-[#667085]">Company / Supplier Name <span className="text-red-500">*</span></span>
          <input required value={form.supplier_name} onChange={e => set("supplier_name", e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="Your company name" />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase text-[#667085]">Business Type</span>
          <select value={form.supplier_type} onChange={e => set("supplier_type", e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-emerald-500">
            <option value="">Select type</option>
            {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase text-[#667085]">Years in Operation</span>
          <input type="number" min="0" value={form.years_in_operation} onChange={e => set("years_in_operation", e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="E.g. 5" />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase text-[#667085]">Registration Number</span>
          <input value={form.business_registration_number} onChange={e => set("business_registration_number", e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="Company registration / trade license no." />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase text-[#667085]">GST / Tax Number</span>
          <input value={form.gst_tax_number} onChange={e => set("gst_tax_number", e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="Tax ID" />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase text-[#667085]">Target Market</span>
          <input value={form.target_market} onChange={e => set("target_market", e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="E.g. European travelers" />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase text-[#667085]">Destinations Sold</span>
          <input value={form.destinations_sold} onChange={e => set("destinations_sold", e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="E.g. UAE, India, Oman" />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase text-[#667085]">Country</span>
          <select value={form.country_id} onChange={e => setCountry(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-emerald-500">
            <option value="">Select country</option>
            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase text-[#667085]">State</span>
          <select value={selectedStateId} onChange={e => setCompanyState(e.target.value)} disabled={!form.country_id}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-emerald-500 disabled:bg-[#F7F9FC]">
            <option value="">{form.country_id ? "Select state" : "Select country first"}</option>
            {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase text-[#667085]">City</span>
          <select value={form.city_id} onChange={e => set("city_id", e.target.value)} disabled={!form.country_id}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-emerald-500 disabled:bg-[#F7F9FC]">
            <option value="">{form.country_id ? "Select city" : "Select country first"}</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>

      {state === "saved" && <p className="mt-4 text-sm font-bold text-emerald-700">Company information updated successfully.</p>}
      {state === "error" && <p className="mt-4 text-sm font-bold text-red-600">Could not save. Please check the details and try again.</p>}
    </form>
  );
}
