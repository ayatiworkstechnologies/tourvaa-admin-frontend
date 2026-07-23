'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LuBell as Bell } from "react-icons/lu";
import api from '@/lib/api/client';
import { useAuthContext } from '@/providers/AuthProvider';
import { playNotificationSound, unlockNotificationSound } from '@/lib/utils/notificationSound';
import {
  isNotificationPushMessage,
  NOTIFICATION_REFRESH_EVENT,
} from '@/lib/notifications/events';

type Notification = {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

const inboxCache = new Map<number, Notification[]>();
const inboxRequests = new Map<number, Promise<Notification[]>>();

function loadInbox(userId: number) {
  const existingRequest = inboxRequests.get(userId);
  if (existingRequest) return existingRequest;

  const request = api
    .get(`/notifications?user_id=${userId}&limit=20`)
    .then((res) => {
      const items = (res.data?.data ?? res.data?.items ?? []) as Notification[];
      inboxCache.set(userId, items);
      return items;
    })
    .finally(() => {
      inboxRequests.delete(userId);
    });

  inboxRequests.set(userId, request);
  return request;
}

export default function NotificationInbox() {
  const { user } = useAuthContext();
  const userId = user?.id;
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [hasNewAlert, setHasNewAlert] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const knownIdsRef = useRef<Set<number>>(new Set());
  const initializedRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const nextItems = await loadInbox(userId);
      const nextIds = new Set(nextItems.map((item) => item.id));
      const hasNewUnread = nextItems.some((item) => !item.is_read && !knownIdsRef.current.has(item.id));

      if (initializedRef.current && hasNewUnread) {
        setHasNewAlert(true);
        playNotificationSound();
      }

      knownIdsRef.current = nextIds;
      initializedRef.current = true;
      setItems(nextItems);
    } catch {
      // silently fail
    }
  }, [userId]);

  useEffect(() => {
    knownIdsRef.current = new Set();
    initializedRef.current = false;
    if (userId && inboxCache.has(userId)) {
      const cachedItems = inboxCache.get(userId) ?? [];
      knownIdsRef.current = new Set(cachedItems.map((item) => item.id));
      initializedRef.current = true;
      setItems(cachedItems);
      return;
    }
    void fetchNotifications();
  }, [fetchNotifications, userId]);

  useEffect(() => {
    const refresh = () => void fetchNotifications();
    const onServiceWorkerMessage = (event: MessageEvent) => {
      if (isNotificationPushMessage(event.data)) refresh();
    };

    window.addEventListener(NOTIFICATION_REFRESH_EVENT, refresh);
    navigator.serviceWorker?.addEventListener('message', onServiceWorkerMessage);
    return () => {
      window.removeEventListener(NOTIFICATION_REFRESH_EVENT, refresh);
      navigator.serviceWorker?.removeEventListener('message', onServiceWorkerMessage);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    window.addEventListener('pointerdown', unlockNotificationSound, { once: true });
    window.addEventListener('keydown', unlockNotificationSound, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlockNotificationSound);
      window.removeEventListener('keydown', unlockNotificationSound);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  async function markRead(id: number) {
    try {
      await api.patch(`/notifications/${id}/read`);
      setItems((prev) => {
        const nextItems = prev.map((n) => (n.id === id ? { ...n, is_read: true } : n));
        if (userId) inboxCache.set(userId, nextItems);
        return nextItems;
      });
    } catch {
      // silently fail
    }
  }

  const unread = items.filter((n) => !n.is_read).length;
  const shouldBlink = hasNewAlert || unread > 0;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => { unlockNotificationSound(); setHasNewAlert(false); setOpen((v) => !v); }}
        className={`relative flex h-11 w-11 items-center justify-center rounded-lg bg-white text-[#6B7280] hover:text-dash-brand ${shouldBlink ? 'animate-pulse text-dash-brand ring-2 ring-dash-brand/30' : ''}`}
        aria-label="Notifications"
      >
        {shouldBlink && <span className="absolute inset-0 rounded-lg bg-dash-brand/10" />}
        <Bell size={18} className={shouldBlink ? 'animate-bounce' : ''} />
        {unread > 0 && (
          <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-50 w-80 rounded-2xl border border-dash-border bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-dash-border px-4 py-3">
            <span className="text-sm font-bold text-dash-text">Notifications</span>
            {unread > 0 && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-500">
                {unread} unread
              </span>
            )}
          </div>

          <ul className="max-h-96 overflow-y-auto divide-y divide-[#F3F5F8]">
            {items.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-[#8B93A1]">No notifications</li>
            ) : (
              items.map((n) => (
                <li
                  key={n.id}
                  onClick={() => !n.is_read && markRead(n.id)}
                  className={`cursor-pointer px-4 py-3 transition-colors hover:bg-dash-bg ${!n.is_read ? 'bg-[#F0F7FF]' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-dash-brand" />}
                    <div className={!n.is_read ? '' : 'pl-4'}>
                      <p className="text-sm font-semibold text-dash-text">{n.title}</p>
                      <p className="mt-0.5 text-xs text-[#6B7280]">{n.message}</p>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
