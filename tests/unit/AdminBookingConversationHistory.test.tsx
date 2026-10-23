import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const getAdminBookingConversations = vi.fn();

vi.mock("@/lib/api/services/messagingService", () => ({
  getAdminBookingConversations: (...args: unknown[]) => getAdminBookingConversations(...args),
}));

const { default: AdminBookingConversationHistory } = await import(
  "@/components/messaging/AdminBookingConversationHistory"
);

const conversation = {
  id: 17,
  booking_id: 42,
  booking_code: "TV-42",
  tour_name: "Milford Sound",
  initiator_role: "agent" as const,
  initiator_user_id: 7,
  initiator_name: "Brightlane Agent",
  initiator_online: false,
  supplier_user_id: 8,
  supplier_name: "Southern Tours",
  supplier_online: true,
  admin_online: true,
  status: "open",
  last_message_at: "2026-10-07T03:00:00Z",
  last_message_preview: "Agent reply",
  initiator_unread_count: 0,
  supplier_unread_count: 0,
  created_at: "2026-10-07T01:00:00Z",
  messages: [
    { id: 1, conversation_id: 17, sender_role: "supplier" as const, sender_user_id: 8, sender_name: "Southern Tours", recipient_role: null, body: "Supplier message", created_at: "2026-10-07T01:00:00Z" },
    { id: 2, conversation_id: 17, sender_role: "agent" as const, sender_user_id: 7, sender_name: "Brightlane Agent", recipient_role: null, body: "Agent message", created_at: "2026-10-07T02:00:00Z" },
    { id: 3, conversation_id: 17, sender_role: "admin" as const, sender_user_id: 1, sender_name: "Admin", recipient_role: "supplier" as const, body: "Supplier reply", created_at: "2026-10-07T02:30:00Z" },
    { id: 4, conversation_id: 17, sender_role: "admin" as const, sender_user_id: 1, sender_name: "Admin", recipient_role: "agent" as const, body: "Agent reply", created_at: "2026-10-07T03:00:00Z" },
  ],
};

describe("AdminBookingConversationHistory", () => {
  beforeEach(() => {
    getAdminBookingConversations.mockReset();
    getAdminBookingConversations.mockResolvedValue(structuredClone([conversation]));
  });

  it("shows one chronological participant history for admin monitoring", async () => {
    render(<AdminBookingConversationHistory bookingId={42} />);

    const history = await screen.findByRole("region", { name: "Direct booking conversation" });
    expect(history).toHaveTextContent("Southern Tours");
    expect(history).toHaveTextContent("Brightlane Agent");
    expect(history).toHaveTextContent("Supplier message");
    expect(history).toHaveTextContent("Agent message");
    expect(history).toHaveTextContent("Admin monitoring only");
  });

  it("does not offer an Admin compose control", async () => {
    render(<AdminBookingConversationHistory bookingId={42} />);
    await screen.findByRole("region", { name: "Direct booking conversation" });
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("Admin receives no message-email copies and cannot reply in this participant thread.")).toBeInTheDocument();
  });
});
