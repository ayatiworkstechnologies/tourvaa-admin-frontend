"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LuClock3 as Clock, LuLogOut as LogOut, LuRefreshCw as Refresh } from "react-icons/lu";
import api from "@/lib/api/client";

type StatusUser = { name: string; email: string; account_status: string; user_type: string; role?: { slug?: string } };
const copy: Record<string, { title: string; text: string }> = {
  PENDING_ADMIN_VERIFICATION: { title: "Verification in progress", text: "Your email is verified and your account is waiting for administrator activation." },
  INACTIVE: { title: "Account inactive", text: "This account is currently inactive. Contact Tourvaa support if you need help." },
  SUSPENDED: { title: "Account suspended", text: "Access to this account has been suspended. Contact Tourvaa support for details." },
  LOCKED: { title: "Account locked", text: "This account is locked. Contact Tourvaa support to restore access." },
};

export default function AccountStatusPage() {
  const router = useRouter();
  const [user, setUser] = useState<StatusUser | null>(null);
  const [loading, setLoading] = useState(true);
  async function refresh() {
    setLoading(true);
    try {
      const response = await api.get("/auth/account-status");
      const next = response.data.data.user as StatusUser;
      if (next.account_status === "ACTIVE") { router.replace("/login"); return; }
      setUser(next);
    } catch {
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function signOut() {
    try { await api.post("/auth/logout"); } catch { /* local navigation still returns to sign in */ }
    router.replace("/login");
  }
  const details = copy[user?.account_status || ""] || { title: "Account unavailable", text: "Your account cannot access a portal yet." };
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 pt-24"><section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
    <Clock className="mx-auto text-amber-500" size={54} /><h1 className="mt-4 text-2xl font-black text-slate-950">{details.title}</h1>
    <p className="mt-3 text-sm leading-6 text-slate-500">{details.text}</p>
    {user && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-600">{user.email} · {user.user_type}</p>}
    <div className="mt-7 flex justify-center gap-3"><button onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"><Refresh size={15} />{loading ? "Checking…" : "Refresh status"}</button><button onClick={() => void signOut()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700"><LogOut size={15} />Sign out</button></div>
    <a href="mailto:support@tourvaa.com" className="mt-6 inline-block text-sm font-bold text-blue-600">Contact support</a>
  </section></main>;
}
