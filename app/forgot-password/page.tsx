"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Mail } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthInput from "@/components/auth/AuthInput";
import api from "@/lib/api";

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || "Unable to send reset email.";
  }

  return "Unable to send reset email.";
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await api.post("/auth/forgot-password", { email });
      setMessage(response.data.message || "Reset link has been sent to your email.");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter your email and we will send a secure reset link."
      badge="Password recovery"
    >
      <form onSubmit={submit} className="space-y-5">
        <AuthInput
          label="Email Id"
          icon={Mail}
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        {message && (
          <p className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          disabled={loading}
          className="w-full rounded-lg bg-[#009FE3] px-12 py-3 text-xs font-bold text-white transition hover:bg-[#0086c2] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "SENDING..." : "SEND RESET LINK"}
        </button>

        <p className="text-center text-sm text-gray-700">
          Remember password?{" "}
          <Link href="/login" className="font-bold text-black">
            Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
