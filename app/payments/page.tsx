"use client";

import { CreditCard } from "lucide-react";
import ModuleWrapper from "@/components/common/ModuleWrapper";

export default function PaymentsPage() {
  return (
    <ModuleWrapper title="Payments" requiredPermission="payments.view">
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#E7F5FF]">
            <CreditCard size={36} className="text-[#238DD7]" />
          </div>

          <span className="inline-block rounded-full bg-amber-100 px-4 py-1 text-xs font-bold uppercase tracking-widest text-amber-700">
            Coming Soon
          </span>

          <h1 className="mt-4 text-3xl font-bold text-[#121826]">
            Payments & Transactions
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#667085]">
            Monitor revenue, process refunds, and review transaction history. This module is under active development and will be available soon.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Transaction Logs", desc: "Full payment history" },
              { label: "Refund Management", desc: "Process & track refunds" },
              { label: "Revenue Reports", desc: "Earnings & payout overview" },
            ].map(({ label, desc }) => (
              <div key={label} className="rounded-2xl border border-[#E7EAF0] bg-white p-4">
                <p className="text-sm font-bold text-[#121826]">{label}</p>
                <p className="mt-1 text-xs text-[#667085]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModuleWrapper>
  );
}
