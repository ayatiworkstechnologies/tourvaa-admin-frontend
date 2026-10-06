"use client";

import { useEffect, useState } from "react";
import { LuCircleAlert as AlertCircle, LuCircleCheckBig as CheckCircle2, LuEye as Eye, LuEyeOff as EyeOff, LuLoaderCircle as Loader2, LuRefreshCw as RefreshCw } from "react-icons/lu";
import axios from "axios";
import api from "@/lib/api/client";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";
import { useGeoCities, useGeoCountries, useGeoStates } from "@/hooks/useGeo";
import ProfileImageUpload from "@/components/ui/ProfileImageUpload";
import CountryPhoneInput from "@/components/ui/CountryPhoneInput";
import {
  combinePhone, mobileHelp, passwordHelp, validateMobile, validatePassword,
} from "@/lib/utils/validators";
import { dialCodeForIso, isoForDialCode } from "@/lib/utils/phoneCountries";
import type { CountryCode } from "libphonenumber-js/min";

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
  trading_name: string;
  business_email: string;
  website_url: string;
  business_registration_number: string;
  years_in_operation: string;
  iata_registration_number: string;
  gst_tax_number: string;
  target_market: string;
  destinations_sold: string;
  country_id: string;
  city_id: string;
  primary_contact_name: string;
  primary_contact_first_name: string;
  primary_contact_last_name: string;
  primary_contact_designation: string;
  primary_contact_email: string;
  primary_contact_phone: string;
  primary_contact_method: string;
  preferred_payment_method: string;
  invoice_contact_name: string;
  invoice_email: string;
  invoice_phone: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  bank_branch: string;
  swift_code: string;
  iban: string;
  billing_address: string;
};

const AGENT_TYPES = [
  "travel_agency", "online_travel_agency", "tour_operator", "corporate_travel", "dmc", "affiliate", "other",
];

