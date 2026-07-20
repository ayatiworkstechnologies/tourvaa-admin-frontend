"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useForm, useWatch } from "react-hook-form";
import { LuCircleCheckBig as CheckCircle2, LuEye as Eye, LuEyeOff as EyeOff, LuLock as Lock, LuMail as Mail, LuUser as User, LuUserPlus as UserPlus } from "react-icons/lu";
import api from "@/lib/api/client";
import { normalizeEmail, passwordHelp, validateEmail, validatePassword } from "@/lib/utils/validators";

type FormValues = { name: string; email: string; password: string; confirmPassword: string };
type RoleOption = { id: number; name: string; slug: string };

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) return error.response?.data?.detail || "Registration failed.";
  return "Registration failed.";
}

export default function CustomerRegisterPage() {
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [customerRoleId, setCustomerRoleId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [redirect, setRedirect] = useState<string | null>(null);

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });
  const password = useWatch({ control, name: "password" });

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("redirect");
    setRedirect(requested?.startsWith("/") && !requested.startsWith("//") ? requested : null);
  }, []);

  useEffect(() => {
    let active = true;
    api.get("/roles/public/options")
      .then((r) => {
        const options = (r.data.data || []) as RoleOption[];
        const customer = options.find((o) => o.slug === "customer");
        if (active && customer) setCustomerRoleId(customer.id);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const onSubmit = async (values: FormValues) => {
    if (!customerRoleId) {
      setIsError(true);
      setMessage("Registration is temporarily unavailable. Please try again later.");
      return;
    }
    setMessage("");
    setIsError(false);
    try {
      await api.post("/auth/register", {
        name: values.name,
        email: normalizeEmail(values.email),
        role_id: customerRoleId,
        password: values.password,
      });
      setSuccess(true);
      reset();
    } catch (error: unknown) {
      setIsError(true);
      setMessage(getErrorMessage(error));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 pb-16 pt-32">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

          {success ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 size={48} className="text-emerald-500" />
              <h2 className="mt-4 text-xl font-bold text-zinc-950">Account created!</h2>
              <p className="mt-2 text-sm text-zinc-500">Your account has been created successfully. You can now sign in.</p>
              <Link
                href={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login"}
                className="mt-6 flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white hover:bg-teal-700"
              >
                Sign In Now
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <UserPlus size={22} />
                </span>
                <h1 className="mt-3 text-xl font-bold text-zinc-950">Create your account</h1>
                <p className="mt-1 text-sm text-zinc-500">Join Tourvaa as a traveller - free forever</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-600">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      placeholder="Your full name"
                      {...register("name", { required: "Name is required." })}
                      className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm text-zinc-950 placeholder-zinc-400 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-600">Email address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      {...register("email", {
                        required: "Email is required.",
                        validate: (v) => validateEmail(v) || "Enter a valid email address.",
                      })}
                      className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm text-zinc-950 placeholder-zinc-400 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-600">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Minimum 8 characters"
                      {...register("password", {
                        required: "Password is required.",
                        minLength: { value: 8, message: "Minimum 8 characters." },
                        validate: (v) => validatePassword(v) || passwordHelp,
                      })}
                      className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-10 text-sm text-zinc-950 placeholder-zinc-400 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-500" aria-label="Toggle password">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-600">Confirm Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Re-enter password"
                      {...register("confirmPassword", {
                        required: "Please confirm your password.",
                        validate: (v) => v === password || "Passwords do not match.",
                      })}
                      className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-10 text-sm text-zinc-950 placeholder-zinc-400 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-500" aria-label="Toggle confirm password">
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
                </div>

                {message && (
                  <div className={`rounded-xl px-4 py-3 text-sm ${isError ? "bg-red-50 text-red-600" : "bg-teal-50 text-teal-600"}`}>
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-60"
                >
                  <UserPlus size={15} />
                  {isSubmitting ? "Creating account…" : "Create Account"}
                </button>

                <p className="text-center text-sm text-zinc-500">
                  Already have an account?{" "}
                  <Link href={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login"} className="font-bold text-teal-600 hover:underline">Sign in</Link>
                </p>
                <p className="text-center text-xs text-zinc-400">
                  Are you a supplier or agent?{" "}
                  <Link href="/join/supplier" className="font-semibold text-teal-600 hover:underline">Join as Supplier</Link>
                  {" · "}
                  <Link href="/join/agent" className="font-semibold text-teal-600 hover:underline">Join as Agent</Link>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
