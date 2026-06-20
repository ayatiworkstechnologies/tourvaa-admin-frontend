"use client";

import { useEffect, useState } from "react";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { Notification, getNotifications } from "@/lib/services/notificationService";

const PAGE_SIZE = 10;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let shouldUpdateState = true;

    async function fetchNotifications() {
      setIsLoading(true);
      try {
        const notificationResponse = await getNotifications({ page: currentPage, limit: PAGE_SIZE });

        if (!shouldUpdateState) return;

        setNotifications(notificationResponse.items || []);
        setTotalNotifications(notificationResponse.total || 0);
        setTotalPages(notificationResponse.total_pages || 1);
        setErrorMessage("");
      } catch {
        if (shouldUpdateState) setErrorMessage("Could not load notifications.");
      } finally {
        if (shouldUpdateState) setIsLoading(false);
      }
    }

    void fetchNotifications();

    return () => {
      shouldUpdateState = false;
    };
  }, [currentPage]);

  const notificationColumns: DataTableColumn<Notification>[] = [
    { key: "title", header: "Title" },
    { key: "notification_type", header: "Type" },
    { key: "channel", header: "Channel" },
    { key: "status", header: "Status" },
    { key: "is_read", header: "Read", render: (notification) => (notification.is_read ? "Yes" : "No") },
    { key: "created_at", header: "Created" },
  ];

  return (
    <ModuleWrapper title="Notifications" requiredPermission="notifications.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#121826]">Notifications</h1>
          <p className="text-sm text-[#667085]">In-app and queued notification events.</p>
        </div>

        <DataTable
          ariaLabel="Notifications"
          columns={notificationColumns}
          rows={notifications}
          loading={isLoading}
          error={errorMessage}
          page={currentPage}
          pageSize={PAGE_SIZE}
          total={totalNotifications}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          emptyTitle="No notifications found"
        />
      </div>
    </ModuleWrapper>
  );
}
