"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";
import { useGeoCities, useGeoCountries, useGeoStates } from "@/hooks/useGeo";

type Form = {
  agent_name: string;
  agent_type: string;
  years_in_operation: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  iata_registration_number: string;
  gst_tax_number: string;
  target_market: string;
  destinations_sold: string;
  country_id: string;
  city_id: string;
};

const AGENT_TYPES = ["travel_agent", "reseller", "corporate_agent", "affiliate_agent", "other"];


export default function AgencyDetailsTab() {
  const toast = useToast();
  const { refreshSession } = useAuthContext();
  const [form, setForm] = useState<Form>({
    agent_name: "",
    agent_type: "",
    years_in_operation: "",
    contact_name: "",
    phone: "",
    email: "",
    address: "",
    iata_registration_number: "",
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
    api.get("/agents/me").then((res) => {
      const d = res.data?.data ?? res.data ?? {};
      const contacts = Array.isArray(d.contacts) ? (d.contacts as Record<string, unknown>[]) : [];
      const primaryContact = contacts.find((item) => item.is_primary) ?? contacts[0] ?? {};
      const businessInfo = (d.business_info ?? {}) as Record<string, unknown>;
      setForm({
        agent_name: String(d.agent_name || d.name || ""),
        agent_type: String(d.agent_type || ""),
        years_in_operation: String(d.years_in_operation || 0),
        contact_name: String(primaryContact.contact_name || ""),
        phone: String(primaryContact.phone || ""),
        email: String(primaryContact.email || ""),
        address: String(primaryContact.designation || ""),
        iata_registration_number: String(businessInfo.iata_registration_number || ""),
        gst_tax_number: String(businessInfo.gst_tax_number || ""),
        target_market: String(businessInfo.target_market || ""),
        destinations_sold: String(businessInfo.destinations_sold || ""),
        country_id: String(d.country_id || ""),
        city_id: String(d.city_id || ""),
      });
    }).catch(() => {});
  }, []);

  const set = (k: keyof Form, v: string) => {
    setState("idle");
    setForm((f) => ({ ...f, [k]: v }));
  };

  const setCountry = (value: string) => {
    setSelectedStateId("");
    setForm((f) => ({ ...f, country_id: value, city_id: "" }));
    setState("idle");
  };

  const setAgentState = (value: string) => {
    setSelectedStateId(value);
    setForm((f) => ({ ...f, city_id: "" }));
    setState("idle");
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    try {
      await api.patch("/agents/me", {
        agent_name: form.agent_name,
        agent_type: form.agent_type,
        years_in_operation: parseInt(form.years_in_operation) || 0,
        country_id: parseInt(form.country_id) || null,
        city_id: parseInt(form.city_id) || null,
        contact: {
          contact_name: form.contact_name,
          phone: form.phone,
          email: form.email,
          designation: form.address,
        },
        business_info: {
          iata_registration_number: form.iata_registration_number,
          gst_tax_number: form.gst_tax_number,
          target_market: form.target_market,
          destinations_sold: form.destinations_sold,
        },
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
    <form onSubmit={save} className="rounded-xl border border-[#E7EAF0] bg-white p-6 shadow-sm">
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
          <span className="text-xs font-bold uppercase text-[#667085]">Agency / Agent Name <span className="text-red-500">*</span></span>
          <input
            required
            value={form.agent_name}
            onChange={(e) => set("agent_name", e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
            placeholder="Agency name"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase text-[#667085]">Agent Type</span>
          <select
            value={form.agent_type}
            onChange={(e) => set("agent_type", e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-500"
          >
            <option value="">Select type</option>
            {AGENT_TYPES.map((type) => <option key={type} value={type}>{type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase text-[#667085]">Years in Operation</span>
          <input
            type="number"
            min="0"
            value={form.years_in_operation}
            onChange={(e) => set("years_in_operation", e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
            placeholder="E.g. 5"
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

        <label className="block">
          <span className="text-xs font-bold uppercase text-[#667085]">Business Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
            placeholder="Email address"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase text-[#667085]">IATA Registration Number</span>
          <input
            value={form.iata_registration_number}
            onChange={(e) => set("iata_registration_number", e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
            placeholder="IATA / travel registration no."
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase text-[#667085]">GST / Tax Number</span>
          <input
            value={form.gst_tax_number}
            onChange={(e) => set("gst_tax_number", e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
            placeholder="Tax ID"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase text-[#667085]">Target Market</span>
          <input
            value={form.target_market}
            onChange={(e) => set("target_market", e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
            placeholder="E.g. Corporate travelers"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase text-[#667085]">Destinations Sold</span>
          <input
            value={form.destinations_sold}
            onChange={(e) => set("destinations_sold", e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
            placeholder="E.g. UAE, India, Oman"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase text-[#667085]">Country</span>
          <select value={form.country_id} onChange={(e) => setCountry(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-500">
            <option value="">Select country</option>
            {countries.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase text-[#667085]">State</span>
          <select value={selectedStateId} onChange={(e) => setAgentState(e.target.value)} disabled={!form.country_id}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-500 disabled:bg-[#F7F9FC]">
            <option value="">{form.country_id ? "Select state" : "Select country first"}</option>
            {states.map((state) => <option key={state.id} value={state.id}>{state.name}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase text-[#667085]">City</span>
          <select value={form.city_id} onChange={(e) => set("city_id", e.target.value)} disabled={!form.country_id}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-500 disabled:bg-[#F7F9FC]">
            <option value="">{form.country_id ? "Select city" : "Select country first"}</option>
            {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="text-xs font-bold uppercase text-[#667085]">Business Address / Notes</span>
          <input
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
            placeholder="Address or contact designation"
          />
        </label>
      </div>

      {state === "saved" && <p className="mt-4 text-sm font-bold text-emerald-700">Agency details updated successfully.</p>}
      {state === "error" && <p className="mt-4 text-sm font-bold text-red-600">Could not save details. Please try again.</p>}
    </form>
  );
}
