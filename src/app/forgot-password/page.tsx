"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useForm } from "react-hook-form";
import { LuMail as Mail } from "react-icons/lu";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthInput from "@/components/auth/AuthInput";
import api from "@/lib/api/client";
import { normalizeEmail, validateEmail } from "@/lib/utils/validators";

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || "Unable to send reset email.";
  }

  return "Unable to send reset email.";
}

type ForgotPasswordFormValues = {
  email: string;
};

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    defaultValues: {
      email: "",
    },
  });

  const submit = async (values: ForgotPasswordFormValues) => {
    setMessage("");
    setError("");

    try {
      const response = await api.post("/auth/forgot-password", {
        ...values,
        email: normalizeEmail(values.email),
      });
      setMessage(response.data.message || "Reset link has been sent to your email.");
      reset({ email: "" });
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter your email and we will send a secure reset link."
      badge="Password recovery"
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-5">
        <AuthInput
          label="Email Id"
          icon={Mail}
          type="email"
          placeholder="you@company.com"
          {...register("email", {
            required: "Email is required.",
            validate: (value) => validateEmail(value) || "Enter a valid email address.",
          })}
        />
        {errors.email && (
          <p className="-mt-3 text-xs font-medium text-red-600">
            {errors.email.message}
          </p>
        )}

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
          disabled={isSubmitting}
          className="w-full rounded-lg bg-[#009FE3] px-12 py-3 text-xs font-bold text-white transition hover:bg-[#0086c2] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "SENDING..." : "SEND RESET LINK"}
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
