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
  LuRefreshCw as Refresh,
  LuShieldCheck as ShieldCheck,
  LuSparkles as Sparkles,
  LuUser as User,
} from "react-icons/lu";
import api from "@/lib/api/client";
import { getDashboardPath } from "@/lib/utils/dashboardPath";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { normalizeEmail, validateEmail } from "@/lib/utils/validators";
import { useAuthContext } from "@/providers/AuthProvider";
import type { PortalTheme } from "@/components/public/portal/PortalPublicHeader";

export type PortalAuthConfig = {
  theme: PortalTheme;
  /** Role slug returned by the API (e.g. "supplier", "customer", "agent-reseller") - used to reject a login from the wrong account type. */
  roleSlug: string;
  accountType: "CUSTOMER" | "AGENT" | "SUPPLIER" | "AFFILIATE";
  /** Base path of this portal, e.g. "/supplier-portal" - used to build the overview link. */
  portalPath: string;
  /** Only a "redirect" target under this prefix is honored post-login, e.g. "/supplier/". */
  redirectPrefix: string;
  /** Extra redirect path prefixes to honor beyond redirectPrefix - e.g. agents share the
   * "/booking/{id}" checkout flow with customers, so a redirect back there must still work. */
  extraRedirectPrefixes?: string[];
  heroImage: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  signInCta: string;
  wrongRoleMessage: string;
  registerNamePlaceholder: string;
};

const THEME_CLASSES: Record<PortalTheme, {
  bgRadial: string; focusBorder: string; focusRing: string;
  button: string; buttonHover: string; buttonShadow: string; link: string;
  tabActive: string; badgeBg: string; badgeText: string; heroBg: string; heroGradient: string;
}> = {
  emerald: {
    bgRadial: "bg-[radial-gradient(circle_at_10%_10%,#dcfce7_0%,transparent_30%),#f8fafc]",
    focusBorder: "focus:border-emerald-500",
    focusRing: "focus:ring-emerald-50",
    button: "bg-emerald-700",
    buttonHover: "hover:bg-emerald-800",
    buttonShadow: "shadow-emerald-200",
    link: "text-emerald-700",
    tabActive: "text-emerald-700",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    heroBg: "bg-emerald-950",
    heroGradient: "from-emerald-950/95 via-emerald-900/65 to-slate-950/35",
  },
  blue: {
    bgRadial: "bg-[radial-gradient(circle_at_10%_10%,#dbeafe_0%,transparent_30%),#f8fafc]",
    focusBorder: "focus:border-blue-500",
    focusRing: "focus:ring-blue-50",
    button: "bg-blue-700",
    buttonHover: "hover:bg-blue-800",
    buttonShadow: "shadow-blue-200",
    link: "text-blue-700",
    tabActive: "text-blue-700",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    heroBg: "bg-blue-950",
    heroGradient: "from-blue-950/95 via-blue-900/65 to-slate-950/35",
  },
  indigo: {
    bgRadial: "bg-[radial-gradient(circle_at_10%_10%,#e0e7ff_0%,transparent_30%),#f8fafc]",
    focusBorder: "focus:border-indigo-500",
    focusRing: "focus:ring-indigo-50",
    button: "bg-indigo-700",
    buttonHover: "hover:bg-indigo-800",
    buttonShadow: "shadow-indigo-200",
    link: "text-indigo-700",
    tabActive: "text-indigo-700",
    badgeBg: "bg-indigo-50",
    badgeText: "text-indigo-700",
    heroBg: "bg-indigo-950",
    heroGradient: "from-indigo-950/95 via-indigo-900/65 to-slate-950/35",
  },
  purple: {
    bgRadial: "bg-[radial-gradient(circle_at_10%_10%,#f3e8ff_0%,transparent_30%),#f8fafc]",
    focusBorder: "focus:border-purple-500",
    focusRing: "focus:ring-purple-50",
    button: "bg-purple-700",
    buttonHover: "hover:bg-purple-800",
    buttonShadow: "shadow-purple-200",
    link: "text-purple-700",
    tabActive: "text-purple-700",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700",
    heroBg: "bg-purple-950",
    heroGradient: "from-purple-950/95 via-purple-900/65 to-slate-950/35",
  },
};

