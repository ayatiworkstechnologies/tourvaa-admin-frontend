"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, FileText, RefreshCw, TrendingUp } from "lucide-react";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import Loader from "@/components/ui/Loader";
import api from "@/lib/api";

type ReportsSummary = {
  total_reports: number;
  scheduled_reports: number;
  exported_reports: number;
  report_cards: Array<{
    name: string;
    value: string;
    change: string;
    status: "ready" | "review";
  }>;
  recent_exports: Array<{
    id: number;
    name: string;
    format: string;
    generated_at: string;
  }>;
};

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/dashboard/reports");
      setReports(response.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchReports();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchReports]);

  return (
    <ModuleWrapper title="Reports" requiredPermission="reports.view">
      {loading ? (
        <Loader label="Loading reports..." />
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#E7EAF0] bg-white p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E7F5FF] text-[#238DD7]">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#121826]">
                    Reports
                  </h2>
                  <p className="mt-1 text-sm text-[#667085]">
                    Dummy report center for dashboard and admin review.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void fetchReports()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm font-bold text-[#121826] hover:bg-[#F7F9FC]"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {[
              ["Total Reports", reports?.total_reports || 0],
              ["Scheduled", reports?.scheduled_reports || 0],
              ["Exports", reports?.exported_reports || 0],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-[#E7EAF0] bg-white p-5">
                <p className="text-sm font-semibold text-[#667085]">{label}</p>
                <p className="mt-2 text-3xl font-bold text-[#121826]">{value}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-2xl border border-[#E7EAF0] bg-white p-6">
              <div className="mb-5 flex items-center gap-3">
                <TrendingUp className="text-[#238DD7]" size={20} />
                <h3 className="text-lg font-bold text-[#121826]">Report Cards</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {(reports?.report_cards || []).map((report) => (
                  <div key={report.name} className="rounded-xl border border-[#EEF2F6] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-[#121826]">{report.name}</p>
                        <p className="mt-2 text-2xl font-bold text-[#238DD7]">
                          {report.value}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          report.status === "ready"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-[#667085]">
                      {report.change}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#E7EAF0] bg-white p-6">
              <div className="mb-5 flex items-center gap-3">
                <Download className="text-[#238DD7]" size={20} />
                <h3 className="text-lg font-bold text-[#121826]">Recent Exports</h3>
              </div>
              <div className="space-y-3">
                {(reports?.recent_exports || []).map((item) => (
                  <div key={item.id} className="rounded-xl bg-[#F7F9FC] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-[#121826]">{item.name}</p>
                      <span className="rounded-full bg-[#E7F5FF] px-2 py-1 text-xs font-bold text-[#238DD7]">
                        {item.format}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#667085]">{item.generated_at}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </ModuleWrapper>
  );
}
