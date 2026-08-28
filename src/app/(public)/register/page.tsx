"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  LuCircleCheckBig as Check,
  LuMail as Mail,
  LuPhone as Phone,
  LuRefreshCw as Refresh,
  LuUser as User,
  LuShieldCheck as ShieldCheck,
  LuStar as Star,
  LuMapPin as MapPin,
  LuHeart as Heart,
} from "react-icons/lu";
import api from "@/lib/api/client";
import { normalizeEmail, validateEmail } from "@/lib/utils/validators";

// Traveller (customer) accounts only - agents and suppliers register through
// their own dedicated portals (/agent-portal/login, /supplier-portal/login).
const ACCOUNT_TYPE = "CUSTOMER";

const initialForm = {
  first_name: "",
  email: "",
  country_code: "+91",
  mobile_number: "",
  accepted_terms: false,
};

function errorMessage(error: unknown) {
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

const PENDING_REGISTRATION_KEY = "tourvaa_pending_registration";
const RESEND_COOLDOWN_SECONDS = 60;

type PendingRegistration = { email: string; changeToken: string; cooldownUntil: number };

function readPendingRegistration(): PendingRegistration | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_REGISTRATION_KEY);
    return raw ? (JSON.parse(raw) as PendingRegistration) : null;
  } catch {
    return null;
  }
}

function writePendingRegistration(value: PendingRegistration | null) {
  if (typeof window === "undefined") return;
  if (value) window.sessionStorage.setItem(PENDING_REGISTRATION_KEY, JSON.stringify(value));
  else window.sessionStorage.removeItem(PENDING_REGISTRATION_KEY);
}

function secondsUntil(timestamp: number) {
  return Math.max(0, Math.ceil((timestamp - Date.now()) / 1000));
}

