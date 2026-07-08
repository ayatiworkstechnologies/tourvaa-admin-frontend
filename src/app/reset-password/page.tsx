"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { LuEye as Eye, LuEyeOff as EyeOff, LuLock as Lock } from "react-icons/lu";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthInput from "@/components/auth/AuthInput";
import api from "@/lib/api/client";
import { passwordHelp, validatePassword } from "@/lib/utils/validators";

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || fallback;
  }

  return fallback;
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const validateToken = async () => {
      setCheckingToken(true);
      setError("");

      if (!token) {
        setTokenValid(false);
        setError("Reset token is missing.");
        setCheckingToken(false);
        return;
      }

      try {
        await api.get("/auth/reset-password/validate", {
          params: { token },
        });
        setTokenValid(true);
      } catch (err: unknown) {
        setTokenValid(false);
        setError(getErrorMessage(err, "Invalid or expired reset link."));
      } finally {
        setCheckingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    if (!token) {
      setError("Reset token is missing.");
      setLoading(false);
      return;
    }

    if (!tokenValid) {
      setError("Invalid or expired reset link.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setError(passwordHelp);
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/auth/reset-password", {
        token,
        password: password,
      });
      setMessage(response.data.message || "Password reset successfully.");
      setPassword("");
      setConfirmPassword("");
      setTokenValid(false);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to reset password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="New password"
      subtitle="Create a new password for your Tourvaa account."
      badge="Secure reset"
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="relative">
          <AuthInput
            label="New Password"
            icon={Lock}
            type={showPassword ? "text" : "password"}
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
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

        <AuthInput
          label="Confirm Password"
          icon={Lock}
          type={showPassword ? "text" : "password"}
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
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
        {checkingToken && (
          <p className="rounded bg-indigo-50 px-3 py-2 text-sm text-[#009FE3]">
            Checking reset link...
          </p>
        )}

        <button
          type="submit"
          disabled={loading || checkingToken || !tokenValid}
          className="w-full rounded-lg bg-[#009FE3] px-12 py-3 text-xs font-bold text-white transition hover:bg-[#0086c2] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "RESETTING..." : "RESET PASSWORD"}
        </button>

        <p className="text-center text-sm text-gray-700">
          Back to{" "}
          <Link href="/login" className="font-bold text-black">
            Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout
          title="New password"
          subtitle="Create a new password for your Tourvaa account."
          badge="Secure reset"
        >
          <p className="text-sm text-gray-500">Loading reset form...</p>
        </AuthLayout>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
