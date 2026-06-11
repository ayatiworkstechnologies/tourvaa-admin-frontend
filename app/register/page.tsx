"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useForm } from "react-hook-form";
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

type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterPage() {
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  const onSubmit = async (values: RegisterFormValues) => {
    setMessage("");
    setIsError(false);

    try {
      await api.post("/auth/register", {
        name: values.name,
        email: values.email,
        password: values.password,
      });

      setMessage("Registered successfully. Please wait for admin approval.");
      reset({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error: unknown) {
      setIsError(true);
      setMessage(getErrorMessage(error));
    }
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Create your Tourvaa account. Admin approval is required before login."
      badge="Registration"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <AuthInput
          label="Name"
          icon={User}
          placeholder="Your name"
          {...register("name", {
            required: "Name is required.",
          })}
        />
        {errors.name && (
          <p className="-mt-2 text-xs font-medium text-red-600">
            {errors.name.message}
          </p>
        )}

        <AuthInput
          label="Email Id"
          icon={Mail}
          type="email"
          placeholder="Enter email address"
          {...register("email", {
            required: "Email is required.",
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: "Enter a valid email address.",
            },
          })}
        />
        {errors.email && (
          <p className="-mt-2 text-xs font-medium text-red-600">
            {errors.email.message}
          </p>
        )}

        <div className="relative">
          <AuthInput
            label="Password"
            icon={Lock}
            type={showPassword ? "text" : "password"}
            placeholder="Minimum 8 characters"
            {...register("password", {
              required: "Password is required.",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters.",
              },
            })}
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
        {errors.password && (
          <p className="-mt-2 text-xs font-medium text-red-600">
            {errors.password.message}
          </p>
        )}

        <div className="relative">
          <AuthInput
            label="Confirm Password"
            icon={Lock}
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Re-enter password"
            {...register("confirmPassword", {
              required: "Confirm password is required.",
              validate: (value) =>
                value === password || "Password and confirm password do not match.",
            })}
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
        {errors.confirmPassword && (
          <p className="-mt-2 text-xs font-medium text-red-600">
            {errors.confirmPassword.message}
          </p>
        )}

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
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-12 py-3.5 text-xs font-bold text-white shadow-lg shadow-sky-200 transition hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <UserPlus size={16} />
            {isSubmitting ? "PLEASE WAIT..." : "REGISTER"}
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
