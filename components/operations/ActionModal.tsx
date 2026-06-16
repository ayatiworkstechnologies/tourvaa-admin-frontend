"use client";

import { useState } from "react";
import { X } from "lucide-react";

type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select";
  options?: { label: string; value: string }[];
};

type Props = {
  open: boolean;
  title: string;
  fields: Field[];
  saving?: boolean;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (payload: Record<string, string | number>) => void;
};

export default function ActionModal({ open, title, fields, saving, submitLabel = "Save", onClose, onSubmit }: Props) {
  const [form, setForm] = useState<Record<string, string>>({});
  if (!open) return null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = fields.reduce<Record<string, string | number>>((current, field) => {
      const value = form[field.name] ?? "";
      current[field.name] = field.type === "number" ? Number(value || 0) : value.trim();
      return current;
    }, {});
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#121826]">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#667085] hover:bg-[#F7F9FC]">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4">
          {fields.map((field) => (
            <label key={field.name} className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">{field.label}</span>
              {field.type === "textarea" ? (
                <textarea value={form[field.name] || ""} onChange={(event) => setForm((prev) => ({ ...prev, [field.name]: event.target.value }))} className="min-h-28 w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]" />
              ) : field.type === "select" ? (
                <select value={form[field.name] || ""} onChange={(event) => setForm((prev) => ({ ...prev, [field.name]: event.target.value }))} className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]">
                  <option value="">Select</option>
                  {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              ) : (
                <input type={field.type || "text"} value={form[field.name] || ""} onChange={(event) => setForm((prev) => ({ ...prev, [field.name]: event.target.value }))} className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]" />
              )}
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-[#E7EAF0] px-4 py-2 text-sm font-bold text-[#667085] hover:bg-[#F7F9FC]">Cancel</button>
          <button disabled={saving} className="rounded-xl bg-[#43A9F6] px-5 py-2 text-sm font-bold text-white hover:bg-[#2F9FE9] disabled:opacity-60">{saving ? "Saving..." : submitLabel}</button>
        </div>
      </form>
    </div>
  );
}
