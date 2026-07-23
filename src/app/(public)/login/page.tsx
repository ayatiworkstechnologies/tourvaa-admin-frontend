"use client";

/* eslint-disable @next/next/no-img-element */

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import axios from "axios";
import { LuArrowRight as ArrowRight, LuBriefcaseBusiness as Briefcase, LuBuilding2 as Building, LuCheck as Check, LuEye as Eye, LuEyeOff as EyeOff, LuLock as Lock, LuMail as Mail, LuPlane as Plane, LuShieldCheck as ShieldCheck, LuSparkles as Sparkles } from "react-icons/lu";
import api from "@/lib/api/client";
import { getDashboardPath } from "@/lib/utils/dashboardPath";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { normalizeEmail, validateEmail } from "@/lib/utils/validators";
import { useAuthContext } from "@/providers/AuthProvider";

type FormValues = { identifier: string; password: string };
type LoginRole = "traveller" | "agent" | "supplier";

const loginRoles = {
  traveller: { label: "Traveller", title: "Welcome back, traveller", subtitle: "Access your bookings, saved tours and upcoming journeys.", icon: Plane, join: "/register", points: ["Manage all your bookings", "Save tours to your wishlist", "Get live trip updates"] },
  agent: { label: "Agent", title: "Agent partner login", subtitle: "Manage customers, create bookings and track your commissions.", icon: Briefcase, join: "/register?type=agent", points: ["Book tours for customers", "Track leads and commissions", "Access agent-only tools"] },
  supplier: { label: "Supplier", title: "Supplier portal login", subtitle: "Manage your tours, availability, bookings and payouts.", icon: Building, join: "/register?type=supplier", points: ["Manage tours and inventory", "Respond to booking requests", "Track earnings and payouts"] },
} satisfies Record<LoginRole, { label: string; title: string; subtitle: string; icon: typeof Plane; join: string; points: string[] }>;

const EMAIL_DOMAIN_CORRECTIONS: Record<string, string> = {
  "gmil.com": "gmail.com", "gmai.com": "gmail.com", "gmail.co": "gmail.com", "yaho.com": "yahoo.com", "outlok.com": "outlook.com", "hotmai.com": "hotmail.com",
};

function emailTypoMessage(value: string) {
  const normalized = normalizeEmail(value);
  const separator = normalized.lastIndexOf("@");
  if (separator < 1) return null;
  const correctedDomain = EMAIL_DOMAIN_CORRECTIONS[normalized.slice(separator + 1)];
  return correctedDomain ? `Did you mean ${normalized.slice(0, separator + 1)}${correctedDomain}?` : null;
}

function getLoginErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (error.response?.status === 401) return typeof detail === "string" ? detail : "Invalid email or password.";
    if (error.response?.status === 403 && typeof detail === "string") return detail;
  }
  return getApiErrorMessage(error);
}

