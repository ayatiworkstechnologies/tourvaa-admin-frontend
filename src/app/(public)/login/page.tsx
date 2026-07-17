"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import axios from "axios";
import { LuEye as Eye, LuEyeOff as EyeOff, LuLock as Lock, LuLogIn as LogIn, LuMail as Mail } from "react-icons/lu";
import api from "@/lib/api/client";
import { getDashboardPath } from "@/lib/utils/dashboardPath";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { normalizeEmail, validateEmail } from "@/lib/utils/validators";
import { useAuthContext } from "@/providers/AuthProvider";

type FormValues = { email: string; password: string };

const EMAIL_DOMAIN_CORRECTIONS: Record<string, string> = {
  "gmil.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmail.co": "gmail.com",
  "yaho.com": "yahoo.com",
  "outlok.com": "outlook.com",
  "hotmai.com": "hotmail.com",
};

function emailTypoMessage(value: string) {
  const normalized = normalizeEmail(value);
  const separator = normalized.lastIndexOf("@");
  if (separator < 1) return null;
  const correctedDomain = EMAIL_DOMAIN_CORRECTIONS[normalized.slice(separator + 1)];
  if (!correctedDomain) return null;
  return `Did you mean ${normalized.slice(0, separator + 1)}${correctedDomain}?`;
}

function getLoginErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (error.response?.status === 401) {
      return typeof detail === "string" ? detail : "Invalid email or password.";
    }
    if (error.response?.status === 403 && typeof detail === "string") {
      return detail;
    }
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
  const isCustomerBooking = roleSlug.toLowerCase() === "customer" && requested?.startsWith("/booking/");
  return requested && ((prefix && requested.startsWith(prefix)) || isCustomerBooking) ? requested : getDashboardPath(roleSlug);
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

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: { email: "", password: "" },
  });

  // Already logged in — redirect to the right dashboard
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
      const res = await api.post("/auth/login", {
        email: normalizeEmail(values.email),
        password: values.password,
      });
      const data = res.data.data;
      await loginWithToken(data.access_token);
      const roleSlug = data.user?.role?.slug ?? "";
      const dest = redirectForRole(roleSlug, safeRedirect);
      router.push(dest);
    } catch (err: unknown) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!sessionLoading && isLoggedIn) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 pb-16 pt-32">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <LogIn size={22} />
            </span>
            <h1 className="mt-3 text-xl font-bold text-zinc-950">Welcome back</h1>
            <p className="mt-1 text-sm text-zinc-500">Sign in to your Tourvaa account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-600">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register("email", {
                    required: "Email is required.",
                    validate: (v) => {
                      if (!validateEmail(v)) return "Enter a valid email address.";
                      return emailTypoMessage(v) || true;
                    },
                  })}
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm text-zinc-950 placeholder-zinc-400 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-600">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
                  {...register("password", { required: "Password is required." })}
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-10 text-sm text-zinc-950 placeholder-zinc-400 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-500"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <div className="flex justify-end">
              <Link href={safeRedirect ? `/forgot-password?redirect=${encodeURIComponent(safeRedirect)}` : "/forgot-password"} className="text-xs font-semibold text-teal-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-60"
            >
              <LogIn size={15} />
              {loading ? "Signing in…" : "Sign In"}
            </button>

            <p className="text-center text-sm text-zinc-500">
              Don&apos;t have an account?{" "}
              <Link href={safeRedirect ? `/register?redirect=${encodeURIComponent(safeRedirect)}` : "/register"} className="font-bold text-teal-600 hover:underline">
                Create account
              </Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
