"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LuBell as Bell, LuBellRing as BellRing, LuCheckCheck as CheckCheck, LuRefreshCw as RefreshCw, LuVolume2 as Volume2, LuVolumeX as VolumeX } from "react-icons/lu";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  Notification,
} from "@/lib/api/services/notificationService";
import { playNotificationSound, unlockNotificationSound } from "@/lib/utils/notificationSound";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/useToast";
import {
  isNotificationPushMessage,
  NOTIFICATION_REFRESH_EVENT,
} from "@/lib/notifications/events";

const PAGE_SIZE = 15;

const READ_OPTIONS = [
  { label: "All", value: "" },
  { label: "Unread", value: "false" },
  { label: "Read", value: "true" },
];

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-IN", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).replace(",", "");
}

export default function NotificationsPage() {
  const toast = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [userIdFilter, setUserIdFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [entityIdFilter, setEntityIdFilter] = useState("");
  const [readFilter, setReadFilter] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const debouncedUserId = useDebounce(userIdFilter, 350);
  const debouncedEntityType = useDebounce(entityTypeFilter, 350);
  const debouncedEntityId = useDebounce(entityIdFilter, 350);

  const knownIdsRef = useRef<Set<number>>(new Set());
  const initializedRef = useRef(false);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getNotifications({
        page: currentPage,
        limit: PAGE_SIZE,
        user_id: debouncedUserId ? Number(debouncedUserId) : undefined,
        entity_type: debouncedEntityType || undefined,
        entity_id: debouncedEntityId ? Number(debouncedEntityId) : undefined,
        is_read: readFilter || undefined,
      });

      const items = response.items || [];
      const nextIds = new Set(items.map((item) => item.id));
      const hasNewUnread = items.some((item) => !item.is_read && !knownIdsRef.current.has(item.id));

      if (initializedRef.current && hasNewUnread && soundEnabledRef.current) {
        playNotificationSound();
      }
      knownIdsRef.current = nextIds;
      initializedRef.current = true;

      setNotifications(items);
      setTotalNotifications(response.total || 0);
      setTotalPages(response.total_pages || 1);
      setErrorMessage("");
    } catch {
      setErrorMessage("Could not load notifications.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedUserId, debouncedEntityType, debouncedEntityId, readFilter]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedUserId, debouncedEntityType, debouncedEntityId, readFilter]);

  useEffect(() => {
    const refresh = () => void fetchNotifications();
    const onServiceWorkerMessage = (event: MessageEvent) => {
      if (isNotificationPushMessage(event.data)) refresh();
    };

    window.addEventListener(NOTIFICATION_REFRESH_EVENT, refresh);
    navigator.serviceWorker?.addEventListener("message", onServiceWorkerMessage);
    return () => {
      window.removeEventListener(NOTIFICATION_REFRESH_EVENT, refresh);
      navigator.serviceWorker?.removeEventListener("message", onServiceWorkerMessage);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    window.addEventListener("pointerdown", unlockNotificationSound, { once: true });
    window.addEventListener("keydown", unlockNotificationSound, { once: true });
  }, []);

  async function handleMarkRead(id: number) {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch {
      toast.error("Could not mark notification as read.");
    }
  }

  async function handleMarkAllRead() {
    if (!debouncedUserId) {
      toast.error("Enter a User ID above to mark all of their notifications as read.");
      return;
    }
    setMarkingAll(true);
    try {
      const result = await markAllNotificationsRead(Number(debouncedUserId));
      toast.success(`Marked ${result.updated} notification(s) as read.`);
      await fetchNotifications();
    } catch {
      toast.error("Could not mark all as read.");
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

  const columns: DataTableColumn<Notification>[] = [
    {
      key: "title",
      header: "Notification",
      render: (n) => (
        <div className="flex items-start gap-2">
          {!n.is_read && <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-dash-brand" />}
          <div>
            <p className="font-semibold text-dash-text">{n.title}</p>
            <p className="text-xs text-dash-muted">{n.message}</p>
          </div>
        </div>
      ),
    },
    { key: "user_id", header: "User", render: (n) => (n.user_id ? `#${n.user_id}` : "-") },
    {
      key: "entity_type",
      header: "Entity",
      render: (n) => (n.entity_type ? `${n.entity_type} #${n.entity_id ?? "-"}` : "-"),
    },
    { key: "notification_type", header: "Type", className: "capitalize" },
    { key: "channel", header: "Channel", className: "capitalize" },
    { key: "status", header: "Status", className: "capitalize" },
    {
      key: "is_read",
      header: "Read",
      render: (n) => (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${n.is_read ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {n.is_read ? "Read" : "Unread"}
        </span>
      ),
    },
    { key: "created_at", header: "Created", render: (n) => formatDate(n.created_at) },
    {
      key: "id",
      header: "Actions",
      render: (n) =>
        !n.is_read && (
          <button
            type="button"
            onClick={() => void handleMarkRead(n.id)}
            className="rounded-lg border border-dash-border px-2.5 py-1.5 text-xs font-bold text-dash-body hover:bg-dash-bg"
          >
            Mark read
          </button>
        ),
    },
  ];

  return (
    <ModuleWrapper title="Notifications" requiredPermission="notifications.view">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-[28px] font-black tracking-tight text-dash-text">Notifications</h1>
            <p className="mt-1 text-sm font-medium text-dash-muted">In-app and queued notification events across all users.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void fetchNotifications()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-dash-border bg-white px-4 py-2.5 text-sm font-bold text-dash-body hover:bg-dash-bg disabled:opacity-60"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-dash-border bg-white px-4 py-2.5 text-sm font-bold text-dash-body hover:bg-dash-bg"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              Sound {soundEnabled ? "On" : "Off"}
            </button>
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              disabled={markingAll}
              className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgb(67,169,246,0.25)] transition hover:-translate-y-0.5 hover:bg-dash-brand-hover disabled:opacity-60"
            >
              <CheckCheck size={16} />
              {markingAll ? "Marking..." : "Mark All Read"}
            </button>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EDF5FF] text-dash-brand-hover">
              <Bell size={18} />
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-dash-subtle">Total (this page)</p>
            <p className="mt-1 text-xl font-black text-dash-text">{totalNotifications}</p>
          </div>
          <div className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <BellRing size={18} />
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-dash-subtle">Unread (current page)</p>
            <p className="mt-1 text-xl font-black text-dash-text">{unreadCount}</p>
          </div>
        </section>

        <div className="grid gap-3 rounded-2xl border border-dash-border-soft bg-white p-4 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)] md:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">User ID</span>
            <input
              type="number"
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              placeholder="e.g. 12"
              className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none transition focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Entity Type</span>
            <input
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              placeholder="e.g. supplier, booking"
              className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none transition focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Entity ID</span>
            <input
              type="number"
              value={entityIdFilter}
              onChange={(e) => setEntityIdFilter(e.target.value)}
              placeholder="e.g. 4"
              className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none transition focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Read status</span>
            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value)}
              className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none transition focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10"
            >
              {READ_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        <DataTable
          ariaLabel="Notifications"
          columns={columns}
          rows={notifications}
          loading={isLoading}
          error={errorMessage}
          page={currentPage}
          pageSize={PAGE_SIZE}
          total={totalNotifications}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          emptyTitle="No notifications found"
          emptyDescription="Try adjusting the filters above."
        />
      </div>
    </ModuleWrapper>
  );
}
