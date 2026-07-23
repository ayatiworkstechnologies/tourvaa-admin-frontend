import { useEffect, useState } from "react";
import { LuX as X } from "react-icons/lu";

type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select";
  options?: { label: string; value: string }[];
};

type Props = {
  open?: boolean;
  title: string;
  fields?: Field[];
  saving?: boolean;
  submitLabel?: string;
  onClose: () => void;
  onSubmit?: (payload: Record<string, string | number>) => void;
  children?: React.ReactNode;
  initialValues?: Record<string, unknown>;

  // Backwards compatibility props
  isOpen?: boolean;
  onConfirm?: () => void;
  confirmLabel?: string;
  isLoading?: boolean;
};

export default function ActionModal({
  open,
  isOpen,
  title,
  fields = [],
  saving,
  isLoading,
  submitLabel = "Save",
  confirmLabel,
  onClose,
  onSubmit,
  onConfirm,
  children,
  initialValues,
}: Props) {
  const [form, setForm] = useState<Record<string, string>>({});
  const show = open ?? isOpen ?? false;
  const isSaving = saving ?? isLoading ?? false;
  const label = confirmLabel ?? submitLabel;

  useEffect(() => {
    if (show && initialValues) {
      const parsed: Record<string, string> = {};
      Object.entries(initialValues).forEach(([k, v]) => {
        parsed[k] = String(v ?? "");
      });
      setForm(parsed);
    } else if (!show) {
      setForm({});
    }
  }, [show, initialValues]);

  if (!show) return null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (onSubmit) {
      const payload = fields.reduce<Record<string, string | number>>((current, field) => {
        const value = form[field.name] ?? "";
        current[field.name] = field.type === "number" ? Number(value || 0) : value.trim();
        return current;
      }, {});
      onSubmit(payload);
    } else if (onConfirm) {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-3 sm:p-4">
      <form onSubmit={submit} className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-dash-text">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-dash-muted hover:bg-dash-bg">
            <X size={18} />
          </button>
        </div>
        
        {children ? children : (
          <div className="space-y-4">
            {fields.map((field) => (
              <label key={field.name} className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">{field.label}</span>
                {field.type === "textarea" ? (
                  <textarea value={form[field.name] || ""} onChange={(event) => setForm((prev) => ({ ...prev, [field.name]: event.target.value }))} className="min-h-28 w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
                ) : field.type === "select" ? (
                  <select value={form[field.name] || ""} onChange={(event) => setForm((prev) => ({ ...prev, [field.name]: event.target.value }))} className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand">
                    <option value="">Select</option>
                    {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                ) : (
                  <input type={field.type || "text"} value={form[field.name] || ""} onChange={(event) => setForm((prev) => ({ ...prev, [field.name]: event.target.value }))} className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
                )}
              </label>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="w-full rounded-xl border border-dash-border px-4 py-2 text-sm font-bold text-dash-muted hover:bg-dash-bg sm:w-auto">Cancel</button>
          <button disabled={isSaving} className="w-full rounded-xl bg-dash-brand px-5 py-2 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60 sm:w-auto">{isSaving ? "Saving..." : label}</button>
        </div>
      </form>
    </div>
  );
}