const PERKS = [
  { icon: MapPin, label: "10,000+ experiences worldwide" },
  { icon: Star, label: "Verified top-rated suppliers" },
  { icon: Heart, label: "Wishlists & personalised picks" },
  { icon: ShieldCheck, label: "Secure & hassle-free booking" },
];

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm);
  const [sentEmail, setSentEmail] = useState(() => readPendingRegistration()?.email ?? "");
  const [changeToken, setChangeToken] = useState(() => readPendingRegistration()?.changeToken ?? "");
  const [redirect, setRedirect] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendIn, setResendIn] = useState(() => {
    const pending = readPendingRegistration();
    return pending ? secondsUntil(pending.cooldownUntil) : RESEND_COOLDOWN_SECONDS;
  });

  function startResendCooldown(email: string, token: string) {
    const cooldownUntil = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
    setSentEmail(email);
    setChangeToken(token);
    setResendIn(RESEND_COOLDOWN_SECONDS);
    writePendingRegistration({ email, changeToken: token, cooldownUntil });
  }

  const loginHref = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedRedirect = params.get("redirect");
    setRedirect(
      requestedRedirect?.startsWith("/") && !requestedRedirect.startsWith("//")
        ? requestedRedirect
        : null,
    );
  }, []);

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
        await api.post("/auth/change-registration-email", {
          change_token: changeToken,
          email,
          redirect,
        });
        startResendCooldown(email, changeToken);
      } else {
        const base = {
          first_name: form.first_name,
          email,
          country_code: form.country_code,
          mobile_number: form.mobile_number,
          accepted_terms: form.accepted_terms,
          account_type: ACCOUNT_TYPE,
          redirect,
        };
        const response = await api.post("/auth/register", base);
        startResendCooldown(email, response.data.data.registration_change_token || "");
      }
    } catch (registrationError) {
      setError(errorMessage(registrationError));
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setResending(true);
    setError("");
    try {
      await api.post("/auth/resend-verification", { email: sentEmail, redirect });
      startResendCooldown(sentEmail, changeToken);
    } catch (resendError) {
      setError(errorMessage(resendError));
    } finally {
      setResending(false);
    }
  }

  // ── Email sent state ────────────────────────────────────────────
  if (sentEmail) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-slate-50">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:40px_40px] opacity-60" />
        <div className="relative flex min-h-screen items-center justify-center px-4 py-24">
          <section className="w-full max-w-md rounded-[28px] border border-white bg-white p-8 text-center shadow-[0_32px_100px_rgba(15,23,42,.12)]">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Mail size={28} />
            </span>
            <h1 className="mt-5 text-2xl font-black text-slate-950">Check your email</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              We sent a secure verification link to{" "}
              <strong className="text-slate-800">{maskEmail(sentEmail)}</strong>.<br />
              Open it to verify your email and create your password.
            </p>
            {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button onClick={resend} disabled={resending || resendIn > 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-60">
                <Refresh size={15} />
                {resending ? "Sending..." : resendIn > 0 ? `Resend in ${resendIn}s` : "Resend verification email"}
              </button>
              <button
                onClick={() => { setSentEmail(""); writePendingRegistration(null); }}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Change email
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // ── Registration form ────────────────────────────────────────────
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50">
      {/* subtle grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:40px_40px] opacity-60" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-16 sm:px-6">
        <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_32px_100px_rgba(15,23,42,.14)] lg:grid lg:grid-cols-[1fr_1.05fr]">

          {/* ── Form panel (LEFT) ── */}
          <section className="flex flex-col justify-center px-6 py-10 sm:px-10">
            <div className="mb-7">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-700">
                <ShieldCheck size={12} /> Free account
              </span>
              <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950">Create your account</h2>
              <p className="mt-1 text-sm text-slate-500">Verify your email to start booking your dream trips.</p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {/* First name */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">First name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    required autoComplete="given-name"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    placeholder="Your first name"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    required autoComplete="email" type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Mobile */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Mobile number</label>
                <div className="grid grid-cols-[96px_1fr] gap-2">
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required autoComplete="tel-country-code"
                      value={form.country_code}
                      onChange={(e) => setForm({ ...form, country_code: e.target.value })}
                      placeholder="+91"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-8 pr-2 text-sm placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  <input
                    required autoComplete="tel-national" inputMode="numeric"
                    value={form.mobile_number}
                    onChange={(e) => setForm({ ...form, mobile_number: e.target.value.replace(/\D/g, "") })}
                    placeholder="9876543210"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Terms */}
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs leading-5 text-slate-600 transition hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={form.accepted_terms}
                  onChange={(e) => setForm({ ...form, accepted_terms: e.target.checked })}
                  className="mt-0.5 h-4 w-4 accent-blue-600 rounded"
                />
                <span>
                  I agree to the{" "}
                  <Link className="font-bold text-blue-600 hover:text-blue-700" href="/terms">Terms &amp; Conditions</Link>
                  {" "}and{" "}
                  <Link className="font-bold text-blue-600 hover:text-blue-700" href="/privacy-policy">Privacy Policy</Link>.
                </span>
              </label>

              {error && (
                <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl disabled:opacity-60 disabled:hover:translate-y-0">
                <Check size={16} />
                {loading ? "Sending…" : "Send Verification Link"}
              </button>

              <p className="text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link href={loginHref} className="font-bold text-blue-600 hover:text-blue-700 hover:underline">Sign in</Link>
              </p>
            </form>
          </section>

          {/* ── Hero panel (RIGHT) ── */}
          <section className="relative hidden flex-col overflow-hidden bg-slate-950 text-white lg:flex">
            <img
              src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80"
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-blue-950/60 to-slate-950/40" />

            {/* Decorative circles */}
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
            <div className="absolute -bottom-20 -left-10 h-80 w-80 rounded-full bg-white/5" />

            <div className="relative flex h-full flex-col justify-between p-10">
              {/* Badge */}
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold backdrop-blur-sm">
                ✈ Tourvaa Traveller
              </span>

              {/* Main text */}
              <div className="space-y-6">
                <h1 className="text-3xl font-black leading-tight tracking-tight">
                  Your next adventure awaits
                </h1>
                <p className="text-sm leading-7 text-white/75">
                  Join thousands of travellers discovering unforgettable experiences around the world with Tourvaa.
                </p>

                {/* Perks */}
                <ul className="space-y-3">
                  {PERKS.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-3 text-sm text-white/80">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
                        <Icon size={14} />
                      </span>
                      {label}
                    </li>
                  ))}
                </ul>

                {/* Stats */}
                <div className="mt-2 flex items-center gap-6 border-t border-white/10 pt-5">
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
