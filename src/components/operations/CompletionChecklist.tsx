"use client";

import { LuCircleAlert as AlertCircle, LuCircleCheckBig as CheckCircle2 } from "react-icons/lu";

export type ChecklistItem = {
  label: string;
  done: boolean;
};

export default function CompletionChecklist({ checks }: { checks: ChecklistItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {checks.map((check) => (
        <div
          key={check.label}
          className={`flex items-center gap-3 rounded-2xl border p-4 ${
            check.done ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
          }`}
        >
          {check.done ? (
            <CheckCircle2 size={20} className="flex-none text-emerald-600" />
          ) : (
            <AlertCircle size={20} className="flex-none text-amber-600" />
          )}
          <div>
            <p className={`text-xs font-bold uppercase ${check.done ? "text-emerald-700" : "text-amber-700"}`}>
              {check.label}
            </p>
            <p className="text-sm font-black text-dash-text">{check.done ? "Complete" : "Missing"}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