export default function AgencyDetailsTab() {
  const toast = useToast();
  const { refreshSession, logout } = useAuthContext();

  // agency form
  const [form, setForm] = useState<AgencyForm>({
    profile_image: "",
    agent_name: "",
    email: "",
    address: "",
    agent_type: "",
    trading_name: "", business_email: "", website_url: "", business_registration_number: "",
    years_in_operation: "",
    iata_registration_number: "",
    gst_tax_number: "",
    target_market: "",
    destinations_sold: "",
    country_id: "",
    city_id: "",
    primary_contact_name: "", primary_contact_first_name: "", primary_contact_last_name: "", primary_contact_designation: "", primary_contact_email: "", primary_contact_phone: "", primary_contact_method: "",
    preferred_payment_method: "", invoice_contact_name: "", invoice_email: "", invoice_phone: "", account_name: "", account_number: "", bank_name: "", bank_branch: "", swift_code: "", iban: "", billing_address: "",
  });
  const [phoneCountryIso, setPhoneCountryIso] = useState<CountryCode>("IN");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedStateId, setSelectedStateId] = useState("");
  const [saving, setSaving] = useState(false);
  const [bankLocked, setBankLocked] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const { countries } = useGeoCountries();
  const { states } = useGeoStates(form.country_id ? Number(form.country_id) : null);
  const { cities } = useGeoCities(
    selectedStateId ? Number(selectedStateId) : null,
    form.country_id ? Number(form.country_id) : null,
  );

  // Agents only persist country_id/city_id; the state select is derived
  // from the loaded city's state_id since there is no stored state field.
  useEffect(() => {
    if (selectedStateId || !form.city_id) return;
    const match = cities.find((c) => String(c.id) === form.city_id);
    if (match?.state_id) setSelectedStateId(String(match.state_id));
  }, [cities, form.city_id, selectedStateId]);

  useEffect(() => {
    setLoadError("");
    Promise.all([api.get("/profile/me"), api.get("/agents/me")])
      .then(([profileRes, agentRes]) => {
        const p = profileRes.data?.data ?? profileRes.data ?? {};
        const a = agentRes.data?.data ?? agentRes.data ?? {};
        if (p.phone) {
          const iso = isoForDialCode(p.phone);
          const dial = dialCodeForIso(iso);
          setPhoneCountryIso(iso);
          setPhoneNumber(p.phone.startsWith(dial) ? p.phone.slice(dial.length) : p.phone.replace(/^\+/, ""));
        }
        const bi = (a.business_info ?? {}) as Record<string, unknown>;
        const primary = Array.isArray(a.contacts) ? a.contacts.find((contact: { is_primary?: boolean }) => contact.is_primary) ?? a.contacts[0] : {};
        const invoice = (a.invoicing ?? {}) as Record<string, unknown>;
        setBankLocked(Boolean(invoice.bank_details_locked));
        setForm({
          profile_image: p.profile_image || "",
          agent_name: String(a.agent_name || a.name || ""),
          email: String(p.email || ""),
          address: String(p.address || ""),
          agent_type: String(a.agent_type || ""),
          trading_name: String(bi.trading_name || ""), business_email: String(bi.business_email || ""), website_url: String(bi.website_url || ""), business_registration_number: String(bi.business_registration_number || ""),
          years_in_operation: String(a.years_in_operation || ""),
          iata_registration_number: String(bi.iata_registration_number || ""),
          gst_tax_number: String(bi.gst_tax_number || ""),
          target_market: String(bi.target_market || ""),
          destinations_sold: String(bi.destinations_sold || ""),
          country_id: String(a.country_id || ""),
          city_id: String(a.city_id || ""),
          primary_contact_name: String(primary?.contact_name || ""), primary_contact_first_name: String(primary?.first_name || ""), primary_contact_last_name: String(primary?.last_name || ""), primary_contact_designation: String(primary?.designation || ""), primary_contact_email: String(primary?.email || ""), primary_contact_phone: String(primary?.phone || ""), primary_contact_method: String(primary?.preferred_contact_method || ""),
          preferred_payment_method: String(invoice.preferred_payment_method || ""), invoice_contact_name: String(invoice.contact_name || ""), invoice_email: String(invoice.email || ""), invoice_phone: String(invoice.phone || ""), account_name: String(invoice.account_name || ""), account_number: String(invoice.account_number || ""), bank_name: String(invoice.bank_name || ""), bank_branch: String(invoice.bank_branch || ""), swift_code: String(invoice.swift_code || ""), iban: String(invoice.iban || ""), billing_address: String(invoice.billing_address || ""),
        });
      })
      .catch(() => setLoadError("Agency details could not be loaded. Please retry before editing."));
  }, [retryKey]);

  const set = (k: keyof AgencyForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function saveAgency(e: React.FormEvent) {
    e.preventDefault();
    const phone = combinePhone(dialCodeForIso(phoneCountryIso), phoneNumber);
    if (!validateMobile(phone, true)) { toast.error(mobileHelp); return; }
    if (!form.agent_type || !form.primary_contact_first_name || !form.primary_contact_last_name || !form.primary_contact_designation || !form.primary_contact_email || !form.primary_contact_phone || !form.primary_contact_method) {
      toast.error("Complete the required business type and primary contact details.");
      return;
    }
    if (!form.preferred_payment_method || !form.invoice_contact_name || !form.invoice_email || !form.invoice_phone) {
      toast.error("Complete the required invoicing contact and payment method details.");
      return;
    }
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
            trading_name: form.trading_name, business_email: form.business_email, website_url: form.website_url, business_registration_number: form.business_registration_number,
            iata_registration_number: form.iata_registration_number,
            gst_tax_number: form.gst_tax_number,
            target_market: form.target_market,
            destinations_sold: form.destinations_sold,
          },
          contact: { contact_name: form.primary_contact_name, first_name: form.primary_contact_first_name, last_name: form.primary_contact_last_name, designation: form.primary_contact_designation, email: form.primary_contact_email, phone: form.primary_contact_phone, preferred_contact_method: form.primary_contact_method },
          invoicing: {
            contact_name: form.invoice_contact_name, email: form.invoice_email, phone: form.invoice_phone, billing_address: form.billing_address,
            ...(bankLocked ? {} : { preferred_payment_method: form.preferred_payment_method, account_name: form.account_name, account_number: form.account_number, bank_name: form.bank_name, bank_branch: form.bank_branch, swift_code: form.swift_code, iban: form.iban }),
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
    if (!validatePassword(pwForm.new_password)) { toast.error(passwordHelp); return; }
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
      toast.success("Password updated. All devices have been signed out.");
      await logout("/login");
    } catch (err) {
      toast.error(apiErr(err, "Could not update password."));
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {loadError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 lg:col-span-2">
          <span className="flex items-center gap-2"><AlertCircle size={16} />{loadError}</span>
          <button type="button" onClick={() => setRetryKey((value) => value + 1)} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs shadow-sm"><RefreshCw size={13} />Retry</button>
        </div>
      )}
      {/* agency details */}
      <form onSubmit={saveAgency} className="rounded-2xl border border-dash-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-dash-text">Agency Details</h3>
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60 transition-colors">
            {saving ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
            Save Changes
          </button>
        </div>

        <div className="space-y-4">
          {/* Logo */}
          <div>
            <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Agency Logo</span>
            <ProfileImageUpload
              value={form.profile_image}
              onChange={v => set("profile_image", v)}
              label="Upload Logo"
            />
          </div>

          {/* Agency Name */}
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Agency Name <span className="text-red-500">*</span></span>
            <input required value={form.agent_name} onChange={e => set("agent_name", e.target.value)}
              placeholder="e.g. Horizon Travel Ltd"
              className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-2 focus:ring-blue-100 transition-all" />
          </label>

          {/* Email (read-only) */}
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Agency Email</span>
            <input type="email" value={form.email} readOnly
              className="w-full cursor-not-allowed rounded-xl border border-dash-border bg-[#F9FAFB] px-4 py-2.5 text-sm text-dash-muted outline-none" />
            <p className="mt-1 text-xs text-dash-subtle">Email cannot be changed here. Contact support to update.</p>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Trading / Business Name</span><input value={form.trading_name} onChange={e => set("trading_name", e.target.value)} className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm" /></label>
            <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Business Email</span><input type="email" value={form.business_email} onChange={e => set("business_email", e.target.value)} className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm" /></label>
            <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Website <span className="text-dash-subtle">(optional)</span></span><input type="url" value={form.website_url} onChange={e => set("website_url", e.target.value)} placeholder="https://example.com" className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm" /></label>
          </div>

          {/* Mobile */}
          <CountryPhoneInput
            countryIso={phoneCountryIso}
            number={phoneNumber}
            onCountryChange={setPhoneCountryIso}
            onNumberChange={setPhoneNumber}
            required
            helpText={mobileHelp}
          />

          {/* Address */}
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Agency Address <span className="text-red-500">*</span></span>
            <input required value={form.address} onChange={e => set("address", e.target.value)}
              placeholder="e.g. Suite 400, 100 Bay Street, Toronto, ON"
              className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-2 focus:ring-blue-100 transition-all" />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Agency Type */}
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Business Type <span className="text-red-500">*</span></span>
              <select required value={form.agent_type} onChange={e => set("agent_type", e.target.value)}
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand">
                <option value="">Select type</option>
                {AGENT_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Years in Operation</span>
              <input type="number" min="0" value={form.years_in_operation} onChange={e => set("years_in_operation", e.target.value)}
                placeholder="e.g. 5"
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-2 focus:ring-blue-100" />
            </label>

            {/* IATA */}
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">IATA Number</span>
              <input value={form.iata_registration_number} onChange={e => set("iata_registration_number", e.target.value)}
                placeholder="e.g. 12345678"
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-2 focus:ring-blue-100" />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">GST / Tax Number</span>
              <input value={form.gst_tax_number} onChange={e => set("gst_tax_number", e.target.value)}
                placeholder="e.g. TAX-8921-9481"
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-2 focus:ring-blue-100" />
            </label>

            {/* Country */}
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Country</span>
              <select value={form.country_id}
                onChange={e => { setSelectedStateId(""); setForm(f => ({ ...f, country_id: e.target.value, city_id: "" })); }}
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand">
                <option value="">Select country</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>

            {/* State */}
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">State</span>
              <select value={selectedStateId} disabled={!form.country_id}
                onChange={e => { setSelectedStateId(e.target.value); setForm(f => ({ ...f, city_id: "" })); }}
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand disabled:bg-dash-bg">
                <option value="">{form.country_id ? "Select state" : "Select country first"}</option>
                {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">City</span>
              <select value={form.city_id} disabled={!form.country_id}
                onChange={e => set("city_id", e.target.value)}
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand disabled:bg-dash-bg">
                <option value="">{form.country_id ? "Select city" : "Select country first"}</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Target Market</span>
              <input value={form.target_market} onChange={e => set("target_market", e.target.value)}
                placeholder="e.g. Corporate travelers"
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-2 focus:ring-blue-100" />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Destinations Sold</span>
              <input value={form.destinations_sold} onChange={e => set("destinations_sold", e.target.value)}
                placeholder="e.g. UAE, India, Europe"
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-2 focus:ring-blue-100" />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Business Registration Number</span>
              <input value={form.business_registration_number} onChange={e => set("business_registration_number", e.target.value)} className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm" />
            </label>
          </div>

          <div className="mt-6 border-t border-dash-border pt-5">
            <h4 className="text-sm font-black text-dash-text">Primary Contact</h4>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">First Name <span className="text-red-500">*</span></span><input required value={form.primary_contact_first_name} onChange={e => set("primary_contact_first_name", e.target.value)} className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm" /></label>
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Last Name <span className="text-red-500">*</span></span><input required value={form.primary_contact_last_name} onChange={e => set("primary_contact_last_name", e.target.value)} className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm" /></label>
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Job Title / Position <span className="text-red-500">*</span></span><input required value={form.primary_contact_designation} onChange={e => set("primary_contact_designation", e.target.value)} className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm" /></label>
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Email Address <span className="text-red-500">*</span></span><input required type="email" value={form.primary_contact_email} onChange={e => set("primary_contact_email", e.target.value)} className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm" /></label>
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Phone / Mobile <span className="text-red-500">*</span></span><input required value={form.primary_contact_phone} onChange={e => set("primary_contact_phone", e.target.value)} className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm" /></label>
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Preferred Contact Method <span className="text-red-500">*</span></span><select required value={form.primary_contact_method} onChange={e => set("primary_contact_method", e.target.value)} className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm"><option value="">Select method</option><option value="email">Email</option><option value="phone">Phone</option><option value="whatsapp">WhatsApp</option></select></label>
            </div>
          </div>

          <div className="mt-6 border-t border-dash-border pt-5">
            <h4 className="text-sm font-black text-dash-text">Bank, Invoicing & Billing Details</h4>
            <p className="mt-1 text-xs text-dash-muted">All invoices will be emailed to the invoicing contact below.</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Preferred Payment Method</span><select disabled={bankLocked} value={form.preferred_payment_method} onChange={e => set("preferred_payment_method", e.target.value)} className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm"><option value="">Select method</option><option value="bank_transfer">Bank Transfer</option><option value="paypal">PayPal</option></select></label>
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Invoice Contact Name</span><input value={form.invoice_contact_name} onChange={e => set("invoice_contact_name", e.target.value)} className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm" /></label>
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Invoice Email</span><input type="email" value={form.invoice_email} onChange={e => set("invoice_email", e.target.value)} className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm" /></label>
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Invoice Phone</span><input value={form.invoice_phone} onChange={e => set("invoice_phone", e.target.value)} className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm" /></label>
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Account Name</span><input disabled={bankLocked} value={form.account_name} onChange={e => set("account_name", e.target.value)} className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm" /></label>
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Account Number / IBAN</span><input disabled={bankLocked} value={form.iban || form.account_number} onChange={e => set("iban", e.target.value)} className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm" /></label>
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Bank Name</span><input disabled={bankLocked} value={form.bank_name} onChange={e => set("bank_name", e.target.value)} className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm" /></label>
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Bank Branch / SWIFT / BIC</span><input disabled={bankLocked} value={form.swift_code || form.bank_branch} onChange={e => set("swift_code", e.target.value)} className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm" /></label>
              <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Billing / Invoice Address</span><input value={form.billing_address} onChange={e => set("billing_address", e.target.value)} className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm" /></label>
            </div>
          </div>
        </div>
      </form>

      {/* security & password */}
      <form onSubmit={savePassword} className="rounded-2xl border border-dash-border bg-white p-6 shadow-sm self-start">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-dash-text">Security & Password</h3>
          <button type="submit" disabled={savingPw}
            className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60 transition-colors">
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
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 pr-11 text-sm outline-none focus:border-dash-brand focus:ring-2 focus:ring-blue-100 transition-all" />
              <button type="button" onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dash-muted hover:text-dash-brand"
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
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 pr-11 text-sm outline-none focus:border-dash-brand focus:ring-2 focus:ring-blue-100 transition-all" />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dash-muted hover:text-dash-brand"
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
              className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-2 focus:ring-blue-100 transition-all" />
          </label>
        </div>
      </form>
    </div>
  );
}
