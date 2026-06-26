"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import axios from "axios";
import api from "@/lib/api";
import { hashPassword } from "@/lib/crypto";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";
import { useGeoCities, useGeoCountries, useGeoStates } from "@/hooks/useGeo";
import ProfileImageUpload from "@/components/ui/ProfileImageUpload";
import PhoneInput from "@/components/ui/PhoneInput";
import {
  combinePhone, mobileHelp, passwordHelp, splitPhone, validateMobile, validatePassword,
} from "@/lib/validators";
import { phoneCountryCodeValues } from "@/lib/location-options";

function apiErr(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data;
    return d?.message || d?.detail || fallback;
  }
  return fallback;
}

type AgencyForm = {
  profile_image: string;
  agent_name: string;
  email: string;
  address: string;
  agent_type: string;
  years_in_operation: string;
  iata_registration_number: string;
  gst_tax_number: string;
  target_market: string;
  destinations_sold: string;
  country_id: string;
  city_id: string;
};

const AGENT_TYPES = [
  "travel_agency", "tour_operator", "corporate_travel", "online_travel_agency", "dmc", "other",
];

export default function AgencyDetailsTab() {
  const toast = useToast();
  const { refreshSession } = useAuthContext();

  // ── Agency form ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState<AgencyForm>({
    profile_image: "",
    agent_name: "",
    email: "",
    address: "",
    agent_type: "",
    years_in_operation: "",
    iata_registration_number: "",
    gst_tax_number: "",
    target_market: "",
    destinations_sold: "",
    country_id: "",
    city_id: "",
  });
  const [phoneCountryCode, setPhoneCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedStateId, setSelectedStateId] = useState("");
  const [saving, setSaving] = useState(false);

  const { countries } = useGeoCountries();
  const { states } = useGeoStates(form.country_id ? Number(form.country_id) : null);
  const { cities } = useGeoCities(
    selectedStateId ? Number(selectedStateId) : null,
    form.country_id ? Number(form.country_id) : null,
  );

  useEffect(() => {
    Promise.all([api.get("/profile/me"), api.get("/agents/me")])
      .then(([profileRes, agentRes]) => {
        const p = profileRes.data?.data ?? profileRes.data ?? {};
        const a = agentRes.data?.data ?? agentRes.data ?? {};
        const { countryCode, number } = splitPhone(p.phone || "", phoneCountryCodeValues);
        setPhoneCountryCode(countryCode);
        setPhoneNumber(number);
        const bi = (a.business_info ?? {}) as Record<string, unknown>;
        setForm({
          profile_image: p.profile_image || "",
          agent_name: String(a.agent_name || a.name || ""),
          email: String(p.email || ""),
          address: String(p.address || ""),
          agent_type: String(a.agent_type || ""),
          years_in_operation: String(a.years_in_operation || ""),
          iata_registration_number: String(bi.iata_registration_number || ""),
          gst_tax_number: String(bi.gst_tax_number || ""),
          target_market: String(bi.target_market || ""),
          destinations_sold: String(bi.destinations_sold || ""),
          country_id: String(a.country_id || ""),
          city_id: String(a.city_id || ""),
        });
      })
      .catch(() => {});
  }, []);

  const set = (k: keyof AgencyForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function saveAgency(e: React.FormEvent) {
    e.preventDefault();
    const phone = combinePhone(phoneCountryCode, phoneNumber);
    if (!validateMobile(phone, true)) { toast.error(mobileHelp); return; }
    setSaving(true);
    try {
      await Promise.all([
        api.put("/profile/me", {
          name: form.agent_name,
          phone,
          profile_image: form.profile_image,
          address: form.address,
        }),
        api.patch("/agents/me", {
          agent_name: form.agent_name,
          agent_type: form.agent_type || undefined,
          years_in_operation: parseInt(form.years_in_operation) || 0,
          country_id: parseInt(form.country_id) || null,
          city_id: parseInt(form.city_id) || null,
          business_info: {
            iata_registration_number: form.iata_registration_number,
            gst_tax_number: form.gst_tax_number,
            target_market: form.target_market,
            destinations_sold: form.destinations_sold,
          },
        }),
      ]);
      await refreshSession();
      toast.success("Agency details updated successfully.");
    } catch (err) {
      toast.error(apiErr(err, "Could not save agency details."));
    } finally {
      setSaving(false);
    }
  }

  // ── Password form ───────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.current_password === pwForm.new_password) {
      toast.error("New password must be different from current password.");
      return;
    }
    if (!validatePassword(pwForm.new_password)) { toast.error(passwordHelp); return; }
    if (pwForm.new_password !== pwForm.confirm_password) {
      toast.error("Confirm password must match new password.");
      return;
    }
    setSavingPw(true);
    try {
      await api.put("/profile/password", {
        current_password: await hashPassword(pwForm.current_password),
        new_password: await hashPassword(pwForm.new_password),
      });
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
      toast.success("Password updated successfully.");
    } catch (err) {
      toast.error(apiErr(err, "Could not update password."));
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* ── Agency Details ────────────────────────────────────────────────────── */}
      <form onSubmit={saveAgency} className="rounded-2xl border border-[#E7EAF0] bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#121826]">Agency Details</h3>
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60 transition-colors">
            {saving ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
            Save Changes
          </button>
        </div>

        <div className="space-y-4">
          {/* Logo */}
          <div>
            <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Agency Logo</span>
            <ProfileImageUpload
              value={form.profile_image}
              onChange={v => set("profile_image", v)}
              label="Upload Logo"
            />
          </div>

          {/* Agency Name */}
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Agency Name <span className="text-red-500">*</span></span>
            <input required value={form.agent_name} onChange={e => set("agent_name", e.target.value)}
              placeholder="Your agency name"
              className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all" />
          </label>

          {/* Email (read-only) */}
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Agency Email</span>
            <input type="email" value={form.email} readOnly
              className="w-full cursor-not-allowed rounded-xl border border-[#E7EAF0] bg-[#F9FAFB] px-4 py-2.5 text-sm text-[#667085] outline-none" />
            <p className="mt-1 text-xs text-[#98A2B3]">Email cannot be changed here. Contact support to update.</p>
          </label>

          {/* Mobile */}
          <PhoneInput
            countryCode={phoneCountryCode}
            number={phoneNumber}
            onCountryCodeChange={setPhoneCountryCode}
            onNumberChange={setPhoneNumber}
            required
            helpText={mobileHelp}
          />

          {/* Address */}
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Agency Address <span className="text-red-500">*</span></span>
            <input required value={form.address} onChange={e => set("address", e.target.value)}
              placeholder="Full business address"
              className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all" />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Agency Type */}
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Agency Type</span>
              <select value={form.agent_type} onChange={e => set("agent_type", e.target.value)}
                className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-400">
                <option value="">Select type</option>
                {AGENT_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Years in Operation</span>
              <input type="number" min="0" value={form.years_in_operation} onChange={e => set("years_in_operation", e.target.value)}
                placeholder="e.g. 5"
                className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            </label>

            {/* IATA */}
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">IATA Number</span>
              <input value={form.iata_registration_number} onChange={e => set("iata_registration_number", e.target.value)}
                placeholder="IATA registration number"
                className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">GST / Tax Number</span>
              <input value={form.gst_tax_number} onChange={e => set("gst_tax_number", e.target.value)}
                placeholder="Tax ID"
                className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            </label>

            {/* Country */}
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Country</span>
              <select value={form.country_id}
                onChange={e => { setSelectedStateId(""); setForm(f => ({ ...f, country_id: e.target.value, city_id: "" })); }}
                className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-400">
                <option value="">Select country</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>

            {/* State */}
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">State</span>
              <select value={selectedStateId} disabled={!form.country_id}
                onChange={e => { setSelectedStateId(e.target.value); setForm(f => ({ ...f, city_id: "" })); }}
                className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-400 disabled:bg-[#F7F9FC]">
                <option value="">{form.country_id ? "Select state" : "Select country first"}</option>
                {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">City</span>
              <select value={form.city_id} disabled={!form.country_id}
                onChange={e => set("city_id", e.target.value)}
                className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-400 disabled:bg-[#F7F9FC]">
                <option value="">{form.country_id ? "Select city" : "Select country first"}</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Target Market</span>
              <input value={form.target_market} onChange={e => set("target_market", e.target.value)}
                placeholder="e.g. Corporate travelers"
                className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Destinations Sold</span>
              <input value={form.destinations_sold} onChange={e => set("destinations_sold", e.target.value)}
                placeholder="e.g. UAE, India, Europe"
                className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            </label>
          </div>
        </div>
      </form>

      {/* ── Security & Password ──────────────────────────────────────────────── */}
      <form onSubmit={savePassword} className="rounded-2xl border border-[#E7EAF0] bg-white p-6 shadow-sm self-start">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#121826]">Security & Password</h3>
          <button type="submit" disabled={savingPw}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60 transition-colors">
            {savingPw ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
            Update
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Current Password</span>
            <div className="relative">
              <input type={showCurrent ? "text" : "password"} required value={pwForm.current_password}
                onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))}
                placeholder="Current password"
                className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 pr-11 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all" />
              <button type="button" onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] hover:text-orange-500"
                aria-label={showCurrent ? "Hide password" : "Show password"}>
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">New Password</span>
            <div className="relative">
              <input type={showNew ? "text" : "password"} required minLength={8} value={pwForm.new_password}
                onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                placeholder="New password"
                className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 pr-11 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all" />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] hover:text-orange-500"
                aria-label={showNew ? "Hide password" : "Show password"}>
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-[#98A2B3]">{passwordHelp}</p>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Confirm New Password</span>
            <input type={showNew ? "text" : "password"} required minLength={8} value={pwForm.confirm_password}
              onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))}
              placeholder="Confirm new password"
              className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all" />
          </label>
        </div>
      </form>
    </div>
  );
}
