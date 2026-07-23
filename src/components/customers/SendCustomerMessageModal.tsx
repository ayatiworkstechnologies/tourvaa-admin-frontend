"use client";

import { useState } from "react";
import { LuX as X } from "react-icons/lu";

type Props = {
  open: boolean;
  saving?: boolean;
  onClose: () => void;
  onSend: (payload: { subject: string; message: string; booking_id?: number | null }) => Promise<void>;
};

export default function SendCustomerMessageModal({ open, saving, onClose, onSend }: Props) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [bookingId, setBookingId] = useState("");

  if (!open) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSend({
      subject,
      message,
      booking_id: bookingId ? Number(bookingId) : null,
    });
    setSubject("");
    setMessage("");
    setBookingId("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4">
      <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-4 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-dash-text">Send Message</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-dash-muted hover:bg-dash-bg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Subject</span>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              required
              maxLength={150}
              className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Message</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
              rows={6}
              className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Related Booking ID</span>
            <input
              value={bookingId}
              onChange={(event) => setBookingId(event.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
            />
          </label>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl border border-dash-border px-4 py-2 text-sm font-bold text-dash-muted hover:bg-dash-bg sm:w-auto"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              className="w-full rounded-xl bg-dash-brand px-5 py-2 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60 sm:w-auto"
            >
              {saving ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
