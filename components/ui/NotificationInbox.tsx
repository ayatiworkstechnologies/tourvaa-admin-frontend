'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import api from '@/lib/api';
import { useAuthContext } from '@/providers/AuthProvider';

type Notification = {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationInbox() {
  const { user } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await api.get(`/notifications?user_id=${user.id}&limit=20`);
      setItems(res.data?.data ?? res.data?.items ?? []);
    } catch {
      // silently fail
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch {
      // silently fail
    }
  }

  const unread = items.filter((n) => !n.is_read).length;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); if (!open) fetchNotifications(); }}
        className="relative flex h-11 w-11 items-center justify-center rounded-lg bg-white text-[#6B7280] hover:text-[#43A9F6]"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-50 w-80 rounded-2xl border border-[#E7EAF0] bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-[#E7EAF0] px-4 py-3">
            <span className="text-sm font-bold text-[#121826]">Notifications</span>
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
                  className={`cursor-pointer px-4 py-3 transition-colors hover:bg-[#F7F9FC] ${!n.is_read ? 'bg-[#F0F7FF]' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#43A9F6]" />}
                    <div className={!n.is_read ? '' : 'pl-4'}>
                      <p className="text-sm font-semibold text-[#121826]">{n.title}</p>
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
