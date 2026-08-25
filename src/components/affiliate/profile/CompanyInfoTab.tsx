"use client";

import { useEffect, useState } from "react";
import { LuCircleCheckBig as CheckCircle2, LuEye as Eye, LuEyeOff as EyeOff, LuLoaderCircle as Loader2 } from "react-icons/lu";
import api from "@/lib/api/client";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";
import { useGeoCities, useGeoCountries } from "@/hooks/useGeo";
import { validatePassword, passwordHelp } from "@/lib/utils/validators";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";

type ProfileForm = {
  name: string;
  phone: string;
  website_url: string;
  country_id: string;
  city_id: string;
};

type MarketingForm = {
  promotion_methods: string;
  estimated_monthly_bookings: string;
  existing_audience_size: string;
  social_media_profiles: string;
  existing_travel_platforms_used: string;
};

type InvoicingForm = {
  contact_name: string;
  email: string;
  phone: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  country_id: string;
  tax_number: string;
};

const EMPTY_PROFILE: ProfileForm = { name: "", phone: "", website_url: "", country_id: "", city_id: "" };
const EMPTY_MARKETING: MarketingForm = { promotion_methods: "", estimated_monthly_bookings: "", existing_audience_size: "", social_media_profiles: "", existing_travel_platforms_used: "" };
const EMPTY_INVOICING: InvoicingForm = { contact_name: "", email: "", phone: "", account_name: "", account_number: "", bank_name: "", country_id: "", tax_number: "" };

