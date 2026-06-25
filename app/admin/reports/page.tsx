"use client";

import { useEffect, useState } from "react";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import Loader from "@/components/ui/Loader";
import { getReportSummary, ReportSummary } from "@/lib/services/reportService";

function ReportMetricCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#E7EAF0] bg-white p-5">
      <p className="text-xs font-bold uppercase text-[#98A2B3]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#121826]">{value}</p>
    </div>
  );
}

export default function ReportsPage() {
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let shouldUpdateState = true;

    async function fetchReportSummary() {
      setIsLoading(true);
      try {
        const summary = await getReportSummary();
        if (!shouldUpdateState) return;
        setReportSummary(summary);
        setErrorMessage("");
      } catch {
        if (shouldUpdateState) setErrorMessage("Could not load report summary.");
      } finally {
        if (shouldUpdateState) setIsLoading(false);
      }
    }

    void fetchReportSummary();

    return () => {
      shouldUpdateState = false;
    };
  }, []);

  return (
    <ModuleWrapper title="Reports" requiredPermission="reports.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#121826]">Reports</h1>
          <p className="text-sm text-[#667085]">Live booking, revenue, and invoice aggregates.</p>
        </div>

        {isLoading ? <Loader label="Loading reports..." /> : null}
        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

        {!isLoading && !errorMessage ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <ReportMetricCard label="Bookings" value={reportSummary?.total_bookings ?? 0} />
            <ReportMetricCard label="Confirmed" value={reportSummary?.confirmed_bookings ?? 0} />
            <ReportMetricCard label="Cancelled" value={reportSummary?.cancelled_bookings ?? 0} />
            <ReportMetricCard label="Captured Revenue" value={reportSummary?.captured_revenue ?? "0.00"} />
            <ReportMetricCard label="Invoice Total" value={reportSummary?.invoice_total ?? "0.00"} />
          </div>
        ) : null}
      </div>
    </ModuleWrapper>
  );
}
