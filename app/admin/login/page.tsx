"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { LuEye as Eye, LuEyeOff as EyeOff, LuLock as Lock, LuLogIn as LogIn, LuMail as Mail, LuShieldCheck as ShieldCheck } from "react-icons/lu";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthInput from "@/components/auth/AuthInput";
import { useAuth } from "@/hooks/useAuth";
import { normalizeEmail, validateEmail } from "@/lib/validators";

type LoginFormValues = { email: string; password: string };

export default function AdminLoginPage() {
  const { login, loading, error, isLoggedIn, sessionLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginFormValues) => {
    login({ ...values, email: normalizeEmail(values.email) });
  };

  if (!sessionLoading && isLoggedIn) return null;

  return (
    <AuthLayout
      title="Admin Login"
      subtitle="Sign in with your admin, supplier, or agent credentials."
      badge="Secure login"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <AuthInput
          label="Email Id"
          icon={Mail}
          type="email"
          placeholder="Enter email address"
          autoComplete="email"
          {...register("email", {
            required: "Email is required.",
            validate: (v) => validateEmail(v) || "Enter a valid email address.",
          })}
        />
        {errors.email && <p className="-mt-3 text-xs font-medium text-red-600">{errors.email.message}</p>}

        <div className="relative">
          <AuthInput
            label="Password"
            icon={Lock}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            autoComplete="current-password"
            {...register("password", { required: "Password is required." })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute bottom-3 right-3 text-gray-500 hover:text-[#43A9F6]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="-mt-3 text-xs font-medium text-red-600">{errors.password.message}</p>}

        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-xs text-slate-600">
          <span className="flex items-center gap-2 font-semibold">
            <ShieldCheck size={15} className="text-emerald-600" />
            Menus load from your role permissions
          </span>
          <Link href="/forgot-password" className="text-xs text-gray-400">Forgot password?</Link>
        </div>

        {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="pt-2 text-center">
          <button
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#43A9F6] px-12 py-3.5 text-xs font-bold text-white shadow-lg shadow-sky-200 transition hover:bg-[#2F9FE9] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LogIn size={16} />
            {loading ? "PLEASE WAIT..." : "LOGIN"}
          </button>
        </div>

        <p className="pt-2 text-center text-sm text-gray-700">
          Customer?{" "}
          <Link href="/login" className="font-bold text-[#43A9F6]">Customer login →</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
