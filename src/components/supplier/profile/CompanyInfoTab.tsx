"use client";

import { useEffect, useState } from "react";
import { LuCircleAlert as AlertCircle, LuCircleCheckBig as CheckCircle2, LuEye as Eye, LuEyeOff as EyeOff, LuLoaderCircle as Loader2, LuRefreshCw as RefreshCw } from "react-icons/lu";
import axios from "axios";
import api from "@/lib/api/client";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";
import { useGeoCities, useGeoCountries, useGeoStates } from "@/hooks/useGeo";
import ProfileImageUpload from "@/components/ui/ProfileImageUpload";
import PhoneInput from "@/components/ui/PhoneInput";
import { combinePhone, splitPhone, validateMobile, mobileHelp, validatePassword, passwordHelp } from "@/lib/utils/validators";
import { phoneCountryCodeValues } from "@/lib/constants/locationOptions";

function apiErr(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data;
    return d?.message || d?.detail || fallback;
  }
  return fallback;
}

type CompanyForm = {
  profile_image: string;
  supplier_name: string;
  email: string;
  phone: string;
  address: string;
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

  // company form
  const [form, setForm] = useState<CompanyForm>({
    profile_image: "",
    supplier_name: "",
    email: "",
    phone: "",
    address: "",
    supplier_type: "",
    years_in_operation: "",
    business_registration_number: "",
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
  const [loadError, setLoadError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const { countries } = useGeoCountries();
  const { states } = useGeoStates(form.country_id ? Number(form.country_id) : null);
  const { cities } = useGeoCities(
    selectedStateId ? Number(selectedStateId) : null,
    form.country_id ? Number(form.country_id) : null
  );

  useEffect(() => {
    setLoadError("");
    Promise.all([api.get("/profile/me"), api.get("/suppliers/me")])
      .then(([profileRes, supplierRes]) => {
        const p = profileRes.data?.data ?? profileRes.data ?? {};
        const s = supplierRes.data?.data ?? supplierRes.data ?? {};
        const { countryCode, number } = splitPhone(p.phone || "", phoneCountryCodeValues);
        setPhoneCountryCode(countryCode);
        setPhoneNumber(number);
        setForm({
          profile_image: p.profile_image || "",
          supplier_name: s.supplier_name || s.name || "",
          email: p.email || "",
          phone: p.phone || "",
          address: p.address || "",
          supplier_type: s.supplier_type || "",
          years_in_operation: String(s.years_in_operation || ""),
          business_registration_number: s.business_info?.business_registration_number || "",
          gst_tax_number: s.business_info?.gst_tax_number || "",
          target_market: s.business_info?.target_market || "",
          destinations_sold: s.business_info?.destinations_sold || "",
          country_id: String(s.country_id || ""),
          city_id: String(s.city_id || ""),
        });
      })
      .catch(() => setLoadError("Company details could not be loaded. Please retry before editing."));
  }, [retryKey]);

  const set = (k: keyof CompanyForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function saveCompany(e: React.FormEvent) {
    e.preventDefault();
    const phone = combinePhone(phoneCountryCode, phoneNumber);
    if (!validateMobile(phone, true)) {
      toast.error(mobileHelp);
      return;
    }
    setSaving(true);
    try {
      await Promise.all([
        api.put("/profile/me", {
          name: form.supplier_name,
          phone,
          profile_image: form.profile_image,
          address: form.address,
        }),
        api.patch("/suppliers/me", {
          supplier_name: form.supplier_name,
          supplier_type: form.supplier_type || undefined,
          years_in_operation: parseInt(form.years_in_operation) || 0,
          country_id: parseInt(form.country_id) || null,
          city_id: parseInt(form.city_id) || null,
          business_info: {
            business_registration_number: form.business_registration_number,
            gst_tax_number: form.gst_tax_number,
            target_market: form.target_market,
            destinations_sold: form.destinations_sold,
          },
        }),
      ]);
      await refreshSession();
      toast.success("Company details updated successfully.");
    } catch (err) {
      toast.error(apiErr(err, "Could not save company details."));
    } finally {
      setSaving(false);
    }
  }

  // password form
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
    if (!validatePassword(pwForm.new_password)) {
      toast.error(passwordHelp);
      return;
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      toast.error("Confirm password must match new password.");
      return;
    }
    setSavingPw(true);
    try {
      await api.put("/profile/password", {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
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
      {loadError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 lg:col-span-2">
          <span className="flex items-center gap-2"><AlertCircle size={16} />{loadError}</span>
          <button type="button" onClick={() => setRetryKey((key) => key + 1)} className="inline-flex items-center gap-1.5 font-bold underline"><RefreshCw size={14} />Retry</button>
        </div>
      )}
      {/* company details */}
      <form onSubmit={saveCompany} className="rounded-2xl border border-dash-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-dash-text">Company Details</h3>
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors">
            {saving ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
            Save Changes
          </button>
        </div>

        <div className="space-y-4">
          {/* Logo */}
          <div>
            <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Company Logo</span>
            <ProfileImageUpload
              value={form.profile_image}
              onChange={v => set("profile_image", v)}
              label="Upload Logo"
            />
          </div>

          {/* Company Name */}
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Company Name <span className="text-red-500">*</span></span>
            <input required value={form.supplier_name} onChange={e => set("supplier_name", e.target.value)}
              placeholder="Your company name"
              className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all" />
          </label>

          {/* Email */}
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Company Email</span>
            <input type="email" value={form.email} readOnly
              className="w-full cursor-not-allowed rounded-xl border border-dash-border bg-[#F9FAFB] px-4 py-2.5 text-sm text-dash-muted outline-none" />
            <p className="mt-1 text-xs text-dash-subtle">Email cannot be changed here. Contact support to update.</p>
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
            <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Company Address <span className="text-red-500">*</span></span>
            <input required value={form.address} onChange={e => set("address", e.target.value)}
              placeholder="Full business address"
              className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all" />
          </label>

          {/* Business Type */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Business Type</span>
              <select value={form.supplier_type} onChange={e => set("supplier_type", e.target.value)}
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-emerald-500">
                <option value="">Select type</option>
                {BUSINESS_TYPES.map(t => (
                  <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Years in Operation</span>
              <input type="number" min="0" value={form.years_in_operation} onChange={e => set("years_in_operation", e.target.value)}
                placeholder="e.g. 5"
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Registration Number</span>
              <input value={form.business_registration_number} onChange={e => set("business_registration_number", e.target.value)}
                placeholder="Trade licence / company reg. no."
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">GST / Tax Number</span>
              <input value={form.gst_tax_number} onChange={e => set("gst_tax_number", e.target.value)}
                placeholder="Tax ID"
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
            </label>

            {/* Country */}
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Country</span>
              <select value={form.country_id}
                onChange={e => { setSelectedStateId(""); setForm(f => ({ ...f, country_id: e.target.value, city_id: "" })); }}
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-emerald-500">
                <option value="">Select country</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>

            {/* State */}
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">State</span>
              <select value={selectedStateId} disabled={!form.country_id}
                onChange={e => { setSelectedStateId(e.target.value); setForm(f => ({ ...f, city_id: "" })); }}
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-emerald-500 disabled:bg-dash-bg">
                <option value="">{form.country_id ? "Select state" : "Select country first"}</option>
                {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>

            {/* City */}
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">City</span>
              <select value={form.city_id} disabled={!form.country_id}
                onChange={e => set("city_id", e.target.value)}
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-emerald-500 disabled:bg-dash-bg">
                <option value="">{form.country_id ? "Select city" : "Select country first"}</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Target Market</span>
              <input value={form.target_market} onChange={e => set("target_market", e.target.value)}
                placeholder="e.g. European travelers"
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Destinations Sold</span>
              <input value={form.destinations_sold} onChange={e => set("destinations_sold", e.target.value)}
                placeholder="e.g. UAE, India, Oman"
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
            </label>
          </div>
        </div>
      </form>

      {/* security & password */}
      <form onSubmit={savePassword} className="rounded-2xl border border-dash-border bg-white p-6 shadow-sm self-start">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-dash-text">Security & Password</h3>
          <button type="submit" disabled={savingPw}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors">
            {savingPw ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
            Update
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Current Password</span>
            <div className="relative">
              <input type={showCurrent ? "text" : "password"} required value={pwForm.current_password}
                onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))}
                placeholder="Current password"
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 pr-11 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all" />
              <button type="button" onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dash-muted hover:text-emerald-600"
                aria-label={showCurrent ? "Hide password" : "Show password"}>
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">New Password</span>
            <div className="relative">
              <input type={showNew ? "text" : "password"} required minLength={8} value={pwForm.new_password}
                onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                placeholder="New password"
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 pr-11 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all" />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dash-muted hover:text-emerald-600"
                aria-label={showNew ? "Hide password" : "Show password"}>
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-dash-subtle">{passwordHelp}</p>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Confirm New Password</span>
            <input type={showNew ? "text" : "password"} required minLength={8} value={pwForm.confirm_password}
              onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))}
              placeholder="Confirm new password"
              className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all" />
          </label>
        </div>
      </form>
    </div>
  );
}
