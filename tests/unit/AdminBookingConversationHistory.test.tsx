import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const getAdminBookingConversations = vi.fn();
const replyToAdminBookingConversation = vi.fn();

vi.mock("@/lib/api/services/messagingService", () => ({
  getAdminBookingConversations: (...args: unknown[]) => getAdminBookingConversations(...args),
  replyToAdminBookingConversation: (...args: unknown[]) => replyToAdminBookingConversation(...args),
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
  supplier_user_id: 8,
  supplier_name: "Southern Tours",
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
    replyToAdminBookingConversation.mockReset();
    getAdminBookingConversations.mockResolvedValue(structuredClone([conversation]));
  });

  it("keeps supplier and agent messages in separate columns", async () => {
    render(<AdminBookingConversationHistory bookingId={42} />);

    const supplier = await screen.findByRole("region", { name: "Supplier conversation" });
    const agent = screen.getByRole("region", { name: "Agent conversation" });

    expect(within(supplier).getByText("Supplier message")).toBeInTheDocument();
    expect(within(supplier).getByText("Supplier reply")).toBeInTheDocument();
    expect(within(supplier).queryByText("Agent message")).not.toBeInTheDocument();
    expect(within(agent).getByText("Agent message")).toBeInTheDocument();
    expect(within(agent).getByText("Agent reply")).toBeInTheDocument();
    expect(within(agent).queryByText("Supplier message")).not.toBeInTheDocument();
  });

  it("sends each reply to the selected portal and keeps it in that column", async () => {
    const user = userEvent.setup();
    replyToAdminBookingConversation.mockResolvedValue({
      id: 5,
      conversation_id: 17,
      sender_role: "admin",
      sender_user_id: 1,
      sender_name: "Admin",
      recipient_role: "supplier",
      body: "New supplier reply",
      created_at: "2026-10-07T04:00:00Z",
    });
    render(<AdminBookingConversationHistory bookingId={42} />);

    const supplier = await screen.findByRole("region", { name: "Supplier conversation" });
    await user.type(within(supplier).getByRole("textbox", { name: "Message for supplier" }), "New supplier reply");
    await user.click(within(supplier).getByRole("button", { name: "Reply to supplier" }));

    expect(replyToAdminBookingConversation).toHaveBeenCalledWith(17, "New supplier reply", "supplier");
    await waitFor(() => expect(within(supplier).getByText("New supplier reply")).toBeInTheDocument());
  });
});