export default function CompanyInfoTab() {
  const toast = useToast();
  const { user, refreshSession } = useAuthContext();

  const [form, setForm] = useState<ProfileForm>(EMPTY_PROFILE);
  const [marketing, setMarketing] = useState<MarketingForm>(EMPTY_MARKETING);
  const [invoicing, setInvoicing] = useState<InvoicingForm>(EMPTY_INVOICING);
  const [saving, setSaving] = useState(false);

  const { countries } = useGeoCountries();
  const { cities } = useGeoCities(null, form.country_id ? Number(form.country_id) : null);

  useEffect(() => {
    api.get("/affiliates/me").then(res => {
      const d = res.data?.data ?? res.data ?? {};
      setForm({
        name: d.name || user?.name || "",
        phone: d.phone || "",
        website_url: d.website_url || "",
        country_id: String(d.country_id || ""),
        city_id: String(d.city_id || ""),
      });
      if (d.marketing_info) {
        setMarketing({
          promotion_methods: d.marketing_info.promotion_methods || "",
          estimated_monthly_bookings: String(d.marketing_info.estimated_monthly_bookings || ""),
          existing_audience_size: String(d.marketing_info.existing_audience_size || ""),
          social_media_profiles: d.marketing_info.social_media_profiles || "",
          existing_travel_platforms_used: d.marketing_info.existing_travel_platforms_used || "",
        });
      }
      if (d.invoicing) {
        setInvoicing({
          contact_name: d.invoicing.contact_name || "",
          email: d.invoicing.email || "",
          phone: d.invoicing.phone || "",
          account_name: d.invoicing.account_name || "",
          account_number: d.invoicing.account_number || "",
          bank_name: d.invoicing.bank_name || "",
          country_id: String(d.invoicing.country_id || ""),
          tax_number: d.invoicing.tax_number || "",
        });
      }
    }).catch(() => toast.error("Failed to load profile details."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k: keyof ProfileForm, v: string) => setForm(f => ({ ...f, [k]: v }));
  const setM = (k: keyof MarketingForm, v: string) => setMarketing(f => ({ ...f, [k]: v }));
  const setI = (k: keyof InvoicingForm, v: string) => setInvoicing(f => ({ ...f, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch("/affiliates/me", {
        name: form.name,
        phone: form.phone,
        website_url: form.website_url,
        country_id: parseInt(form.country_id) || null,
        city_id: parseInt(form.city_id) || null,
        marketing_info: {
          promotion_methods: marketing.promotion_methods,
          estimated_monthly_bookings: parseInt(marketing.estimated_monthly_bookings) || 0,
          existing_audience_size: parseInt(marketing.existing_audience_size) || 0,
          social_media_profiles: marketing.social_media_profiles,
          existing_travel_platforms_used: marketing.existing_travel_platforms_used,
        },
        invoicing: {
          contact_name: invoicing.contact_name,
          email: invoicing.email,
          phone: invoicing.phone,
          account_name: invoicing.account_name,
          account_number: invoicing.account_number,
          bank_name: invoicing.bank_name,
          country_id: parseInt(invoicing.country_id) || null,
          tax_number: invoicing.tax_number,
        },
      });
      await refreshSession();
      toast.success("Profile updated successfully.");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
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
      toast.error(getApiErrorMessage(err));
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        {/* profile details */}
        <form onSubmit={save} className="rounded-2xl border border-dash-border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-bold text-dash-text">Profile Details</h3>
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-60 transition-colors">
              {saving ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
              Save Changes
            </button>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Full Name <span className="text-red-500">*</span></span>
              <input required value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="Your legal name"
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all" />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Email</span>
              <input type="email" value={user?.email || ""} readOnly
                className="w-full cursor-not-allowed rounded-xl border border-dash-border bg-[#F9FAFB] px-4 py-2.5 text-sm text-dash-muted outline-none" />
              <p className="mt-1 text-xs text-dash-subtle">Email cannot be changed here. Contact support to update.</p>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Phone</span>
                <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+971 or +91"
                  className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Website / Blog</span>
                <input value={form.website_url} onChange={e => set("website_url", e.target.value)} placeholder="https://yourblog.com"
                  className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Country</span>
                <select value={form.country_id}
                  onChange={e => setForm(f => ({ ...f, country_id: e.target.value, city_id: "" }))}
                  className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-purple-500">
                  <option value="">Select country</option>
                  {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">City</span>
                <select value={form.city_id} disabled={!form.country_id}
                  onChange={e => set("city_id", e.target.value)}
                  className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-purple-500 disabled:bg-dash-bg">
                  <option value="">{form.country_id ? "Select city" : "Select country first"}</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            </div>
          </div>
        </form>

        {/* marketing info */}
        <form onSubmit={save} className="rounded-2xl border border-dash-border bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-lg font-bold text-dash-text">Marketing Info</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Promotion Methods</span>
              <input value={marketing.promotion_methods} onChange={e => setM("promotion_methods", e.target.value)}
                placeholder="e.g. Blog, YouTube, Instagram"
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Est. Monthly Bookings</span>
              <input type="number" min="0" value={marketing.estimated_monthly_bookings} onChange={e => setM("estimated_monthly_bookings", e.target.value)}
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Existing Audience Size</span>
              <input type="number" min="0" value={marketing.existing_audience_size} onChange={e => setM("existing_audience_size", e.target.value)}
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Social Media Profiles</span>
              <input value={marketing.social_media_profiles} onChange={e => setM("social_media_profiles", e.target.value)}
                placeholder="Links to your profiles"
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Other Travel Platforms Used</span>
              <input value={marketing.existing_travel_platforms_used} onChange={e => setM("existing_travel_platforms_used", e.target.value)}
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            </label>
          </div>
          <button type="submit" disabled={saving}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-60 transition-colors">
            {saving ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
            Save Marketing Info
          </button>
        </form>

        {/* invoicing */}
        <form onSubmit={save} className="rounded-2xl border border-dash-border bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-lg font-bold text-dash-text">Invoicing Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Contact Name</span>
              <input value={invoicing.contact_name} onChange={e => setI("contact_name", e.target.value)}
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Email</span>
              <input type="email" value={invoicing.email} onChange={e => setI("email", e.target.value)}
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Phone</span>
              <input value={invoicing.phone} onChange={e => setI("phone", e.target.value)}
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Account Name</span>
              <input value={invoicing.account_name} onChange={e => setI("account_name", e.target.value)}
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Account Number</span>
              <input value={invoicing.account_number} onChange={e => setI("account_number", e.target.value)}
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Bank Name</span>
              <input value={invoicing.bank_name} onChange={e => setI("bank_name", e.target.value)}
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Country</span>
              <select value={invoicing.country_id} onChange={e => setI("country_id", e.target.value)}
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-purple-500">
                <option value="">Select country</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Tax Number</span>
              <input value={invoicing.tax_number} onChange={e => setI("tax_number", e.target.value)}
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            </label>
          </div>
          <button type="submit" disabled={saving}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-60 transition-colors">
            {saving ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
            Save Invoicing Details
          </button>
        </form>
      </div>

      {/* security & password */}
      <form onSubmit={savePassword} className="rounded-2xl border border-dash-border bg-white p-6 shadow-sm self-start">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-dash-text">Security & Password</h3>
          <button type="submit" disabled={savingPw}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-60 transition-colors">
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
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 pr-11 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all" />
              <button type="button" onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dash-muted hover:text-purple-600"
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
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 pr-11 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all" />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dash-muted hover:text-purple-600"
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
              className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all" />
          </label>
        </div>
      </form>
    </div>
  );
}
