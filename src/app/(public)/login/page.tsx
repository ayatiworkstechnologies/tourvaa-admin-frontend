"use client";

/* eslint-disable @next/next/no-img-element */

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import axios from "axios";
import {
  LuArrowRight as ArrowRight,
  LuCheck as Check,
  LuEye as Eye,
  LuEyeOff as EyeOff,
  LuLock as Lock,
  LuMail as Mail,
  LuShieldCheck as ShieldCheck,
  LuSparkles as Sparkles,
  LuMapPin as MapPin,
  LuHeart as Heart,
  LuStar as Star,
  LuCalendarCheck as CalendarCheck,
} from "react-icons/lu";
import api from "@/lib/api/client";
import { getDashboardPath } from "@/lib/utils/dashboardPath";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { normalizeEmail, validateEmail } from "@/lib/utils/validators";
import { useAuthContext } from "@/providers/AuthProvider";

type FormValues = { identifier: string; password: string };

// Traveller (customer) accounts only - agents and suppliers have their own
// dedicated portals (/agent-portal/login, /supplier-portal/login).
const roleDetails = {
  label: "Traveller",
  title: "Welcome back, traveller",
  subtitle: "Access your bookings, saved tours and upcoming journeys.",
  join: "/register",
  points: [
    { icon: MapPin, label: "10,000+ experiences worldwide" },
    { icon: Star, label: "Top-rated verified suppliers" },
    { icon: Heart, label: "Wishlists & personalised picks" },
    { icon: CalendarCheck, label: "Easy booking management" },
  ],
};

const EMAIL_DOMAIN_CORRECTIONS: Record<string, string> = {
  "gmil.com": "gmail.com", "gmai.com": "gmail.com", "gmail.co": "gmail.com",
  "yaho.com": "yahoo.com", "outlok.com": "outlook.com", "hotmai.com": "hotmail.com",
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
      if (data.account_restricted) { router.push("/account-status"); return; }
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

  const forgotParams = new URLSearchParams({ role: "traveller" });
  if (safeRedirect) forgotParams.set("redirect", safeRedirect);
  const registerHref = `${roleDetails.join}${safeRedirect ? `?redirect=${encodeURIComponent(safeRedirect)}` : ""}`;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50">
      {/* Subtle grid bg */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:40px_40px] opacity-60" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-16 sm:px-6">
        <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_32px_100px_rgba(15,23,42,.14)] lg:grid lg:grid-cols-[1fr_1.05fr]">

          {/* ── Form panel (LEFT) ── */}
          <section className="flex flex-col justify-center px-6 py-10 sm:px-10">
            {/* Top badge + heading */}
            <div className="mb-7">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-700">
                <ShieldCheck size={12} /> Secure access
              </span>
              <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950">Welcome Back</h2>
              <p className="mt-1 text-sm text-slate-500">Sign in to your account to continue.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Identifier */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
                  Email or mobile number
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    autoComplete="username"
                    placeholder="you@example.com or +919876543210"
                    {...register("identifier", {
                      required: "Email or mobile number is required.",
                      validate: (value) => value.includes("@")
                        ? (!validateEmail(value) ? "Enter a valid email address." : emailTypoMessage(value) || true)
                        : (/^\+?\d{8,20}$/.test(value.trim()) || "Enter a valid mobile number."),
                    })}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
                {errors.identifier && <p className="mt-1 text-xs font-medium text-red-600">{errors.identifier.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Your password"
                    {...register("password", { required: "Password is required." })}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs font-medium text-red-600">{errors.password.message}</p>}
              </div>

              <div className="flex justify-end">
                <Link href={`/forgot-password?${forgotParams.toString()}`} className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">
                  Forgot password?
                </Link>
              </div>

              {error && (
                <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? "Signing in…" : `Sign in as ${roleDetails.label}`}
                {!loading && <ArrowRight size={15} className="transition group-hover:translate-x-1" />}
              </button>

              <p className="text-center text-sm text-slate-500">
                New to Tourvaa?{" "}
                <Link href={registerHref} className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
                  Create account
                </Link>
              </p>

              {/* Portal links */}
              <div className="border-t border-slate-100 pt-4">
                <p className="mb-2.5 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Other portals</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { href: "/agent-portal/login", label: "Agent" },
                    { href: "/supplier-portal/login", label: "Supplier" },
                    { href: "/affiliate-portal/login", label: "Affiliate" },
                  ].map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className="rounded-xl border border-slate-200 py-2 text-center text-xs font-bold text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </form>
          </section>

          {/* ── Hero panel (RIGHT) ── */}
          <section className="relative hidden flex-col overflow-hidden bg-slate-950 text-white lg:flex">
            <img
              src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80"
              alt="Traveller overlooking a mountain landscape"
              className="absolute inset-0 h-full w-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-blue-950/60 to-slate-950/40" />

            {/* Decorative circles */}
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
            <div className="absolute -bottom-20 -left-10 h-80 w-80 rounded-full bg-white/5" />

            <div className="relative flex h-full flex-col justify-between p-10">
              {/* Badge */}
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold backdrop-blur-sm">
                <Sparkles size={13} /> Tourvaa Traveller
              </span>

              {/* Main content */}
              <div className="space-y-6">
                <h1 className="text-3xl font-black leading-tight tracking-tight">
                  Your next adventure awaits
                </h1>
                <p className="text-sm leading-7 text-white/75">
                  Sign in to discover, book and manage unforgettable travel experiences around the world.
                </p>

                {/* Feature bullets */}
                <ul className="space-y-3">
                  {roleDetails.points.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-3 text-sm text-white/80">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
                        <Icon size={14} />
                      </span>
                      {label}
                    </li>
                  ))}
                </ul>

                {/* Stats */}
                <div className="flex items-center gap-6 border-t border-white/10 pt-5">
                  <div>
                    <p className="text-2xl font-black">10,000+</p>
                    <p className="text-xs text-white/60">Tours available</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black">4.9 / 5</p>
                    <p className="text-xs text-white/60">Average rating</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
