"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useForm, useWatch } from "react-hook-form";
import {
  BadgeCheck,
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
import {
  normalizeEmail,
  passwordHelp,
  validateEmail,
  validatePassword,
} from "@/lib/validators";

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || "Registration failed.";
  }

  return "Registration failed.";
}

type RegisterFormValues = {
  name: string;
  email: string;
  role_id: string;
  password: string;
  confirmPassword: string;
};

type RoleOption = {
  id: number;
  name: string;
  slug: "customer" | "supplier" | "agent-reseller";
};

const roleLabel: Record<RoleOption["slug"], string> = {
  customer: "Customer",
  supplier: "Supplier",
  "agent-reseller": "Agent / Reseller",
};

export default function RegisterPage() {
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      name: "",
      email: "",
      role_id: "",
      password: "",
      confirmPassword: "",
    },
  });
  const password = useWatch({ control, name: "password" });

  useEffect(() => {
    let active = true;

    const fetchRoles = async () => {
      try {
        const response = await api.get("/roles/public/options");
        const options = (response.data.data || []) as RoleOption[];
        if (active) setRoles(options);
      } catch {
        if (active) setRoles([]);
      }
    };

    fetchRoles();

    return () => {
      active = false;
    };
  }, []);

  const onSubmit = async (values: RegisterFormValues) => {
    setMessage("");
    setIsError(false);
    const selectedRole = roles.find((role) => role.id === Number(values.role_id));

    try {
      await api.post("/auth/register", {
        name: values.name,
        email: normalizeEmail(values.email),
        role_id: Number(values.role_id),
        password: values.password,
      });

      setMessage(
        selectedRole?.slug === "customer"
          ? "Registered successfully. You can log in now."
          : "Registered successfully. Please wait for admin approval."
      );
      reset({
        name: "",
        email: "",
        role_id: "",
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
      subtitle="Create your Tourvaa account. Supplier and agent accounts require admin approval before login."
      badge="Registration"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-[#009FE3]">
            Account Type
          </span>
          <div className="flex items-center gap-3 rounded-xl border border-[#D7E8F5] bg-white px-3 py-3 shadow-sm transition focus-within:border-[#43A9F6] focus-within:ring-4 focus-within:ring-sky-100">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E7F5FF] text-[#238DD7]">
              <BadgeCheck size={16} />
            </span>
            <select
              {...register("role_id", {
                required: "Account type is required.",
              })}
              className="w-full bg-transparent text-sm font-medium text-[#121826] outline-none"
            >
              <option value="">Select account type</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {roleLabel[role.slug] || role.name}
                </option>
              ))}
            </select>
          </div>
        </label>
        {errors.role_id && (
          <p className="-mt-2 text-xs font-medium text-red-600">
            {errors.role_id.message}
          </p>
        )}

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
            validate: (value) => validateEmail(value) || "Enter a valid email address.",
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
              validate: (value) => validatePassword(value) || passwordHelp,
            })}
            autoComplete="new-password"
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
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((value) => !value)}
            className="absolute bottom-3 right-3 text-gray-500 hover:text-[#009FE3]"
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
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
