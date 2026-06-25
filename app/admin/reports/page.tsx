"use client";

import { useEffect, useState } from "react";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import Loader from "@/components/ui/Loader";
import { getReportSnapshot, ReportSnapshot } from "@/lib/services/reportService";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatRevenue(raw: number): string {
  if (raw >= 10_000_000) return `₹${(raw / 10_000_000).toFixed(1)}Cr`;
  if (raw >= 100_000)    return `₹${(raw / 100_000).toFixed(1)}L`;
  if (raw >= 1_000)      return `₹${(raw / 1_000).toFixed(1)}K`;
  return `₹${raw.toFixed(0)}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).replace(",", "");
}

function changeBadge(pct: number) {
  if (pct === 0) return null;
  const positive = pct > 0;
  return (
    <span className={`text-sm font-medium ${positive ? "text-[#17B26A]" : "text-[#F04438]"}`}>
      {positive ? "+" : ""}{pct}%
    </span>
  );
}

// ─── status badge ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "ready" | "review" }) {
  return status === "ready" ? (
    <span className="rounded-full bg-[#ECFDF3] px-2 py-0.5 text-xs font-semibold text-[#027A48]">ready</span>
  ) : (
    <span className="rounded-full bg-[#FFFAEB] px-2 py-0.5 text-xs font-semibold text-[#B54708]">review</span>
  );
}

// ─── snapshot card ────────────────────────────────────────────────────────

interface SnapshotCardProps {
  title: string;
  status: "ready" | "review";
  value: React.ReactNode;
  sub: React.ReactNode;
}

function SnapshotCard({ title, status, value, sub }: SnapshotCardProps) {
  return (
    <div className="rounded-xl border border-[#E7EAF0] bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#344054]">{title}</span>
        <StatusBadge status={status} />
      </div>
      <p className="mt-3 text-3xl font-bold text-[#175CD3]">{value}</p>
      <p className="mt-1 text-sm text-[#667085]">{sub}</p>
    </div>
  );
}

// ─── format badge (XLSX / PDF / CSV) ─────────────────────────────────────

const FORMAT_COLORS: Record<string, string> = {
  XLSX: "bg-[#E6F4EA] text-[#1E7E34]",
  PDF:  "bg-[#FDE8E8] text-[#C81E1E]",
  CSV:  "bg-[#EEF4FF] text-[#3538CD]",
};

function FormatBadge({ format }: { format: string }) {
  const cls = FORMAT_COLORS[format] ?? "bg-[#F2F4F7] text-[#344054]";
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-bold ${cls}`}>{format}</span>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [data, setData] = useState<ReportSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    getReportSnapshot()
      .then((d) => { if (active) { setData(d); setError(""); } })
      .catch(() => { if (active) setError("Could not load report snapshot."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <ModuleWrapper title="Reports" requiredPermission="reports.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#121826]">Reports</h1>
          <p className="text-sm text-[#667085]">Live analytics across bookings, revenue, suppliers and agents.</p>
        </div>

        {loading && <Loader label="Loading reports..." />}
        {error   && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && data && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">

            {/* ── Left: Snapshot cards ── */}
            <div className="rounded-2xl border border-[#E7EAF0] bg-white p-6">
              <div className="mb-5 flex items-center gap-2">
                <span className="text-base font-bold text-[#121826]">📈 Reports Snapshot</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                <SnapshotCard
                  title="Booking Performance"
                  status="ready"
                  value={data.booking_performance.total}
                  sub={changeBadge(data.booking_performance.change_pct) ?? "No change this month"}
                />

                <SnapshotCard
                  title="Revenue Summary"
                  status="ready"
                  value={formatRevenue(data.revenue_summary.total_raw)}
                  sub={changeBadge(data.revenue_summary.change_pct) ?? "No change this month"}
                />

                <SnapshotCard
                  title="Supplier Approval"
                  status={data.supplier_approval.pending > 0 ? "review" : "ready"}
                  value={data.supplier_approval.total}
                  sub={
                    data.supplier_approval.pending > 0
                      ? `${data.supplier_approval.pending} pending`
                      : "All approved"
                  }
                />

                <SnapshotCard
                  title="Agent Sales"
                  status="ready"
                  value={data.agent_sales.total}
                  sub={changeBadge(data.agent_sales.change_pct) ?? "No change this month"}
                />

                <SnapshotCard
                  title="Payment Collection"
                  status={data.payment_collection.pending_pct > 5 ? "review" : "ready"}
                  value={`${data.payment_collection.collected_pct}%`}
                  sub={
                    data.payment_collection.pending_pct > 0
                      ? `${data.payment_collection.pending_pct}% pending`
                      : "Fully collected"
                  }
                />

                <SnapshotCard
                  title="Country-wise Bookings"
                  status="ready"
                  value={data.country_wise.country_count}
                  sub="countries"
                />

              </div>
            </div>

            {/* ── Right: Stats + Recent Exports ── */}
            <div className="flex flex-col gap-4">

              {/* Stats strip */}
              <div className="flex divide-x divide-[#E7EAF0] rounded-2xl border border-[#E7EAF0] bg-white">
                {[
                  { label: "Reports",   value: data.meta.report_types },
                  { label: "Scheduled", value: data.meta.scheduled },
                  { label: "Exports",   value: data.meta.total_exports },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-1 flex-col items-center py-4">
                    <span className="text-2xl font-bold text-[#121826]">{value}</span>
                    <span className="mt-0.5 text-xs text-[#667085]">{label}</span>
                  </div>
                ))}
              </div>

              {/* Recent Exports */}
              <div className="flex-1 rounded-2xl border border-[#E7EAF0] bg-white p-5">
                <h3 className="mb-4 text-sm font-bold text-[#121826]">Recent Exports</h3>

                {data.recent_exports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <p className="text-sm text-[#667085]">No exports yet.</p>
                    <p className="mt-1 text-xs text-[#98A2B3]">
                      Run a report export and it will appear here.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {data.recent_exports.map((ex) => (
                      <li key={ex.id} className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#344054]">{ex.label}</p>
                          <p className="text-xs text-[#98A2B3]">{formatDate(ex.exported_at)}</p>
                        </div>
                        <FormatBadge format={ex.format} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </ModuleWrapper>
  );
}
