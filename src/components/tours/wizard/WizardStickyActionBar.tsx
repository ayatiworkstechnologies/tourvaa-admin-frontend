"use client";

import { LuLoaderCircle as Loader2 } from "react-icons/lu";
import { type TourWorkspaceRole } from "@/components/tours/TourWorkspace";

export type WizardBarButton = {
  key: string;
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  variant: "ghost" | "secondary" | "primary";
  disabled?: boolean;
  loading?: boolean;
};

/** Sticky bottom action bar shared by every wizard step. Callers pass a
 * declarative button list so copy/actions can vary by mode (new tour, edit,
 * supplier vs admin, last step) without this component knowing about roles
 * or tour status. */
export function WizardStickyActionBar({
  role,
  left,
  right,
}: {
  role: TourWorkspaceRole;
  left: WizardBarButton[];
  right: WizardBarButton[];
}) {
  const isSupplier = role === "supplier";
  const primaryClass = isSupplier
    ? "bg-[#16833A] shadow-emerald-200 hover:bg-[#117331]"
    : "bg-dash-brand shadow-blue-200 hover:bg-dash-brand-hover";
  const secondaryHoverClass = isSupplier
    ? "hover:border-[#16833A]/30 hover:bg-[#F0F8F3] hover:text-[#123024]"
    : "hover:border-dash-brand/30 hover:bg-[#F4F8FD] hover:text-dash-text";

  const renderButton = (btn: WizardBarButton) => {
    const Icon = btn.icon;
    const base = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50";
    const variantClass =
      btn.variant === "primary"
        ? `text-white shadow-md hover:-translate-y-0.5 ${primaryClass}`
        : btn.variant === "secondary"
        ? `border border-dash-border bg-white text-dash-body ${secondaryHoverClass}`
        : "text-dash-subtle hover:text-dash-body";
    return (
      <button key={btn.key} type="button" onClick={btn.onClick} disabled={btn.disabled || btn.loading} className={`${base} ${variantClass}`}>
        {btn.loading ? <Loader2 size={15} className="animate-spin" /> : Icon ? <Icon size={15} /> : null}
        {btn.label}
      </button>
    );
  };

  return (
    <div className="sticky bottom-0 z-30 mt-6 -mx-1 border-t border-dash-border bg-white/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:rounded-2xl sm:border sm:shadow-[0_-8px_24px_-20px_rgba(24,76,140,.5)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">{left.map(renderButton)}</div>
        <div className="flex flex-wrap items-center gap-2">{right.map(renderButton)}</div>
      </div>
    </div>
  );
}
