"use client";

import { LuLock as Lock } from "react-icons/lu";
import { useRouter } from "next/navigation";

export default function AccessDenied() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-dash-bg px-4">
      <div className="w-full max-w-md rounded-2xl border border-dash-border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <Lock size={26} />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-dash-text">Access Denied</h1>
        <p className="mt-2 text-sm leading-6 text-dash-muted">
          Your current role does not have permission to open this page.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-dash-border px-4 py-2 text-sm font-bold text-dash-muted hover:bg-dash-bg"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/dashboard")}
            className="rounded-xl bg-dash-brand px-4 py-2 text-sm font-bold text-white hover:bg-dash-brand-hover"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

