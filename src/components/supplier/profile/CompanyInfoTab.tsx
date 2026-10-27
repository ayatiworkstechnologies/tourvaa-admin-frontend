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
import SearchableSelect from "@/components/ui/SearchableSelect";
import CurrencySelect from "@/components/ui/CurrencySelect";
import { combinePhone, validateMobile, mobileHelp, validatePassword, passwordHelp } from "@/lib/utils/validators";
import { dialCodeForIso, isoForCountryCode, isoForDialCode } from "@/lib/utils/phoneCountries";
import type { CountryCode } from "libphonenumber-js/min";

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
  trading_name: string;
  business_email: string;
  website_url: string;
  contact_name: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_designation: string;
  contact_email: string;
  contact_phone: string;
  contact_method: string;
  years_in_operation: string;
  business_registration_number: string;
  gst_tax_number: string;
  target_market: string;
  destinations_sold: string;
  country_id: string;
  city_id: string;
  currency: string;
};

const BUSINESS_TYPES = [
  { value: "tour_operator", label: "Tour Operator" },
  { value: "transport_tour_operator", label: "Transport Tour Operator" },
  { value: "destination_management_company", label: "Destination Management Company (DMC)" },
  { value: "tour_provider", label: "Tour Provider" },
  { value: "activity_provider", label: "Activity Provider" },
  { value: "attraction_ticket_provider", label: "Attraction / Ticket Provider" },
  { value: "accommodation_provider", label: "Accommodation Provider" },
  { value: "transport_provider", label: "Transport Provider" },
  { value: "guide_service", label: "Guide Service" },
  { value: "equipment_rental", label: "Equipment Rental" },
  { value: "other", label: "Other" },
] as const;

