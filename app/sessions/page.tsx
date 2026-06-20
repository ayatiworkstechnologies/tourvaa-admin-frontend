"use client";

import { useEffect, useState } from "react";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { UserSession, getSessions } from "@/lib/services/sessionService";

const PAGE_SIZE = 10;

export default function SessionsPage() {
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let shouldUpdateState = true;

    async function fetchUserSessions() {
      setIsLoading(true);
      try {
        const sessionResponse = await getSessions({ page: currentPage, limit: PAGE_SIZE });

        if (!shouldUpdateState) return;

        setUserSessions(sessionResponse.items || []);
        setTotalSessions(sessionResponse.total || 0);
        setTotalPages(sessionResponse.total_pages || 1);
        setErrorMessage("");
      } catch {
        if (shouldUpdateState) setErrorMessage("Could not load sessions.");
      } finally {
        if (shouldUpdateState) setIsLoading(false);
      }
    }

    void fetchUserSessions();

    return () => {
      shouldUpdateState = false;
    };
  }, [currentPage]);

  const sessionColumns: DataTableColumn<UserSession>[] = [
    { key: "user_id", header: "User" },
    { key: "session_id", header: "Session" },
    { key: "status", header: "Status" },
    { key: "ip_address", header: "IP" },
    { key: "last_seen_at", header: "Last Seen" },
    { key: "created_at", header: "Created" },
  ];

  return (
    <ModuleWrapper title="Sessions" requiredPermission="sessions.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#121826]">Sessions</h1>
          <p className="text-sm text-[#667085]">Active and revoked user sessions.</p>
        </div>

        <DataTable
          ariaLabel="Sessions"
          columns={sessionColumns}
          rows={userSessions}
          loading={isLoading}
          error={errorMessage}
          page={currentPage}
          pageSize={PAGE_SIZE}
          total={totalSessions}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          emptyTitle="No sessions found"
        />
      </div>
    </ModuleWrapper>
  );
}
