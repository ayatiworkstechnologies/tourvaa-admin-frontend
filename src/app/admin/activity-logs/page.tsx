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
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [actorUserId, setActorUserId] = useState("");

  useEffect(() => {
    let shouldUpdateState = true;

    async function fetchActivityLogs() {
      setIsLoading(true);
      try {
        const activityLogResponse = await getActivityLogs({ page: currentPage, limit: PAGE_SIZE, entity_type: entityType || undefined, action: action || undefined, actor_user_id: actorUserId ? Number(actorUserId) : undefined });

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
  }, [currentPage, entityType, action, actorUserId]);

  const activityLogColumns: DataTableColumn<ActivityLog>[] = [
    {
      key: "no",
      header: "No",
      className: "w-20 font-bold text-dash-muted",
      render: (_row, index) => (currentPage - 1) * PAGE_SIZE + index + 1,
    },
    { key: "action", header: "Action" },
    { key: "entity_type", header: "Entity" },
    { key: "entity_id", header: "Entity ID" },
    { key: "actor_user_id", header: "Actor", render: (log) => log.user_name || (log.actor_user_id ? `User #${log.actor_user_id}` : "-") },
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
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-dash-border bg-white p-4">
          <label className="text-sm font-medium text-dash-body">Entity type
            <input value={entityType} onChange={(event) => { setEntityType(event.target.value); setCurrentPage(1); }} className="mt-1 block w-44 rounded-lg border border-dash-border px-3 py-2" placeholder="e.g. booking" />
          </label>
          <label className="text-sm font-medium text-dash-body">Action
            <input value={action} onChange={(event) => { setAction(event.target.value); setCurrentPage(1); }} className="mt-1 block w-44 rounded-lg border border-dash-border px-3 py-2" placeholder="e.g. updated" />
          </label>
          <label className="text-sm font-medium text-dash-body">Actor user ID
            <input type="number" min="1" value={actorUserId} onChange={(event) => { setActorUserId(event.target.value); setCurrentPage(1); }} className="mt-1 block w-36 rounded-lg border border-dash-border px-3 py-2" placeholder="Any user" />
          </label>
          {(entityType || action || actorUserId) && <button type="button" onClick={() => { setEntityType(""); setAction(""); setActorUserId(""); setCurrentPage(1); }} className="rounded-lg border border-dash-border px-3 py-2 text-sm font-bold text-dash-muted hover:bg-dash-bg">Clear filters</button>}
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