type Tab = "login" | "register";
type LoginFormValues = { identifier: string; password: string };

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

function LoginPanel({ config, safeRedirect, onSwitchToRegister }: { config: PortalAuthConfig; safeRedirect: string | null; onSwitchToRegister: () => void }) {
  const styles = THEME_CLASSES[config.theme];
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
    if (!sessionLoading && isLoggedIn && dashboard) {
      router.replace(redirectTarget());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading, isLoggedIn, dashboard, router, safeRedirect]);

  const onSubmit = async (values: LoginFormValues) => {
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
      const roleSlug = String(data.user?.role?.slug ?? "").toLowerCase();
      if (roleSlug !== config.roleSlug) {
        setError(config.wrongRoleMessage);
        return;
      }
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-bold text-slate-700">Email or mobile number</label>
        <div className="relative">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            autoComplete="username"
            placeholder="you@example.com or +919876543210"
            {...register("identifier", { required: "Email or mobile number is required.", validate: (value) => value.includes("@") ? (!validateEmail(value) ? "Enter a valid email address." : emailTypoMessage(value) || true) : (/^\+?\d{8,20}$/.test(value.trim()) || "Enter a valid mobile number.") })}
            className={`w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 ${styles.focusBorder} focus:bg-white focus:ring-4 ${styles.focusRing}`}
          />
        </div>
        {errors.identifier && <p className="mt-1 text-xs text-red-600">{errors.identifier.message}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold text-slate-700">Password</label>
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Your password"
            {...register("password", { required: "Password is required." })}
            className={`w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-11 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 ${styles.focusBorder} focus:bg-white focus:ring-4 ${styles.focusRing}`}
          />
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>

      <div className="flex justify-end"><Link href={forgotHref} className={`text-xs font-bold hover:underline ${styles.link}`}>Forgot password?</Link></div>
      {error && <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      <button type="submit" disabled={loading} className={`group flex w-full items-center justify-center gap-2 rounded-xl ${styles.button} py-3.5 text-sm font-bold text-white shadow-lg ${styles.buttonShadow} transition hover:-translate-y-0.5 ${styles.buttonHover} hover:shadow-xl disabled:opacity-60`}>
        {loading ? "Signing in…" : config.signInCta}{!loading && <ArrowRight size={15} className="transition group-hover:translate-x-1" />}
      </button>
      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account yet?{" "}
        <button type="button" onClick={onSwitchToRegister} className={`font-bold hover:underline ${styles.link}`}>Create an account</button>
      </p>
    </form>
  );
}

function pendingRegistrationKey(accountType: string) {
  return `tourvaa_pending_registration_${accountType.toLowerCase()}`;
}

const RESEND_COOLDOWN_SECONDS = 60;

type PendingRegistration = { email: string; changeToken: string; cooldownUntil: number };

function readPendingRegistration(storageKey: string): PendingRegistration | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as PendingRegistration) : null;
  } catch {
    return null;
  }
}

function writePendingRegistration(storageKey: string, value: PendingRegistration | null) {
  if (typeof window === "undefined") return;
  if (value) window.sessionStorage.setItem(storageKey, JSON.stringify(value));
  else window.sessionStorage.removeItem(storageKey);
}

function secondsUntil(timestamp: number) {
  return Math.max(0, Math.ceil((timestamp - Date.now()) / 1000));
}

function registrationErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (Array.isArray(detail)) return detail[0]?.msg || "Registration could not be completed.";
    return error.response?.data?.message || detail || "Registration could not be completed.";
  }
  return "Registration could not be completed.";
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}${"*".repeat(Math.max(2, name.length - 2))}@${domain}`;
}

function RegisterPanel({ config, safeRedirect, onSwitchToLogin }: { config: PortalAuthConfig; safeRedirect: string | null; onSwitchToLogin: () => void }) {
  const styles = THEME_CLASSES[config.theme];
  const storageKey = pendingRegistrationKey(config.accountType);
  const [form, setForm] = useState({ first_name: "", email: "", country_code: "+91", mobile_number: "", accepted_terms: false });
  const [sentEmail, setSentEmail] = useState(() => readPendingRegistration(storageKey)?.email ?? "");
  const [changeToken, setChangeToken] = useState(() => readPendingRegistration(storageKey)?.changeToken ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendIn, setResendIn] = useState(() => {
    const pending = readPendingRegistration(storageKey);
    return pending ? secondsUntil(pending.cooldownUntil) : RESEND_COOLDOWN_SECONDS;
  });

  function startResendCooldown(email: string, token: string) {
    const cooldownUntil = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
    setSentEmail(email);
    setChangeToken(token);
    setResendIn(RESEND_COOLDOWN_SECONDS);
    writePendingRegistration(storageKey, { email, changeToken: token, cooldownUntil });
  }

  useEffect(() => {
    if (!sentEmail || resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn, sentEmail]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!validateEmail(form.email)) return setError("Enter a valid email address.");
    if (!form.accepted_terms) return setError("Accept the Terms and Privacy Policy to continue.");

    setLoading(true);
    try {
      const email = normalizeEmail(form.email);
      if (changeToken) {
        await api.post("/auth/change-registration-email", { change_token: changeToken, email, redirect: safeRedirect });
        startResendCooldown(email, changeToken);
      } else {
        const response = await api.post("/auth/register", {
          first_name: form.first_name,
          email,
          country_code: form.country_code,
          mobile_number: form.mobile_number,
          accepted_terms: form.accepted_terms,
          account_type: config.accountType,
          redirect: safeRedirect,
        });
        startResendCooldown(email, response.data.data.registration_change_token || "");
      }
    } catch (registrationError) {
      setError(registrationErrorMessage(registrationError));
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setResending(true);
    setError("");
    try {
      await api.post("/auth/resend-verification", { email: sentEmail, redirect: safeRedirect });
      startResendCooldown(sentEmail, changeToken);
    } catch (resendError) {
      setError(registrationErrorMessage(resendError));
    } finally {
      setResending(false);
    }
  }

  if (sentEmail) {
    return (
      <div className="text-center">
        <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${styles.badgeBg} ${styles.badgeText}`}>
          <Mail size={24} />
        </span>
        <h3 className="mt-4 text-lg font-black text-slate-950">Check your email</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          We sent a secure verification link to <strong className="text-slate-800">{maskEmail(sentEmail)}</strong>. Open it to verify your email and create your password.
        </p>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button onClick={resend} disabled={resending || resendIn > 0} className={`inline-flex items-center justify-center gap-2 rounded-xl ${styles.button} px-5 py-3 text-sm font-bold text-white disabled:opacity-60`}>
            <Refresh size={15} />
            {resending ? "Sending..." : resendIn > 0 ? `Resend in ${resendIn}s` : "Resend verification email"}
          </button>
          <button onClick={() => { setSentEmail(""); writePendingRegistration(storageKey, null); }} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700">
            Change email
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-bold text-slate-700">{config.registerNamePlaceholder}</span>
        <span className="relative block">
          <User className="absolute left-3 top-3 text-slate-400" size={16} />
          <input required autoComplete="given-name" value={form.first_name} onChange={(event) => setForm({ ...form, first_name: event.target.value })} className={`w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none ${styles.focusBorder}`} placeholder="Your name" />
        </span>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-bold text-slate-700">Email address</span>
        <input required autoComplete="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={`w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ${styles.focusBorder}`} placeholder="you@example.com" />
      </label>

      <div className="grid grid-cols-[110px_1fr] gap-3">
        <label>
          <span className="mb-1.5 block text-xs font-bold text-slate-700">Country code</span>
          <input required autoComplete="tel-country-code" value={form.country_code} onChange={(event) => setForm({ ...form, country_code: event.target.value })} className={`w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ${styles.focusBorder}`} />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-bold text-slate-700">Mobile number</span>
          <input required autoComplete="tel-national" inputMode="numeric" value={form.mobile_number} onChange={(event) => setForm({ ...form, mobile_number: event.target.value.replace(/\D/g, "") })} className={`w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ${styles.focusBorder}`} placeholder="9876543210" />
        </label>
      </div>

      <label className="flex items-start gap-3 text-xs leading-5 text-slate-600">
        <input type="checkbox" checked={form.accepted_terms} onChange={(event) => setForm({ ...form, accepted_terms: event.target.checked })} className="mt-1" />
        <span>
          I agree to the <Link className={`font-bold ${styles.link}`} href="/terms">Terms</Link>{" "}
          and <Link className={`font-bold ${styles.link}`} href="/privacy-policy">Privacy Policy</Link>.
        </span>
      </label>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button disabled={loading} className={`flex w-full items-center justify-center gap-2 rounded-xl ${styles.button} py-3.5 text-sm font-bold text-white shadow-lg ${styles.buttonShadow} transition hover:-translate-y-0.5 ${styles.buttonHover} hover:shadow-xl disabled:opacity-60`}>
        <Check size={16} />
        {loading ? "Sending..." : "Send Verification Link"}
      </button>
      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <button type="button" onClick={onSwitchToLogin} className={`font-bold hover:underline ${styles.link}`}>Sign in</button>
      </p>
    </form>
  );
}

