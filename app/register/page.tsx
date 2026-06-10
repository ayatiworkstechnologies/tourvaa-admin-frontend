"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  UserPlus,
} from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthInput from "@/components/auth/AuthInput";
import api from "@/lib/api";

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || "Registration failed.";
  }

  return "Registration failed.";
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const update = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
  };

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    if (form.password !== form.confirmPassword) {
      setIsError(true);
      setMessage("Password and confirm password do not match.");
      setLoading(false);
      return;
    }

    try {
      await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      setMessage("Registered successfully. Please wait for admin approval.");
      setForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error: unknown) {
      setIsError(true);
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Create your Tourvaa account. Admin approval is required before login."
      badge="Registration"
    >
      <form onSubmit={register} className="space-y-4">
        <AuthInput
          label="Name"
          icon={User}
          placeholder="Your name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
        />

        <AuthInput
          label="Email Id"
          icon={Mail}
          type="email"
          placeholder="admin@tourvaa.com"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          required
        />

        <div className="relative">
          <AuthInput
            label="Password"
            icon={Lock}
            type={showPassword ? "text" : "password"}
            placeholder="Minimum 8 characters"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            required
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

        <div className="relative">
          <AuthInput
            label="Confirm Password"
            icon={Lock}
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Re-enter password"
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((value) => !value)}
            className="absolute bottom-3 right-3 text-gray-500 hover:text-[#009FE3]"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {message && (
          <p
            className={`rounded px-3 py-2 text-sm ${
              isError ? "bg-red-50 text-red-600" : "bg-sky-50 text-[#009FE3]"
            }`}
          >
            {message}
          </p>
        )}

        <div className="pt-2 text-center">
          <button
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-12 py-3.5 text-xs font-bold text-white shadow-lg shadow-sky-200 transition hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <UserPlus size={16} />
            {loading ? "PLEASE WAIT..." : "REGISTER"}
          </button>
        </div>

        <p className="text-center text-sm text-gray-700">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-black">
            Login Now
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
