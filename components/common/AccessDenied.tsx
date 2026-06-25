"use client";

import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AccessDenied() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#E7EAF0] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <Lock size={26} />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-[#121826]">Access Denied</h1>
        <p className="mt-2 text-sm leading-6 text-[#667085]">
          Your current role does not have permission to open this page.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-[#E7EAF0] px-4 py-2 text-sm font-bold text-[#667085] hover:bg-[#F7F9FC]"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/dashboard")}
            className="rounded-xl bg-[#43A9F6] px-4 py-2 text-sm font-bold text-white hover:bg-[#2F9FE9]"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

