"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock, LogIn, Mail, ShieldCheck } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthInput from "@/components/auth/AuthInput";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { login, loading, error } = useAuth();

  const [email, setEmail] = useState("admin@tourvaa.com");
  const [password, setPassword] = useState("Admin@123");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to open the dashboard that matches your assigned backend role."
      badge="Secure login"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput
          label="Email Id"
          icon={Mail}
          type="email"
          placeholder="admin@tourvaa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="relative">
          <AuthInput
            label="Password"
            icon={Lock}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute bottom-3 right-3 text-gray-500 hover:text-[#009FE3]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-xs text-slate-600">
          <span className="flex items-center gap-2 font-semibold">
            <ShieldCheck size={15} className="text-emerald-600" />
            Menus load from your role permissions
          </span>
          <Link href="/forgot-password" className="text-xs text-gray-400">
            Forgot password?
          </Link>
        </div>

        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="pt-2 text-center">
          <button
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-12 py-3.5 text-xs font-bold text-white shadow-lg shadow-sky-200 transition hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LogIn size={16} />
            {loading ? "PLEASE WAIT..." : "LOGIN"}
          </button>
        </div>

        <p className="pt-2 text-center text-sm text-gray-700">
          Do not have an account?{" "}
          <Link href="/register" className="font-bold text-black">
            Register Now
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
