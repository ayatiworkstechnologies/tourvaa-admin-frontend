"use client";

import { useEffect, useState } from "react";
import { LuCircleCheckBig as CheckCircle2, LuLoaderCircle as Loader2 } from "react-icons/lu";
import api from "@/lib/api";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";

type ProfileForm = { full_name: string; phone: string; website: string; address: string; country: string; city: string; bio: string };

export default function AffiliateProfilePage() {
  const toast = useToast();
  const { user, dashboard, refreshSession } = useAuthContext();
  const affiliateId = (dashboard?.user as Record<string, unknown>)?.affiliate_id ?? dashboard?.user?.id;
  const [form, setForm] = useState<ProfileForm>({ full_name: "", phone: "", website: "", address: "", country: "", city: "", bio: "" });
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    if (user) setForm(f => ({ ...f, full_name: user.name || "" }));
    if (!affiliateId) return;
    api.get(`/affiliates/${affiliateId}`).then(res => {
      const d = res.data?.data ?? res.data ?? {};
      setForm(f => ({
        ...f,
        full_name: d.name || user?.name || "",
        phone: d.phone || "",
        website: d.website || "",
        address: d.address || "",
        country: d.country_name || "",
        city: d.city_name || "",
        bio: d.description || "",
      }));
    }).catch(() => {});
  }, [affiliateId, user]);

  const set = (k: keyof ProfileForm, v: string) => { setState("idle"); setForm(f => ({ ...f, [k]: v })); };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!affiliateId) return;
    setState("saving");
    try {
      await api.patch(`/affiliates/${affiliateId}`, form);
      await refreshSession();
      setState("saved");
      toast.success("Profile updated.");
    } catch {
      setState("error");
      toast.error("Could not update profile.");
    }
  }

  const initials = (form.full_name || user?.name || "A").split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#121826]">My Profile</h1>
        <p className="mt-1 text-sm text-[#667085]">Update your affiliate account details.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="rounded-xl border border-[#E7EAF0] bg-white p-6 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-purple-600 text-xl font-black text-white">{initials}</div>
          <p className="mt-4 font-bold text-[#121826]">{form.full_name || user?.name}</p>
          <p className="text-sm text-[#667085]">{user?.email}</p>
          <span className="mt-3 inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">Affiliate Partner</span>
          <div className="mt-4 rounded-xl border border-[#E7EAF0] bg-[#F9FAFB] p-3 text-xs text-[#667085]">
            Use the Referral Links section to create and share your unique tracking URLs.
          </div>
        </div>

        <form onSubmit={save} className="rounded-xl border border-[#E7EAF0] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-bold text-[#121826]">Edit Profile</h2>
            <button type="submit" disabled={state === "saving"}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-60">
              {state === "saving" ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
              Save Changes
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {([
              ["full_name", "Full Name", "Your legal name"],
              ["phone", "Phone", "+971 or +91"],
              ["website", "Website / Blog", "https://yourblog.com"],
              ["country", "Country", "Country"],
              ["city", "City", "City"],
              ["address", "Address", "Street address"],
            ] as [keyof ProfileForm, string, string][]).map(([key, label, ph]) => (
              <label key={key} className="block">
                <span className="text-xs font-bold uppercase text-[#667085]">{label}</span>
                <input value={form[key]} onChange={e => set(key, e.target.value)} placeholder={ph}
                  className="mt-1 w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
              </label>
            ))}
            <label className="block sm:col-span-2">
              <span className="text-xs font-bold uppercase text-[#667085]">Bio / Description</span>
              <textarea value={form.bio} onChange={e => set("bio", e.target.value)} rows={3} placeholder="Tell us about yourself and how you promote tours..."
                className="mt-1 w-full resize-none rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            </label>
          </div>

          {state === "saved" && <p className="mt-4 text-sm font-bold text-emerald-700">Profile updated successfully.</p>}
          {state === "error" && <p className="mt-4 text-sm font-bold text-red-600">Could not save. Please try again.</p>}
        </form>
      </div>
    </div>
  );
}
