"use client";

/* eslint-disable @next/next/no-img-element */

import { Suspense, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import axios from "axios";
import {
  LuArrowRight as ArrowRight,
  LuCircleCheckBig as Check,
  LuEye as Eye,
  LuEyeOff as EyeOff,
  LuLock as Lock,
  LuMail as Mail,
  LuPhone as Phone,
  LuRefreshCw as Refresh,
  LuShieldCheck as ShieldCheck,
  LuSparkles as Sparkles,
  LuUser as User,
  LuBuilding2 as Building,
} from "react-icons/lu";
import api from "@/lib/api/client";
import { getDashboardPath } from "@/lib/utils/dashboardPath";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { normalizeEmail, validateEmail } from "@/lib/utils/validators";
import { useAuthContext } from "@/providers/AuthProvider";
import type { PortalTheme } from "@/components/public/portal/PortalPublicHeader";

export type PortalAuthConfig = {
  theme: PortalTheme;
  roleSlug: string;
  accountType: "CUSTOMER" | "AGENT" | "SUPPLIER" | "AFFILIATE";
  portalPath: string;
  redirectPrefix: string;
  extraRedirectPrefixes?: string[];
  heroImage: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  /** Optional bullet points shown in the hero panel */
  heroBullets?: string[];
  /** Optional stats shown at the bottom of the hero panel, e.g. [{ value: "800+", label: "Suppliers" }] */
  heroStats?: { value: string; label: string }[];
  signInCta: string;
  wrongRoleMessage: string;
  registerNamePlaceholder: string;
};

const THEME: Record<PortalTheme, {
  accent: string; accentHover: string; accentShadow: string; accentLight: string; accentText: string;
  focusBorder: string; focusRing: string; link: string; tabActive: string; heroGradient: string; heroBg: string;
  checkboxAccent: string;
}> = {
  emerald: {
    accent: "bg-emerald-600", accentHover: "hover:bg-emerald-700", accentShadow: "shadow-emerald-200",
    accentLight: "bg-emerald-50", accentText: "text-emerald-700",
    focusBorder: "focus:border-emerald-500", focusRing: "focus:ring-emerald-100",
    link: "text-emerald-600 hover:text-emerald-700", tabActive: "text-emerald-700",
    heroGradient: "from-slate-950/90 via-emerald-950/60 to-slate-950/40",
    heroBg: "bg-emerald-950", checkboxAccent: "accent-emerald-600",
  },
  blue: {
    accent: "bg-blue-600", accentHover: "hover:bg-blue-700", accentShadow: "shadow-blue-200",
    accentLight: "bg-blue-50", accentText: "text-blue-700",
    focusBorder: "focus:border-blue-500", focusRing: "focus:ring-blue-100",
    link: "text-blue-600 hover:text-blue-700", tabActive: "text-blue-700",
    heroGradient: "from-slate-950/90 via-blue-950/60 to-slate-950/40",
    heroBg: "bg-blue-950", checkboxAccent: "accent-blue-600",
  },
  indigo: {
    accent: "bg-indigo-600", accentHover: "hover:bg-indigo-700", accentShadow: "shadow-indigo-200",
    accentLight: "bg-indigo-50", accentText: "text-indigo-700",
    focusBorder: "focus:border-indigo-500", focusRing: "focus:ring-indigo-100",
    link: "text-indigo-600 hover:text-indigo-700", tabActive: "text-indigo-700",
    heroGradient: "from-slate-950/90 via-indigo-950/60 to-slate-950/40",
    heroBg: "bg-indigo-950", checkboxAccent: "accent-indigo-600",
  },
  purple: {
    accent: "bg-purple-600", accentHover: "hover:bg-purple-700", accentShadow: "shadow-purple-200",
    accentLight: "bg-purple-50", accentText: "text-purple-700",
    focusBorder: "focus:border-purple-500", focusRing: "focus:ring-purple-100",
    link: "text-purple-600 hover:text-purple-700", tabActive: "text-purple-700",
    heroGradient: "from-slate-950/90 via-purple-950/60 to-slate-950/40",
    heroBg: "bg-purple-950", checkboxAccent: "accent-purple-600",
  },
};

type Tab = "login" | "register";
type LoginFormValues = { identifier: string; password: string };

const EMAIL_DOMAIN_CORRECTIONS: Record<string, string> = {
  "gmil.com": "gmail.com", "gmai.com": "gmail.com", "gmail.co": "gmail.com",
  "yaho.com": "yahoo.com", "outlok.com": "outlook.com", "hotmai.com": "hotmail.com",
};

function emailTypoMessage(value: string) {
  const normalized = normalizeEmail(value);
  const sep = normalized.lastIndexOf("@");
  if (sep < 1) return null;
  const correctedDomain = EMAIL_DOMAIN_CORRECTIONS[normalized.slice(sep + 1)];
  return correctedDomain ? `Did you mean ${normalized.slice(0, sep + 1)}${correctedDomain}?` : null;
}

function getLoginErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (error.response?.status === 401) return typeof detail === "string" ? detail : "Invalid email or password.";
    if (error.response?.status === 403 && typeof detail === "string") return detail;
  }
  return getApiErrorMessage(error);
}