export default function CompanyInfoTab({ onSaved }: { onSaved?: () => void }) {
  const toast = useToast();
  const { refreshSession, logout } = useAuthContext();

  // company form
  const [form, setForm] = useState<CompanyForm>({
    profile_image: "",
    supplier_name: "",
    email: "",
    phone: "",
    address: "",
    supplier_type: "",
    trading_name: "", business_email: "", website_url: "",
    contact_name: "", contact_first_name: "", contact_last_name: "", contact_designation: "",
    contact_email: "",
    contact_phone: "", contact_method: "",
    years_in_operation: "",
    business_registration_number: "",
    gst_tax_number: "",
    target_market: "",
    destinations_sold: "",
    country_id: "",
    city_id: "",
    currency: "",
  });
  const [phoneCountryIso, setPhoneCountryIso] = useState<CountryCode>("IN");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactPhoneCountryIso, setContactPhoneCountryIso] = useState<CountryCode>("IN");
  const [contactPhoneNumber, setContactPhoneNumber] = useState("");
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

  // Suppliers only persist country_id/city_id; the state select is derived
  // from the loaded city's state_id since there is no stored state field.
  useEffect(() => {
    if (selectedStateId || !form.city_id) return;
    const match = cities.find((c) => String(c.id) === form.city_id);
    if (match?.state_id) setSelectedStateId(String(match.state_id));
  }, [cities, form.city_id, selectedStateId]);

  useEffect(() => {
    setLoadError("");
    Promise.all([api.get("/profile/me"), api.get("/suppliers/me")])
      .then(([profileRes, supplierRes]) => {
        const p = profileRes.data?.data ?? profileRes.data ?? {};
        const s = supplierRes.data?.data ?? supplierRes.data ?? {};
        if (p.phone) {
          const iso = isoForDialCode(p.phone);
          const dial = dialCodeForIso(iso);
          setPhoneCountryIso(iso);
          setPhoneNumber(p.phone.startsWith(dial) ? p.phone.slice(dial.length) : p.phone.replace(/^\+/, ""));
        }
        const primaryContact = s.contacts?.find?.((contact: { is_primary?: boolean }) => contact.is_primary) ?? s.contacts?.[0] ?? {};
        if (primaryContact.phone) {
          const iso = isoForDialCode(primaryContact.phone);
          const dial = dialCodeForIso(iso);
          setContactPhoneCountryIso(iso);
          setContactPhoneNumber(primaryContact.phone.startsWith(dial) ? primaryContact.phone.slice(dial.length) : primaryContact.phone.replace(/^\+/, ""));
        }
        setForm({
          profile_image: p.profile_image || "",
          supplier_name: s.supplier_name || s.name || "",
          email: p.email || "",
          phone: p.phone || "",
          address: p.address || "",
          supplier_type: s.supplier_type || "",
          trading_name: s.business_info?.trading_name || "", business_email: s.business_info?.business_email || "", website_url: s.business_info?.website_url || "",
          contact_name: primaryContact.contact_name || "",
          contact_first_name: primaryContact.first_name || "", contact_last_name: primaryContact.last_name || "", contact_designation: primaryContact.designation || "",
          contact_email: primaryContact.email || "",
          contact_phone: primaryContact.phone || "", contact_method: primaryContact.preferred_contact_method || "",
          years_in_operation: String(
            s.business_info?.years_in_business ?? s.years_in_operation ?? "",
          ),
          business_registration_number: s.business_info?.business_registration_number || "",
          gst_tax_number: s.business_info?.gst_tax_number || "",
          target_market: s.business_info?.target_market || "",
          destinations_sold: s.business_info?.destinations_sold || "",
          country_id: String(s.country_id || ""),
          city_id: String(s.city_id || ""),
          currency: s.currency || "",
        });
      })
      .catch(() => setLoadError("Company details could not be loaded. Please retry before editing."));
  }, [retryKey]);

  const set = (k: keyof CompanyForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function saveCompany(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!e.currentTarget.reportValidity()) return;
    const phone = combinePhone(dialCodeForIso(phoneCountryIso), phoneNumber);
    if (!validateMobile(phone, true)) {
      toast.error(mobileHelp);
      return;
    }
    if (!form.supplier_type || !form.address || !form.country_id || !form.business_email || !form.business_registration_number || !form.gst_tax_number || !form.contact_first_name || !form.contact_last_name || !form.contact_designation || !form.contact_email || !contactPhoneNumber || !form.contact_method) {
      toast.error("Complete the required business details and primary contact fields.");
      return;
    }
    const contactPhone = combinePhone(dialCodeForIso(contactPhoneCountryIso), contactPhoneNumber);
    if (!validateMobile(contactPhone, true)) {
      toast.error("Enter the primary contact phone with its country code, for example +919876543210.");
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
          currency: form.currency || null,
          contact: (form.contact_first_name || form.contact_last_name || form.contact_designation || form.contact_email || contactPhoneNumber) ? {
            contact_name: form.contact_name || null, first_name: form.contact_first_name || null, last_name: form.contact_last_name || null, designation: form.contact_designation || null,
            email: form.contact_email || null,
            phone: contactPhone, preferred_contact_method: form.contact_method || null,
          } : undefined,
          business_info: {
            trading_name: form.trading_name, business_email: form.business_email, website_url: form.website_url,
            years_in_business: parseInt(form.years_in_operation) || 0,
            business_registration_number: form.business_registration_number,
            gst_tax_number: form.gst_tax_number,
            target_market: form.target_market,
            destinations_sold: form.destinations_sold,
          },
        }),
      ]);
      await refreshSession();
      toast.success("Company details updated successfully.");
      onSaved?.();
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

  async function savePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!e.currentTarget.reportValidity()) return;
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
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 lg:col-span-2">
          <span className="flex items-center gap-2"><AlertCircle size={16} />{loadError}</span>
          <button type="button" onClick={() => setRetryKey((key) => key + 1)} className="inline-flex items-center gap-1.5 font-bold underline"><RefreshCw size={14} />Retry</button>
        </div>
      )}
      {/* company details */}
      <form onSubmit={saveCompany} className="rounded-2xl border border-dash-border bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-3 border-b border-dash-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-bold text-dash-text">Company Details</h3>
          <button type="submit" disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors sm:w-auto">
            {saving ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
            Save Changes
          </button>
        </div>

        <div className="space-y-5 sm:space-y-4">
          {/* Logo */}
          <div>
            <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Company Logo</span>
            <ProfileImageUpload
              value={form.profile_image}
              onChange={v => set("profile_image", v)}
              label="Upload Logo"
            />
          </div>

          {/* Company / Legal Name */}
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Company / Legal Name <span className="text-red-500">*</span></span>
            <input required value={form.supplier_name} onChange={e => set("supplier_name", e.target.value)}
              placeholder="e.g. Alpine Expeditions Ltd"
              className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all" />
          </label>

          {/* Email */}
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Account Email</span>
            <input type="email" value={form.email} readOnly
              className="w-full cursor-not-allowed rounded-xl border border-dash-border bg-[#F9FAFB] px-4 py-2.5 text-sm text-dash-muted outline-none" />
            <p className="mt-1 text-xs text-dash-subtle">Used to sign in. To change it, contact support.</p>
          </label>

          {/* Mobile */}
          <CountryPhoneInput
            countryIso={phoneCountryIso}
            number={phoneNumber}
            onCountryChange={setPhoneCountryIso}
            onNumberChange={setPhoneNumber}
            required
            helpText={mobileHelp}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Trading / Business Name <span className="normal-case font-normal">(if different)</span></span><input value={form.trading_name} onChange={e => set("trading_name", e.target.value)} className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm" /></label>
            <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Business Email <span className="text-red-500">*</span></span><input required type="email" value={form.business_email} onChange={e => set("business_email", e.target.value)} className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm" /></label>
            <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Website <span className="text-dash-subtle">(optional)</span></span><input type="url" value={form.website_url} onChange={e => set("website_url", e.target.value)} placeholder="https://example.com" className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm" /></label>
          </div>

          {/* Address */}
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Registered Business Address <span className="text-red-500">*</span></span>
            <input required value={form.address} onChange={e => set("address", e.target.value)}
              placeholder="e.g. 14 Glacier Way, Queenstown 9300"
              className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all" />
          </label>

          {/* Business Type */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Business Type <span className="text-red-500">*</span></span>
              <select required value={form.supplier_type} onChange={e => set("supplier_type", e.target.value)}
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-emerald-500">
                <option value="">Select type</option>
                {BUSINESS_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
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
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Business Registration Number <span className="text-red-500">*</span></span>
              <input required value={form.business_registration_number} onChange={e => set("business_registration_number", e.target.value)}
                placeholder="e.g. REG-4920194"
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">GST / VAT Registration Number <span className="text-red-500">*</span></span>
              <input required value={form.gst_tax_number} onChange={e => set("gst_tax_number", e.target.value)}
                placeholder="e.g. TAX-8921-9481"
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
            </label>

            {/* Country */}
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Country <span className="text-red-500">*</span></span>
              <SearchableSelect value={form.country_id}
                onChange={(nextCountryId) => {
                  setSelectedStateId("");
                  const phoneIso = isoForCountryCode(countries.find((country) => String(country.id) === nextCountryId)?.code);
                  if (phoneIso) { setPhoneCountryIso(phoneIso); setContactPhoneCountryIso(phoneIso); }
                  setForm(f => {
                    // Auto-fill currency from the newly selected country unless
                    // the supplier already set one manually.
                    const match = countries.find(c => String(c.id) === nextCountryId);
                    return { ...f, country_id: nextCountryId, city_id: "", currency: f.currency || match?.currency_code || "" };
                  });
                }}
                options={countries.map((country) => ({ value: String(country.id), label: country.name }))}
                placeholder="Select country"
                searchPlaceholder="Search countries"
              />
            </label>

            {/* Currency */}
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Operating Currency</span>
              <CurrencySelect
                value={form.currency}
                onChange={code => set("currency", code)}
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
              />
              <span className="mt-1 block text-xs text-dash-muted">You can change this currency before saving. Existing tour-price amounts are not converted automatically, so review affected tours afterward.</span>
            </label>

            {/* State */}
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">State</span>
              <SearchableSelect value={selectedStateId} disabled={!form.country_id} onChange={(stateId) => { setSelectedStateId(stateId); setForm(f => ({ ...f, city_id: "" })); }} options={states.map((state) => ({ value: String(state.id), label: state.name }))} placeholder={form.country_id ? "Select state" : "Select country first"} searchPlaceholder="Search states" />
            </label>

            {/* City */}
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">City</span>
              <SearchableSelect value={form.city_id} disabled={!form.country_id} onChange={(cityId) => set("city_id", cityId)} options={cities.map((city) => ({ value: String(city.id), label: city.name }))} placeholder={form.country_id ? "Select city" : "Select country first"} searchPlaceholder="Search cities" />
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

          <fieldset className="rounded-xl border border-dash-border bg-dash-bg/45 p-4">
            <legend className="px-1 text-xs font-bold uppercase text-dash-muted">Primary Contact</legend>
            <p className="mb-3 text-xs text-dash-subtle">This is the main administrative contact for the Supplier Portal.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">First Name <span className="text-red-500">*</span></span>
                <input required value={form.contact_first_name} onChange={e => set("contact_first_name", e.target.value)} placeholder="e.g. Priya"
                  className="w-full rounded-xl border border-dash-border bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Last Name <span className="text-red-500">*</span></span><input required value={form.contact_last_name} onChange={e => set("contact_last_name", e.target.value)} placeholder="e.g. Sharma" className="w-full rounded-xl border border-dash-border bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Job Title / Position <span className="text-red-500">*</span></span><input required value={form.contact_designation} onChange={e => set("contact_designation", e.target.value)} placeholder="e.g. Operations Manager" className="w-full rounded-xl border border-dash-border bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Email Address <span className="text-red-500">*</span></span>
                <input required type="email" value={form.contact_email} onChange={e => set("contact_email", e.target.value)} placeholder="operations@example.com"
                  className="w-full rounded-xl border border-dash-border bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Preferred Contact Method <span className="text-red-500">*</span></span><select required value={form.contact_method} onChange={e => set("contact_method", e.target.value)} className="w-full rounded-xl border border-dash-border bg-white px-3 py-2.5 text-sm"><option value="">Select method</option><option value="email">Email</option><option value="phone">Phone</option><option value="whatsapp">WhatsApp</option></select></label>
              <CountryPhoneInput
                className="sm:col-span-2"
                countryIso={contactPhoneCountryIso}
                number={contactPhoneNumber}
                onCountryChange={setContactPhoneCountryIso}
                onNumberChange={setContactPhoneNumber}
                countryLabel="Primary contact country"
                label="Phone / Mobile *"
                required
                helpText="Select the country code, then enter the local mobile number."
              />
            </div>
          </fieldset>
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
