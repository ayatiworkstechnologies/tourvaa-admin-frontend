"use client";

import { useCallback, useEffect, useState } from "react";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { LoginHistoryEntry, UserSession, forceLogoutUser, getLoginHistory, getSessions, revokeSession } from "@/lib/api/services/sessionService";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";

const PAGE_SIZE = 10;

export default function SessionsPage() {
  const toast = useToast();
  const { hasPermission } = useAuthContext();
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [forcingLogoutUserId, setForcingLogoutUserId] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<"sessions" | "login_history">("sessions");
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  const fetchLoginHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await getLoginHistory({ page: historyPage, limit: PAGE_SIZE });
      setLoginHistory(response.items || []);
      setHistoryTotal(response.total || 0);
      setHistoryTotalPages(response.total_pages || 1);
    } catch {
      setLoginHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage]);

  useEffect(() => {
    if (activeTab === "login_history") void fetchLoginHistory();
  }, [activeTab, fetchLoginHistory]);

  const fetchUserSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const sessionResponse = await getSessions({ page: currentPage, limit: PAGE_SIZE });
      setUserSessions(sessionResponse.items || []);
      setTotalSessions(sessionResponse.total || 0);
      setTotalPages(sessionResponse.total_pages || 1);
      setErrorMessage("");
    } catch {
      setErrorMessage("Could not load sessions.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => { void fetchUserSessions(); }, [fetchUserSessions]);

  const canRevoke = hasPermission("sessions.revoke");
  const canForceLogout = hasPermission("sessions.force_logout");

  async function handleRevoke(session: UserSession) {
    setRevokingId(session.id);
    try {
      await revokeSession(session.id);
      toast.success("Session revoked.");
      await fetchUserSessions();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setRevokingId(null);
    }
  }

  async function handleForceLogout(session: UserSession) {
    const label = session.user_name || `User #${session.user_id}`;
    if (!confirm(`Force logout ${label}? This revokes all of their active sessions immediately.`)) return;
    setForcingLogoutUserId(session.user_id);
    try {
      await forceLogoutUser(session.user_id);
      toast.success(`${label} was logged out of all sessions.`);
      await fetchUserSessions();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setForcingLogoutUserId(null);
    }
  }

  const sessionColumns: DataTableColumn<UserSession>[] = [
    { key: "user", header: "User", render: (session) => session.user_name || `User #${session.user_id}` },
    { key: "session_id", header: "Session" },
    { key: "status", header: "Status" },
    { key: "ip_address", header: "IP" },
    { key: "last_seen_at", header: "Last Seen" },
    { key: "created_at", header: "Created" },
  ];

  const loginHistoryColumns: DataTableColumn<LoginHistoryEntry>[] = [
    { key: "email", header: "Email" },
    {
      key: "status",
      header: "Status",
      render: (entry) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${entry.status === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
          {entry.status}
        </span>
      ),
    },
    { key: "failure_reason", header: "Reason", render: (entry) => entry.failure_reason || "-" },
    { key: "client_type", header: "Client" },
    { key: "device_name", header: "Device", render: (entry) => entry.device_name || "-" },
    { key: "ip_address", header: "IP", render: (entry) => entry.ip_address || "-" },
    { key: "created_at", header: "When", render: (entry) => (entry.created_at ? new Date(entry.created_at).toLocaleString() : "-") },
  ];

  return (
    <ModuleWrapper title="Sessions" requiredPermission="sessions.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dash-text">Sessions</h1>
          <p className="text-sm text-dash-muted">Active and revoked user sessions, plus login attempt history.</p>
        </div>

        <div className="inline-flex rounded-xl border border-dash-border p-1">
          <button
            type="button"
            onClick={() => setActiveTab("sessions")}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${activeTab === "sessions" ? "bg-dash-brand text-white" : "text-dash-muted hover:bg-dash-bg"}`}
          >
            Sessions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("login_history")}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${activeTab === "login_history" ? "bg-dash-brand text-white" : "text-dash-muted hover:bg-dash-bg"}`}
          >
            Login History
          </button>
        </div>

        {activeTab === "sessions" && (
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
            actions={(canRevoke || canForceLogout) ? (session) => (
              <div className="flex items-center gap-2">
                {canRevoke && session.status === "active" && (
                  <button
                    type="button"
                    disabled={revokingId === session.id}
                    onClick={() => void handleRevoke(session)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {revokingId === session.id ? "Revoking..." : "Revoke"}
                  </button>
                )}
                {canForceLogout && (
                  <button
                    type="button"
                    disabled={forcingLogoutUserId === session.user_id}
                    onClick={() => void handleForceLogout(session)}
                    className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                  >
                    {forcingLogoutUserId === session.user_id ? "Logging out..." : "Force Logout"}
                  </button>
                )}
              </div>
            ) : undefined}
          />
        )}

        {activeTab === "login_history" && (
          <DataTable
            ariaLabel="Login history"
            columns={loginHistoryColumns}
            rows={loginHistory}
            loading={historyLoading}
            page={historyPage}
            pageSize={PAGE_SIZE}
            total={historyTotal}
            totalPages={historyTotalPages}
            onPageChange={setHistoryPage}
            emptyTitle="No login attempts recorded"
          />
        )}
      </div>
    </ModuleWrapper>
  );
}
