"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { LuCircleCheckBig as Check, LuEye as Eye, LuEyeOff as EyeOff, LuLock as Lock } from "react-icons/lu";
import api from "@/lib/api/client";
import { passwordHelp, validatePassword } from "@/lib/utils/validators";

function message(error: unknown) {
  return axios.isAxiosError(error)
    ? error.response?.data?.message || error.response?.data?.detail || "This verification link is invalid or expired."
    : "This verification link is invalid or expired.";
}

function VerifyEmailContent() {
  const router = useRouter();
  const token = useSearchParams().get("token") || "";
  const requestedRedirect = useSearchParams().get("redirect");
  const redirect = requestedRedirect?.startsWith("/") && !requestedRedirect.startsWith("//") ? requestedRedirect : null;
  const loginHref = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login";
  const [linkError, setLinkError] = useState("");
  const [formError, setFormError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!token) { setLinkError("Verification token is missing."); return; }
    api.get("/auth/verify-email/validate", { params: { token } })
      .catch((error) => setLinkError(message(error)));
  }, [token]);

  useEffect(() => {
    if (!complete) return;
    const timer = window.setTimeout(() => router.replace(loginHref), 2500);
    return () => window.clearTimeout(timer);
  }, [complete, loginHref, router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");
    if (!validatePassword(password)) return setFormError(passwordHelp);
    if (password !== confirm) return setFormError("Passwords do not match.");
    setSaving(true);
    try {
      await api.post("/auth/complete-registration", { token, password, confirm_password: confirm });
      setComplete(true);
    } catch (error) {
      const detail = message(error);
      if (/verification link|already been used|expired/i.test(detail)) setLinkError(detail);
      else setFormError(detail);
    } finally {
      setSaving(false);
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 pt-24">
    <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      {complete ? <div className="text-center">
        <Check className="mx-auto text-emerald-600" size={52} />
        <h1 className="mt-4 text-2xl font-black text-slate-950">Password created</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Your email is verified and your account is active. Redirecting you to sign in.</p>
        <Link href={loginHref} className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white">Go to sign in</Link>
      </div> : linkError ? <ErrorState text={linkError} /> : <form onSubmit={submit}>
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Lock size={22} /></span>
        <h1 className="mt-4 text-2xl font-black text-slate-950">Create your password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Use at least 8 characters with uppercase, lowercase, number, and special character.</p>
        <label htmlFor="new-password" className="mt-6 block text-xs font-bold text-slate-700">Password</label>
        <div className="relative mt-1.5"><input id="new-password" name="password" autoComplete="new-password" autoFocus type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-3 pr-10 text-sm outline-none focus:border-blue-600" /><button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="absolute right-3 top-3 text-slate-400">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
        <label htmlFor="confirm-password" className="mt-4 block text-xs font-bold text-slate-700">Confirm password</label>
        <input id="confirm-password" name="confirm-password" autoComplete="new-password" type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-600" />
        {formError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
        <button disabled={saving} className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? "Creating…" : "Create Password"}</button>
      </form>}
    </section>
  </main>;
}

function ErrorState({ text }: { text: string }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function resend(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setFeedback("");
    try {
      const response = await api.post("/auth/resend-verification", { email });
      setFeedback(response.data.message || "A new verification email has been sent.");
    } catch (error) {
      setFeedback(message(error));
    } finally {
      setSending(false);
    }
  }

  return <div className="text-center">
    <h1 className="text-xl font-black text-slate-950">Link unavailable</h1>
    <p className="mt-3 text-sm text-red-700">{text}</p>
    <form onSubmit={resend} className="mt-6">
      <label htmlFor="registration-email" className="block text-left text-xs font-bold text-slate-700">Supplier registration email</label>
      <input id="registration-email" name="email" autoComplete="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-600" />
      <button disabled={sending} className="mt-3 w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-60">{sending ? "Sending…" : "Send a new verification link"}</button>
    </form>
    {feedback && <p className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{feedback}</p>}
    <div className="mt-5 flex justify-center gap-4 text-sm font-bold"><Link href="/login" className="text-blue-600">Sign in</Link><Link href="/register" className="text-slate-600">Register</Link></div>
  </div>;
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<main className="min-h-screen bg-slate-50" />}><VerifyEmailContent /></Suspense>;
}
