"use client";

import { useCallback, useEffect, useState } from "react";
import { LuBell as Bell, LuCircleAlert as AlertCircle } from "react-icons/lu";
import { SupplierPageHeader, SupplierPageShell, SupplierSection } from "@/components/supplier/SupplierPage";
import { getNotifications, markNotificationRead, type Notification } from "@/lib/api/services/notificationService";
import { useAuthContext } from "@/providers/AuthProvider";

export default function SupplierNotificationsPage() {
  const { user } = useAuthContext();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const userId = user?.id;

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const response = await getNotifications({ user_id: userId, limit: 50 });
      setItems(response.items ?? response.data ?? []);
    } catch {
      setError("Notifications could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  const open = async (item: Notification) => {
    if (item.is_read) return;
    await markNotificationRead(item.id);
    setItems((current) => current.map((row) => row.id === item.id ? { ...row, is_read: true } : row));
  };

  return (
    <SupplierPageShell>
      <SupplierPageHeader title="Notifications" description="Approval, verification and account updates from Tourvaa." icon={Bell} eyebrow="Supplier Account" />
      {error && <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"><AlertCircle size={17} /> {error}<button type="button" onClick={() => void load()} className="ml-auto underline">Retry</button></div>}
      <SupplierSection className="mt-4" title="Recent updates" description="Unread updates are highlighted.">
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}</div>
        ) : items.length === 0 ? (
          <div className="py-14 text-center text-sm text-dash-muted">No notifications yet.</div>
        ) : (
          <div className="divide-y divide-dash-border">
            {items.map((item) => (
              <button key={item.id} type="button" onClick={() => void open(item)} className={`block w-full p-5 text-left transition hover:bg-emerald-50/50 ${item.is_read ? "bg-white" : "bg-emerald-50/40"}`}>
                <div className="flex items-start gap-3">
                  <Bell size={17} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span>
                    <b className="text-sm text-dash-text">{item.title}</b>
                    <span className="mt-1 block text-sm leading-6 text-dash-muted">{item.message}</span>
                    {item.created_at && <time className="mt-2 block text-xs text-dash-subtle">{new Date(item.created_at).toLocaleString()}</time>}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </SupplierSection>
    </SupplierPageShell>
  );
}
