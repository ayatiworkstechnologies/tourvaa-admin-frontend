"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Lock, LogIn, Mail } from "lucide-react";
import api from "@/lib/api";
import { getDashboardPath } from "@/lib/dashboardPath";
import { getApiErrorMessage } from "@/lib/error-handler";
import { normalizeEmail, validateEmail } from "@/lib/validators";
import { useAuthContext } from "@/providers/AuthProvider";

type FormValues = { email: string; password: string };

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") ?? null;
  const { loginWithToken, isLoggedIn, loading: sessionLoading, dashboard } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: { email: "", password: "" },
  });

  // Already logged in — redirect to the right dashboard
  useEffect(() => {
    if (!sessionLoading && isLoggedIn) {
      const roleSlug = dashboard?.user?.role?.slug ?? "";
      router.replace(getDashboardPath(roleSlug));
    }
  }, [sessionLoading, isLoggedIn, dashboard, router]);

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
      const dest = (roleSlug === "customer" && redirect && redirect.startsWith("/"))
        ? redirect
        : getDashboardPath(roleSlug);
      router.push(dest);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!sessionLoading && isLoggedIn) return null;

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#F7F9FC] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#E7F5FF] text-[#0284C7]">
              <LogIn size={22} />
            </span>
            <h1 className="mt-3 text-xl font-bold text-[#0F172A]">Welcome back</h1>
            <p className="mt-1 text-sm text-[#667085]">Sign in to your Tourvaa account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#344054]">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register("email", {
                    required: "Email is required.",
                    validate: (v) => validateEmail(v) || "Enter a valid email address.",
                  })}
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm text-[#0F172A] placeholder-[#98A2B3] outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-100"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#344054]">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
                  {...register("password", { required: "Password is required." })}
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-10 text-sm text-[#0F172A] placeholder-[#98A2B3] outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#667085]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs font-semibold text-[#0284C7] hover:underline">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0284C7] py-3 text-sm font-bold text-white transition hover:bg-[#0369A1] disabled:opacity-60"
            >
              <LogIn size={15} />
              {loading ? "Signing in…" : "Sign In"}
            </button>

            <p className="text-center text-sm text-[#667085]">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-bold text-[#0284C7] hover:underline">
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
