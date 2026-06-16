"use client";

import { KeyRound, Lock, Unlock } from "lucide-react";

import { Customer } from "@/lib/services/customerService";

type Props = {
  customer: Customer;
  saving?: boolean;
  canBlock?: boolean;
  canUnblock?: boolean;
  canReset?: boolean;
  onBlock: () => void;
  onUnblock: () => void;
  onReset: () => void;
};

export default function CustomerActionButtons({
  customer,
  saving = false,
  canBlock = false,
  canUnblock = false,
  canReset = false,
  onBlock,
  onUnblock,
  onReset,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {canReset && (
        <button
          type="button"
          disabled={saving}
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm font-bold text-[#121826] hover:bg-[#F7F9FC] disabled:opacity-60"
        >
          <KeyRound size={16} />
          Reset Password
        </button>
      )}

      {customer.is_blocked
        ? canUnblock && (
            <button
              type="button"
              disabled={saving}
              onClick={onUnblock}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <Unlock size={16} />
              Unblock
            </button>
          )
        : canBlock && (
            <button
              type="button"
              disabled={saving}
              onClick={onBlock}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
            >
              <Lock size={16} />
              Block
            </button>
          )}
    </div>
  );
}