function PortalAuthContent({ config, heroIcon }: { config: PortalAuthConfig; heroIcon: ReactNode }) {
  const styles = THEME_CLASSES[config.theme];
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") ?? null;
  const safeRedirect = redirect?.startsWith("/") && !redirect.startsWith("//") ? redirect : null;
  const [tab, setTab] = useState<Tab>(searchParams?.get("tab") === "register" ? "register" : "login");

  return (
    <main className={`min-h-[calc(100vh-64px)] ${styles.bgRadial} px-4 py-14 sm:px-6`}>
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_28px_90px_rgba(15,23,42,.16)] lg:grid-cols-[1fr_1.1fr]">
        <section className={`relative hidden overflow-hidden ${styles.heroBg} text-white lg:block`}>
          <img src={config.heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className={`absolute inset-0 bg-gradient-to-br ${styles.heroGradient}`} />
          <div className="relative flex h-full flex-col justify-between p-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur"><Sparkles size={14} /> {config.heroBadge}</span>
            <div>
              <h1 className="text-3xl font-black leading-tight">{config.heroTitle}</h1>
              <p className="mt-4 text-sm leading-6 text-white/75">{config.heroSubtitle}</p>
              <Link href={config.portalPath} className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-white/80 hover:underline">
                {heroIcon} Learn more about this portal
              </Link>
            </div>
          </div>
        </section>

        <section className="px-6 py-9 sm:px-10">
          <div className="mb-6">
            <span className={`inline-flex items-center gap-2 rounded-full ${styles.badgeBg} px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${styles.badgeText}`}><ShieldCheck size={13} /> Secure account access</span>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950">{tab === "login" ? "Sign in to your account" : "Create your account"}</h2>
          </div>

          <div role="tablist" aria-label="Login or register" className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1.5">
            <button role="tab" aria-selected={tab === "login"} type="button" onClick={() => setTab("login")} className={`rounded-lg py-2.5 text-xs font-bold transition ${tab === "login" ? `bg-white ${styles.tabActive} shadow-sm` : "text-slate-500 hover:text-slate-900"}`}>
              Login
            </button>
            <button role="tab" aria-selected={tab === "register"} type="button" onClick={() => setTab("register")} className={`rounded-lg py-2.5 text-xs font-bold transition ${tab === "register" ? `bg-white ${styles.tabActive} shadow-sm` : "text-slate-500 hover:text-slate-900"}`}>
              Register
            </button>
          </div>

          {tab === "login" ? (
            <LoginPanel config={config} safeRedirect={safeRedirect} onSwitchToRegister={() => setTab("register")} />
          ) : (
            <RegisterPanel config={config} safeRedirect={safeRedirect} onSwitchToLogin={() => setTab("login")} />
          )}
        </section>
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
