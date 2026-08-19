"use client";

import { LuPrinter as Printer } from "react-icons/lu";

/** Prints the current page via the browser's native print dialog. Elements
 * marked with the `print:hidden` Tailwind variant (filters, tabs, nav) are
 * hidden automatically by the browser's `@media print` stylesheet. */
export default function PrintButton({ label }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      title={label ? `Print ${label}` : "Print"}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-dash-border px-5 py-2.5 text-sm font-bold text-dash-body transition hover:-translate-y-0.5 hover:bg-dash-bg"
    >
      <Printer size={16} />
      Print
    </button>
  );
}
