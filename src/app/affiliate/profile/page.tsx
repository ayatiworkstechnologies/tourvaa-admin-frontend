"use client";

import { useEffect, useState } from "react";
import { LuCircleCheckBig as CheckCircle2, LuLoaderCircle as Loader2 } from "react-icons/lu";
import api from "@/lib/api/client";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";

type ProfileForm = { name: string; phone: string; website_url: string };

export default function AffiliateProfilePage() {
  const toast = useToast();
  const { user, dashboard, refreshSession, hasPermission } = useAuthContext();
  const canEdit = hasPermission("affiliates.approve");
  const affiliateId = dashboard?.user?.affiliate_id ?? null;
  const [form, setForm] = useState<ProfileForm>({ name: "", phone: "", website_url: "" });
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    if (user) setForm(f => ({ ...f, name: user.name || "" }));
    if (!affiliateId) return;
    api.get(`/affiliates/${affiliateId}`).then(res => {
      const d = res.data?.data ?? res.data ?? {};
      setForm(f => ({
        ...f,
        name: d.name || user?.name || "",
        phone: d.phone || "",
        website_url: d.website_url || "",
      }));
    }).catch(() => {});
  }, [affiliateId, user]);

  const set = (k: keyof ProfileForm, v: string) => { setState("idle"); setForm(f => ({ ...f, [k]: v })); };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!affiliateId) return;
    setState("saving");
    try {
      await api.put(`/affiliates/${affiliateId}`, form);
      await refreshSession();
      setState("saved");
      toast.success("Profile updated.");
    } catch {
      setState("error");
      toast.error("Could not update profile.");
    }
  }

  const initials = (form.name || user?.name || "A").split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-dash-text">My Profile</h1>
        <p className="mt-1 text-sm text-dash-muted">Update your affiliate account details.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="rounded-xl border border-dash-border bg-white p-6 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-purple-600 text-xl font-black text-white">{initials}</div>
          <p className="mt-4 font-bold text-dash-text">{form.name || user?.name}</p>
          <p className="text-sm text-dash-muted">{user?.email}</p>
          <span className="mt-3 inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">Affiliate Partner</span>
          <div className="mt-4 rounded-xl border border-dash-border bg-[#F9FAFB] p-3 text-xs text-dash-muted">
            Use the Referral Links section to create and share your unique tracking URLs.
          </div>
        </div>

        <form onSubmit={save} className="rounded-xl border border-dash-border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-bold text-dash-text">Edit Profile</h2>
            <button type="submit" disabled={state === "saving" || !canEdit}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-60">
              {state === "saving" ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
              {canEdit ? "Save Changes" : "Profile Managed by Admin"}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {([
              ["name", "Full Name", "Your legal name"],
              ["phone", "Phone", "+971 or +91"],
              ["website_url", "Website / Blog", "https://yourblog.com"],
            ] as [keyof ProfileForm, string, string][]).map(([key, label, ph]) => (
              <label key={key} className="block">
                <span className="text-xs font-bold uppercase text-dash-muted">{label}</span>
                <input value={form[key]} onChange={e => set(key, e.target.value)} placeholder={ph} disabled={!canEdit}
                  className="mt-1 w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-dash-bg disabled:text-dash-muted" />
              </label>
            ))}
          </div>

          {!canEdit && <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">Contact Tourvaa administration to change affiliate account details.</p>}

          {state === "saved" && <p className="mt-4 text-sm font-bold text-emerald-700">Profile updated successfully.</p>}
          {state === "error" && <p className="mt-4 text-sm font-bold text-red-600">Could not save. Please try again.</p>}
        </form>
      </div>
    </div>
  );
}