function redirectForRole(roleSlug: string, requested: string | null) {
  const allowedPrefixes: Record<string, string> = {
    customer: "/customer/",
    supplier: "/supplier/",
    "agent-reseller": "/agent/",
    affiliate: "/affiliate/",
  };
  const prefix = allowedPrefixes[roleSlug.toLowerCase()];
  const normalizedRole = roleSlug.toLowerCase();
  const isSharedBooking = ["customer", "agent", "agent-reseller"].includes(normalizedRole) && requested?.startsWith("/booking/");
  return requested && ((prefix && requested.startsWith(prefix)) || isSharedBooking) ? requested : getDashboardPath(roleSlug);
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") ?? null;
  const safeRedirect = redirect?.startsWith("/") && !redirect.startsWith("//") ? redirect : null;
  const roleParam = searchParams?.get("role");
  const role: LoginRole = roleParam === "agent" || roleParam === "supplier" ? roleParam : "traveller";
  const roleDetails = loginRoles[role];
  const RoleIcon = roleDetails.icon;
  const { loginWithToken, isLoggedIn, loading: sessionLoading, dashboard } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ defaultValues: { identifier: "", password: "" } });

  useEffect(() => {
    if (!sessionLoading && isLoggedIn && dashboard) {
      const roleSlug = dashboard.user?.role?.slug ?? "";
      router.replace(redirectForRole(roleSlug, safeRedirect));
    }
  }, [sessionLoading, isLoggedIn, dashboard, router, safeRedirect]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setError("");
    try {
      const identifier = values.identifier.includes("@") ? normalizeEmail(values.identifier) : values.identifier.trim();
      const res = await api.post("/auth/login", { identifier, password: values.password, client_type: "web-cookie" });
      const data = res.data.data;
      if (data.account_restricted) {
        router.push("/account-status");
        return;
      }
      await loginWithToken();
      const roleSlug = data.user?.role?.slug ?? "";
      router.push(redirectForRole(roleSlug, safeRedirect));
    } catch (err: unknown) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!sessionLoading && isLoggedIn) return null;

  const selectRole = (nextRole: LoginRole) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("role", nextRole);
    router.replace(`/login?${params.toString()}`, { scroll: false });
    setError("");
  };
  const forgotParams = new URLSearchParams({ role });
  if (safeRedirect) forgotParams.set("redirect", safeRedirect);
  const registerHref = role === "traveller" ? `${roleDetails.join}${safeRedirect ? `?redirect=${encodeURIComponent(safeRedirect)}` : ""}` : roleDetails.join;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,#dbeafe_0%,transparent_30%),#f8fafc] px-4 pb-12 pt-28 sm:px-6">
      <div className="mx-auto grid min-h-[680px] w-full max-w-6xl overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_28px_90px_rgba(15,23,42,.16)] lg:grid-cols-[1.04fr_.96fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 text-white lg:block">
          <img src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1400&q=88" alt="Traveller overlooking a mountain landscape" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/95 via-blue-900/65 to-slate-950/35" />
          <div className="relative flex h-full flex-col justify-between p-12">
            <div><span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur"><Sparkles size={14} /> Your world. Your way.</span><h1 className="mt-7 max-w-md text-5xl font-black leading-[1.04]">One account.<br />Every journey.</h1><p className="mt-5 max-w-md text-sm leading-7 text-white/75">Sign in to the Tourvaa portal built for the way you travel and work.</p></div>
            <div key={role} className="animate-fade-up rounded-2xl border border-white/20 bg-white/12 p-6 backdrop-blur-xl"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600"><RoleIcon size={21} /></span><div><p className="text-[10px] uppercase tracking-[.18em] text-white/60">{roleDetails.label} portal</p><p className="text-sm font-bold">Everything you need in one place</p></div></div><div className="mt-5 space-y-3">{roleDetails.points.map((point) => <p key={point} className="flex items-center gap-3 text-xs text-white/85"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300"><Check size={11} /></span>{point}</p>)}</div></div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-9 sm:px-10 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-7"><span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600"><ShieldCheck size={13} /> Secure account access</span><h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">{roleDetails.title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{roleDetails.subtitle}</p></div>
            <div role="tablist" aria-label="Choose login type" className="mb-6 grid grid-cols-3 rounded-xl bg-slate-100 p-1.5">{(Object.entries(loginRoles) as [LoginRole, typeof roleDetails][]).map(([key, item]) => { const Icon = item.icon; const active = role === key; return <button key={key} role="tab" aria-selected={active} type="button" onClick={() => selectRole(key)} className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[11px] font-bold transition ${active ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}><Icon size={14} />{item.label}</button>; })}</div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div><label className="mb-1.5 block text-xs font-bold text-slate-700">Email or mobile number</label><div className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input autoComplete="username" placeholder="you@example.com or +919876543210" {...register("identifier", { required: "Email or mobile number is required.", validate: (value) => value.includes("@") ? (!validateEmail(value) ? "Enter a valid email address." : emailTypoMessage(value) || true) : (/^\+?\d{8,20}$/.test(value.trim()) || "Enter a valid mobile number.") })} className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50" /></div>{errors.identifier && <p className="mt-1 text-xs text-red-600">{errors.identifier.message}</p>}</div>

              <div><label className="mb-1.5 block text-xs font-bold text-slate-700">Password</label><div className="relative"><Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Your password" {...register("password", { required: "Password is required." })} className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-11 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>{errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}</div>

              <div className="flex justify-end"><Link href={`/forgot-password?${forgotParams.toString()}`} className="text-xs font-bold text-blue-600 hover:underline">Forgot password?</Link></div>
              {error && <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
              <button type="submit" disabled={loading} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl disabled:opacity-60">{loading ? "Signing in…" : `Sign in as ${roleDetails.label}`}{!loading && <ArrowRight size={15} className="transition group-hover:translate-x-1" />}</button>
              <p className="text-center text-sm text-slate-500">{role === "traveller" ? "New to Tourvaa?" : `Not a ${roleDetails.label.toLowerCase()} partner yet?`}{" "}<Link href={registerHref} className="font-bold text-blue-600 hover:underline">{role === "traveller" ? "Create account" : "Join Tourvaa"}</Link></p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function CustomerLoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
