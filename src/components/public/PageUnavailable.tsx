"use client";

import { LuCircleOff as CircleOff } from "react-icons/lu";
import Link from "next/link";

// Shown when a page's CMS hero block has is_active set to false (see CMS >
// Content & Pages / Partner Portal Pages editors). These pages fetch their
// content client-side, so this is a rendered fallback rather than a true
// server 404 - the page's own URL still returns 200.
export default function PageUnavailable() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center bg-[#FAFAFC] px-6 py-24 text-center text-slate-900">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <CircleOff size={28} />
      </span>
      <h1 className="mt-5 text-2xl font-black text-slate-950 font-heading">This page is currently unavailable</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Please check back later, or head back to the homepage.
      </p>
      <Link href="/" className="mt-6 inline-flex items-center rounded-xl bg-[#0B1F3A] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800">
        Back to Home
      </Link>
    </main>
  );
}