// ── Shared field styles ────────────────────────────────────────────
function FieldInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:ring-4 ${className ?? ""}`}
    />
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-xs font-bold text-slate-600 uppercase tracking-wide">{children}</span>;
}

function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
}

// ── Login Panel ────────────────────────────────────────────────────
function LoginPanel({ config, safeRedirect, onSwitchToRegister }: { config: PortalAuthConfig; safeRedirect: string | null; onSwitchToRegister: () => void }) {
  const t = THEME[config.theme];
  const router = useRouter();
  const { loginWithToken, isLoggedIn, loading: sessionLoading, dashboard } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({ defaultValues: { identifier: "", password: "" } });

  function redirectTarget() {
    const allowed = safeRedirect && (
      safeRedirect.startsWith(config.redirectPrefix) ||
      (config.extraRedirectPrefixes ?? []).some((prefix) => safeRedirect.startsWith(prefix))
    );
    return allowed ? safeRedirect! : getDashboardPath(config.roleSlug);
  }

  useEffect(() => {
    if (!sessionLoading && isLoggedIn && dashboard) router.replace(redirectTarget());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading, isLoggedIn, dashboard, router, safeRedirect]);

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true); setError("");
    try {
      const identifier = values.identifier.includes("@") ? normalizeEmail(values.identifier) : values.identifier.trim();
      const res = await api.post("/auth/login", { identifier, password: values.password, client_type: "web-cookie" });
      const data = res.data.data;
      if (data.account_restricted) { router.push("/account-status"); return; }
      const roleSlug = String(data.user?.role?.slug ?? "").toLowerCase();
      if (roleSlug !== config.roleSlug) { setError(config.wrongRoleMessage); return; }
      await loginWithToken();
      router.push(redirectTarget());
    } catch (err: unknown) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!sessionLoading && isLoggedIn) return null;
  const forgotHref = `/forgot-password?role=${encodeURIComponent(config.roleSlug)}${safeRedirect ? `&redirect=${encodeURIComponent(safeRedirect)}` : ""}`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <FieldLabel>Email or mobile number</FieldLabel>
        <div className="relative">
          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <FieldInput
            autoComplete="username"
            placeholder="you@example.com or +919876543210"
            {...register("identifier", {
              required: "Email or mobile number is required.",
              validate: (v) => v.includes("@")
                ? (!validateEmail(v) ? "Enter a valid email address." : emailTypoMessage(v) || true)
                : (/^\+?\d{8,20}$/.test(v.trim()) || "Enter a valid mobile number."),
            })}
            className={`pl-10 ${t.focusBorder} ${t.focusRing}`}
          />
        </div>
        <ErrorText message={errors.identifier?.message} />
      </div>

      <div>
        <FieldLabel>Password</FieldLabel>
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <FieldInput
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Your password"
            {...register("password", { required: "Password is required." })}
            className={`pl-10 pr-11 ${t.focusBorder} ${t.focusRing}`}
          />
          <button type="button" onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <ErrorText message={errors.password?.message} />
      </div>

      <div className="flex justify-end">
        <Link href={forgotHref} className={`text-xs font-bold ${t.link}`}>Forgot password?</Link>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button type="submit" disabled={loading}
        className={`group flex w-full items-center justify-center gap-2 rounded-xl ${t.accent} ${t.accentHover} py-3.5 text-sm font-bold text-white shadow-lg ${t.accentShadow} transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60 disabled:hover:translate-y-0`}>
        {loading ? "Signing in…" : config.signInCta}
        {!loading && <ArrowRight size={15} className="transition group-hover:translate-x-1" />}
      </button>

      <p className="text-center text-sm text-slate-500">
        No account yet?{" "}
        <button type="button" onClick={onSwitchToRegister} className={`font-bold ${t.link}`}>
          Create account
        </button>
      </p>
    </form>
  );
}

// ── Register Panel ─────────────────────────────────────────────────
const PENDING_KEY = (accountType: string) => `tourvaa_pending_reg_${accountType.toLowerCase()}`;
const RESEND_COOLDOWN = 60;
type PendingRegistration = { email: string; changeToken: string; cooldownUntil: number };

function readPending(key: string): PendingRegistration | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(window.sessionStorage.getItem(key) ?? "null") as PendingRegistration | null; } catch { return null; }
}
function writePending(key: string, v: PendingRegistration | null) {
  if (typeof window === "undefined") return;
  v ? window.sessionStorage.setItem(key, JSON.stringify(v)) : window.sessionStorage.removeItem(key);
}
function secondsUntil(ts: number) { return Math.max(0, Math.ceil((ts - Date.now()) / 1000)); }

function registrationErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const d = error.response?.data?.detail;
    if (Array.isArray(d)) return d[0]?.msg || "Registration could not be completed.";
    return error.response?.data?.message || d || "Registration could not be completed.";
  }
  return "Registration could not be completed.";
}

function maskEmail(email: string) {
  const [n, d] = email.split("@");
  return `${n.slice(0, 2)}${"*".repeat(Math.max(2, n.length - 2))}@${d}`;
}

function RegisterPanel({ config, safeRedirect, onSwitchToLogin }: { config: PortalAuthConfig; safeRedirect: string | null; onSwitchToLogin: () => void }) {
  const t = THEME[config.theme];
  const key = PENDING_KEY(config.accountType);
  const [form, setForm] = useState({ first_name: "", email: "", country_code: "+91", mobile_number: "", accepted_terms: false });
  const [sentEmail, setSentEmail] = useState(() => readPending(key)?.email ?? "");
  const [changeToken, setChangeToken] = useState(() => readPending(key)?.changeToken ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendIn, setResendIn] = useState(() => { const p = readPending(key); return p ? secondsUntil(p.cooldownUntil) : RESEND_COOLDOWN; });

  function startCooldown(email: string, token: string) {
    const cooldownUntil = Date.now() + RESEND_COOLDOWN * 1000;
    setSentEmail(email); setChangeToken(token); setResendIn(RESEND_COOLDOWN);
    writePending(key, { email, changeToken: token, cooldownUntil });
  }

  useEffect(() => {
    if (!sentEmail || resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn, sentEmail]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (!validateEmail(form.email)) return setError("Enter a valid email address.");
    if (!form.accepted_terms) return setError("Accept the Terms and Privacy Policy to continue.");
    setLoading(true);
    try {
      const email = normalizeEmail(form.email);
      if (changeToken) {
        await api.post("/auth/change-registration-email", { change_token: changeToken, email, redirect: safeRedirect });
        startCooldown(email, changeToken);
      } else {
        const res = await api.post("/auth/register", {
          first_name: form.first_name, email,
          country_code: form.country_code, mobile_number: form.mobile_number,
          accepted_terms: form.accepted_terms, account_type: config.accountType, redirect: safeRedirect,
        });
        startCooldown(email, res.data.data.registration_change_token || "");
      }
    } catch (err) { setError(registrationErrorMessage(err)); }
    finally { setLoading(false); }
  }

  async function resend() {
    setResending(true); setError("");
    try {
      await api.post("/auth/resend-verification", { email: sentEmail, redirect: safeRedirect });
      startCooldown(sentEmail, changeToken);
    } catch (err) { setError(registrationErrorMessage(err)); }
    finally { setResending(false); }
  }

  // ── Email sent state ──
  if (sentEmail) {
    return (
      <div className="py-4 text-center">
        <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${t.accentLight} ${t.accentText}`}>
          <Mail size={28} />
        </span>
        <h3 className="mt-4 text-xl font-black text-slate-900">Check your email</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          We sent a secure link to <strong className="text-slate-800">{maskEmail(sentEmail)}</strong>.<br />
          Open it to verify your email and set your password.
        </p>
        {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button onClick={resend} disabled={resending || resendIn > 0}
            className={`inline-flex items-center justify-center gap-2 rounded-xl ${t.accent} px-5 py-3 text-sm font-bold text-white disabled:opacity-60`}>
            <Refresh size={15} />
            {resending ? "Sending..." : resendIn > 0 ? `Resend in ${resendIn}s` : "Resend verification email"}
          </button>
          <button onClick={() => { setSentEmail(""); writePending(key, null); }}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
            Change email
          </button>
        </div>
      </div>
    );
  }

  // ── Registration form ──
  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Name */}
      <div>
        <FieldLabel>{config.registerNamePlaceholder}</FieldLabel>
        <div className="relative">
          {config.accountType === "SUPPLIER" ? (
            <Building size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          ) : (
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          )}
          <FieldInput
            required autoComplete="given-name"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            placeholder="Your name"
            className={`pl-10 ${t.focusBorder} ${t.focusRing}`}
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <FieldLabel>Email address</FieldLabel>
        <div className="relative">
          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <FieldInput
            required autoComplete="email" type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            className={`pl-10 ${t.focusBorder} ${t.focusRing}`}
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <FieldLabel>Mobile number</FieldLabel>
        <div className="grid grid-cols-[96px_1fr] gap-2">
          <div className="relative">
            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <FieldInput
              required autoComplete="tel-country-code"
              value={form.country_code}
              onChange={(e) => setForm({ ...form, country_code: e.target.value })}
              placeholder="+91"
              className={`pl-8 ${t.focusBorder} ${t.focusRing}`}
            />
          </div>
          <FieldInput
            required autoComplete="tel-national" inputMode="numeric"
            value={form.mobile_number}
            onChange={(e) => setForm({ ...form, mobile_number: e.target.value.replace(/\D/g, "") })}
            placeholder="9876543210"
            className={`${t.focusBorder} ${t.focusRing}`}
          />
        </div>
      </div>

      {/* Terms */}
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs leading-5 text-slate-600 transition hover:bg-slate-100">
        <input
          type="checkbox"
          checked={form.accepted_terms}
          onChange={(e) => setForm({ ...form, accepted_terms: e.target.checked })}
          className={`mt-0.5 h-4 w-4 rounded ${t.checkboxAccent}`}
        />
        <span>
          I agree to the{" "}
          <Link className={`font-bold ${t.link}`} href="/terms">Terms & Conditions</Link>
          {" "}and{" "}
          <Link className={`font-bold ${t.link}`} href="/privacy-policy">Privacy Policy</Link>.
        </span>
      </label>

      {error && (
        <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button disabled={loading}
        className={`flex w-full items-center justify-center gap-2 rounded-xl ${t.accent} ${t.accentHover} py-3.5 text-sm font-bold text-white shadow-lg ${t.accentShadow} transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60 disabled:hover:translate-y-0`}>
        <Check size={16} />
        {loading ? "Sending…" : "Send Verification Link"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <button type="button" onClick={onSwitchToLogin} className={`font-bold ${t.link}`}>Sign in</button>
      </p>
    </form>
  );
}

// ── Main Layout ────────────────────────────────────────────────────
function PortalAuthContent({ config, heroIcon }: { config: PortalAuthConfig; heroIcon: ReactNode }) {
  const t = THEME[config.theme];
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") ?? null;
  const safeRedirect = redirect?.startsWith("/") && !redirect.startsWith("//") ? redirect : null;
  const [tab, setTab] = useState<Tab>(searchParams?.get("tab") === "register" ? "register" : "login");

  return (
    <main className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
      {/* subtle grid bg */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:40px_40px] opacity-60" />

      <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12 sm:px-6">
        <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_32px_100px_rgba(15,23,42,.14)] lg:grid lg:grid-cols-[1fr_1.05fr]">

          {/* ── Form panel (LEFT) ── */}
          <section className="flex flex-col justify-center px-6 py-10 sm:px-10">
            {/* Heading */}
            <div className="mb-7">
              <span className={`inline-flex items-center gap-1.5 rounded-full ${t.accentLight} px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${t.accentText}`}>
                <ShieldCheck size={12} /> Secure access
              </span>
              <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950">
                {tab === "login" ? `${config.heroBadge} Login` : `Register for ${config.heroBadge}`}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {tab === "login" ? "Sign in to access your dashboard and bookings." : "Fill in your details to get started."}
              </p>
            </div>

            {/* Tabs */}
            <div role="tablist" aria-label="Login or register" className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1.5">
              {(["login", "register"] as Tab[]).map((t_tab) => (
                <button
                  key={t_tab}
                  role="tab"
                  aria-selected={tab === t_tab}
                  type="button"
                  onClick={() => setTab(t_tab)}
                  className={`rounded-xl py-2.5 text-xs font-bold transition ${tab === t_tab ? `bg-white ${t.tabActive} shadow-sm` : "text-slate-500 hover:text-slate-800"}`}
                >
                  {t_tab === "login" ? "Login" : "Register"}
                </button>
              ))}
            </div>

            {tab === "login" ? (
              <LoginPanel config={config} safeRedirect={safeRedirect} onSwitchToRegister={() => setTab("register")} />
            ) : (
              <RegisterPanel config={config} safeRedirect={safeRedirect} onSwitchToLogin={() => setTab("login")} />
            )}
          </section>

          {/* ── Hero panel (RIGHT) ── */}
          <section className={`relative hidden flex-col overflow-hidden ${t.heroBg} text-white lg:flex`}>
            <img src={config.heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-br ${t.heroGradient}`} />

            {/* Decorative overlay circles */}
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
            <div className="absolute -bottom-20 -left-10 h-80 w-80 rounded-full bg-white/5" />

            <div className="relative flex h-full flex-col justify-between p-10">
              {/* Badge */}
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold backdrop-blur-sm">
                <Sparkles size={13} /> {config.heroBadge}
              </span>

              {/* Content */}
              <div className="space-y-5">
                <h1 className="text-3xl font-black leading-tight tracking-tight">{config.heroTitle}</h1>
                <p className="text-sm leading-7 text-white/75">{config.heroSubtitle}</p>

                {/* Perk bullets */}
                {config.heroBullets && config.heroBullets.length > 0 && (
                  <ul className="space-y-3">
                    {config.heroBullets.map((bullet) => (
                      <li key={bullet} className="flex items-center gap-3 text-sm text-white/80">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/70">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Stats strip */}
                {config.heroStats && config.heroStats.length > 0 && (
                  <div className="flex flex-wrap items-center gap-6 border-t border-white/10 pt-5">
                    {config.heroStats.map(({ value, label }) => (
                      <div key={label}>
                        <p className="text-2xl font-black">{value}</p>
                        <p className="text-xs text-white/60">{label}</p>
                      </div>
                    ))}
                  </div>
                )}

                <Link href={config.portalPath} className="inline-flex items-center gap-1.5 text-xs font-bold text-white/70 transition hover:text-white hover:underline">
                  {heroIcon} Learn more →
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function PortalAuthPage({ config, heroIcon }: { config: PortalAuthConfig; heroIcon: ReactNode }) {
  return (
    <Suspense>
      <PortalAuthContent config={config} heroIcon={heroIcon} />
    </Suspense>
  );
}
