"use client";

import { LuCircleAlert as AlertCircle } from "react-icons/lu";
import type { FieldErrors } from "@/lib/tours/tourValidation";

/** Shared look for the tour editor's item forms (highlights, itinerary days, add-ons,
 * pricing slabs, discounts, ...): the label always says whether a field is required,
 * a hint explains what to enter, and the error appears right under the field. */

export function fieldClass(error?: string) {
  return `w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-4 ${
    error
      ? "border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-100"
      : "border-dash-border bg-white focus:border-dash-brand focus:ring-dash-brand/10"
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
      <div className="mb-1 flex items-end justify-between gap-2">
        <label htmlFor={name} className="text-xs font-bold uppercase text-dash-subtle">
          {label}
          {required ? <span className="ml-1 text-red-500" aria-hidden="true">*</span> : <span className="ml-1 font-medium normal-case text-dash-muted">(optional)</span>}
        </label>
        {counter && (
          <span className={`text-[11px] font-semibold ${counter.value > counter.max ? "text-red-600" : "text-dash-muted"}`}>
            {counter.value}/{counter.max}
          </span>
        )}
      </div>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold text-red-600">
          <AlertCircle size={13} className="mt-px shrink-0" />
          <span>{error}</span>
        </p>
      ) : (
        hint && <p className="mt-1 text-[11px] text-dash-muted">{hint}</p>
      )}
    </div>
  );
}

/** Top-of-form summary shown after a failed save attempt; each item jumps to its field. */
export function ErrorSummary({ errors }: { errors: FieldErrors }) {
  const entries = Object.entries(errors);
  if (entries.length === 0) return null;
  return (
    <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3">
      <p className="flex items-center gap-2 text-sm font-bold text-red-700">
        <AlertCircle size={15} /> Please fix {entries.length} field{entries.length === 1 ? "" : "s"} before saving:
      </p>
      <ul className="mt-1.5 space-y-0.5 pl-6 text-xs text-red-700">
        {entries.map(([field, message]) => (
          <li key={field} className="list-disc">
            <button type="button" className="text-left underline-offset-2 hover:underline" onClick={() => focusField(field)}>
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
