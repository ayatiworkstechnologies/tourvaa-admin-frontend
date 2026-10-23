"use client";

import { LuCircleAlert as AlertCircle } from "react-icons/lu";
import type { FieldErrors } from "@/lib/tours/tourValidation";

/** Shared modern look for the tour editor's item forms (highlights, itinerary days, add-ons,
 * pricing slabs, discounts, ...): the label always says whether a field is required,
 * a hint explains what to enter, and the error appears right under the field. */

export function fieldClass(error?: string) {
  return `w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all shadow-2xs font-medium ${
    error
      ? "border-red-400 bg-red-50/30 text-slate-900 focus:border-red-500 focus:ring-4 focus:ring-red-100"
      : "border-slate-200/90 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 hover:border-slate-300 hover:bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
  }`;
}

export function FormField({
  name,
  label,
  required = false,
  hint,
  error,
  counter,
  className = "",
  children,
}: {
  /** Matches the input's name/id so the error summary can jump to it. */
  name: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  /** e.g. { value: title.length, max: 60 } shows "12/60". */
  counter?: { value: number; max: number };
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className} data-field={name}>
      <div className="mb-1.5 flex items-end justify-between gap-2">
        <label htmlFor={name} className="text-xs font-bold text-slate-700">
          {label}
          {required ? (
            <span className="ml-1 text-rose-500 font-bold" aria-hidden="true">*</span>
          ) : (
            <span className="ml-1 text-[11px] font-normal text-slate-400">(optional)</span>
          )}
        </label>
        {counter && (
          <span className={`text-[11px] font-semibold tabular-nums ${counter.value > counter.max ? "text-rose-600 font-bold" : "text-slate-400"}`}>
            {counter.value}/{counter.max}
          </span>
        )}
      </div>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold text-rose-600 animate-in fade-in duration-150">
          <AlertCircle size={13} className="mt-0.5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </p>
      ) : (
        hint && <p className="mt-1.5 text-[11.5px] text-slate-500 leading-relaxed">{hint}</p>
      )}
    </div>
  );
}

/** Top-of-form summary shown after a failed save attempt; each item jumps to its field. */
export function ErrorSummary({ errors }: { errors: FieldErrors }) {
  const entries = Object.entries(errors);
  if (entries.length === 0) return null;
  return (
    <div role="alert" className="mb-4 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 shadow-2xs animate-in fade-in duration-200">
      <p className="flex items-center gap-2 text-sm font-bold text-rose-800">
        <AlertCircle size={16} className="text-rose-600 shrink-0" />
        Please fix {entries.length} field{entries.length === 1 ? "" : "s"} before saving:
      </p>
      <ul className="mt-2 space-y-1 pl-6 text-xs font-medium text-rose-700">
        {entries.map(([field, message]) => (
          <li key={field} className="list-disc">
            <button
              type="button"
              className="text-left underline-offset-2 hover:underline hover:text-rose-900 transition font-semibold"
              onClick={() => focusField(field)}
            >
              {message}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function focusField(field: string) {
  const el = document.querySelector<HTMLElement>(`[data-field="${field}"] input, [data-field="${field}"] select, [data-field="${field}"] textarea`);
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
  el?.focus();
}
