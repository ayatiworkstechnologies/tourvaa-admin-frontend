"use client";

import { useEffect, useState } from "react";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { ActivityLog, getActivityLogs } from "@/lib/api/services/activityLogService";

const PAGE_SIZE = 10;

export default function ActivityLogsPage() {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let shouldUpdateState = true;

    async function fetchActivityLogs() {
      setIsLoading(true);
      try {
        const activityLogResponse = await getActivityLogs({ page: currentPage, limit: PAGE_SIZE });

        if (!shouldUpdateState) return;

        setActivityLogs(activityLogResponse.items || []);
        setTotalLogs(activityLogResponse.total || 0);
        setTotalPages(activityLogResponse.total_pages || 1);
        setErrorMessage("");
      } catch {
        if (shouldUpdateState) setErrorMessage("Could not load activity logs.");
      } finally {
        if (shouldUpdateState) setIsLoading(false);
      }
    }

    void fetchActivityLogs();

    return () => {
      shouldUpdateState = false;
    };
  }, [currentPage]);

  const activityLogColumns: DataTableColumn<ActivityLog>[] = [
    { key: "action", header: "Action" },
    { key: "entity_type", header: "Entity" },
    { key: "entity_id", header: "Entity ID" },
    { key: "actor_user_id", header: "Actor" },
    { key: "ip_address", header: "IP" },
    { key: "created_at", header: "Created" },
  ];

  return (
    <ModuleWrapper title="Activity Logs" requiredPermission="activity_logs.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dash-text">Activity Logs</h1>
          <p className="text-sm text-dash-muted">Audited booking, payment, invoice, and admin actions.</p>
        </div>

        <DataTable
          ariaLabel="Activity logs"
          columns={activityLogColumns}
          rows={activityLogs}
          loading={isLoading}
          error={errorMessage}
          page={currentPage}
          pageSize={PAGE_SIZE}
          total={totalLogs}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          emptyTitle="No activity found"
        />
      </div>
    </ModuleWrapper>
  );
}
