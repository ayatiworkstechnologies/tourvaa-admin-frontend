"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useForm, useWatch } from "react-hook-form";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User,
  UserPlus,
} from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthInput from "@/components/auth/AuthInput";
import api from "@/lib/api";
import {
  combinePhone,
  digitsOnly,
  mobileHelp,
  normalizeEmail,
  passwordHelp,
  validateEmail,
  validateMobile,
  validatePassword,
} from "@/lib/validators";
import { phoneCountryCodes } from "@/lib/location-options";

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || "Registration failed.";
  }

  return "Registration failed.";
}

type RegisterFormValues = {
  name: string;
  email: string;
  phone_country_code: string;
  phone_number: string;
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
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      name: "",
      email: "",
      phone_country_code: "+91",
      phone_number: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = useWatch({ control, name: "password" });
  const phoneCountryCode = useWatch({ control, name: "phone_country_code" });

  const onSubmit = async (values: RegisterFormValues) => {
    setMessage("");
    setIsError(false);

    try {
      await api.post("/auth/register", {
        name: values.name,
        email: normalizeEmail(values.email),
        phone: values.phone_number ? combinePhone(values.phone_country_code, values.phone_number) : "",
        password: values.password,
      });

      setMessage("Registered successfully. Please wait for admin approval.");
      reset({
        name: "",
        email: "",
        phone_country_code: "+91",
        phone_number: "",
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
            validate: (value) => validateEmail(value) || "Enter a valid email address.",
          })}
        />
        {errors.email && (
          <p className="-mt-2 text-xs font-medium text-red-600">
            {errors.email.message}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-[170px_1fr]">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-600">
              Country Code
            </span>
            <select
              {...register("phone_country_code")}
              className="h-[46px] w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#009FE3] focus:ring-2 focus:ring-sky-100"
            >
              {phoneCountryCodes.map((item, index) => (
                <option key={`${item.value}-${index}`} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <AuthInput
            label="Mobile Number"
            icon={Phone}
            type="tel"
            placeholder="9876543210"
            autoComplete="tel-national"
            inputMode="numeric"
            {...register("phone_number", {
              validate: (value) =>
                !value || validateMobile(combinePhone(phoneCountryCode, value)) || mobileHelp,
              onChange: (event) =>
                setValue("phone_number", digitsOnly(event.target.value), {
                  shouldValidate: true,
                }),
            })}
          />
        </div>
        {errors.phone_number && (
          <p className="-mt-2 text-xs font-medium text-red-600">
            {errors.phone_number.message}
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
