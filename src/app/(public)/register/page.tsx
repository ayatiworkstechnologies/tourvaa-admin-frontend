"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  LuBriefcaseBusiness as Briefcase,
  LuBuilding2 as Building,
  LuCircleCheckBig as Check,
  LuMail as Mail,
  LuPlane as Plane,
  LuRefreshCw as Refresh,
  LuUser as User,
} from "react-icons/lu";
import api from "@/lib/api/client";
import { normalizeEmail, validateEmail } from "@/lib/utils/validators";

type AccountType = "CUSTOMER" | "AGENT" | "SUPPLIER";

const choices = [
  { value: "CUSTOMER" as const, title: "Customer", text: "Book tours and manage your trips", icon: Plane },
  { value: "AGENT" as const, title: "Travel Agent", text: "Book for clients and track commissions", icon: Briefcase },
  { value: "SUPPLIER" as const, title: "Supplier", text: "Manage tours, bookings and payouts", icon: Building },
];

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

export default function RegisterPage() {
  const [accountType, setAccountType] = useState<AccountType>("CUSTOMER");
  const [form, setForm] = useState(initialForm);
  const [sentEmail, setSentEmail] = useState("");
  const [changeToken, setChangeToken] = useState("");
  const [redirect, setRedirect] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendIn, setResendIn] = useState(60);
  const loginHref = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("type")?.toUpperCase();
    if (requested === "CUSTOMER" || requested === "AGENT" || requested === "SUPPLIER") {
      setAccountType(requested);
    }
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
        setSentEmail(email);
        setResendIn(60);
      } else {
        const base = {
          first_name: form.first_name,
          email,
          country_code: form.country_code,
          mobile_number: form.mobile_number,
          accepted_terms: form.accepted_terms,
          account_type: accountType,
          redirect,
        };
        const response = await api.post("/auth/register", base);
        setChangeToken(response.data.data.registration_change_token || "");
        setSentEmail(email);
        setResendIn(60);
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
      setResendIn(60);
    } catch (resendError) {
      setError(errorMessage(resendError));
    } finally {
      setResending(false);
    }
  }

  if (sentEmail) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 pt-24">
        <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Mail size={28} />
          </span>
          <h1 className="mt-5 text-2xl font-black text-slate-950">Check your email</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            We sent a secure verification link to{" "}
            <strong className="text-slate-800">{maskEmail(sentEmail)}</strong>. Open it to
            verify your email and create your password.
          </p>
          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button onClick={resend} disabled={resending || resendIn > 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
              <Refresh size={15} />
              {resending ? "Sending..." : resendIn > 0 ? `Resend in ${resendIn}s` : "Resend verification email"}
            </button>
            <button onClick={() => setSentEmail("")} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700">
              Change email
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-28">
      <div className="mx-auto w-full max-w-3xl">
        <div className="text-center">
          <h1 className="text-3xl font-black text-slate-950">Create your Tourvaa account</h1>
          <p className="mt-2 text-sm text-slate-500">Choose an account type, then verify your email to create a password.</p>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {choices.map(({ value, title, text, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setAccountType(value);
                setError("");
              }}
              className={`rounded-2xl border p-5 text-left transition ${
                accountType === value
                  ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accountType === value ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                <Icon size={19} />
              </span>
              <span className="mt-3 block font-bold text-slate-900">{title}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{text}</span>
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-700">First name</span>
            <span className="relative block">
              <User className="absolute left-3 top-3 text-slate-400" size={16} />
              <input required autoComplete="given-name" value={form.first_name} onChange={(event) => setForm({ ...form, first_name: event.target.value })} className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-600" placeholder="Your first name" />
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-700">Email address</span>
            <input required autoComplete="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-600" placeholder="you@example.com" />
          </label>

          <div className="grid grid-cols-[110px_1fr] gap-3">
            <label>
              <span className="mb-1.5 block text-xs font-bold text-slate-700">Country code</span>
              <input required autoComplete="tel-country-code" value={form.country_code} onChange={(event) => setForm({ ...form, country_code: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-600" />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold text-slate-700">Mobile number</span>
              <input required autoComplete="tel-national" inputMode="numeric" value={form.mobile_number} onChange={(event) => setForm({ ...form, mobile_number: event.target.value.replace(/\D/g, "") })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-600" placeholder="9876543210" />
            </label>
          </div>

          <label className="flex items-start gap-3 text-xs leading-5 text-slate-600">
            <input type="checkbox" checked={form.accepted_terms} onChange={(event) => setForm({ ...form, accepted_terms: event.target.checked })} className="mt-1" />
            <span>
              I agree to the <Link className="font-bold text-blue-600" href="/terms">Terms</Link>{" "}
              and <Link className="font-bold text-blue-600" href="/privacy-policy">Privacy Policy</Link>.
            </span>
          </label>

          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-60">
            <Check size={16} />
            {loading ? "Sending..." : "Send Verification Link"}
          </button>
          <p className="text-center text-sm text-slate-500">
            Already registered? <Link href={loginHref} className="font-bold text-blue-600">Sign in</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
