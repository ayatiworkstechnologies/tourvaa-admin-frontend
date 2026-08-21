import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/hooks/useMessagingSocket", () => ({ useMessagingSocket: vi.fn() }));

const mockThread = {
  id: 1,
  participant_type: "customer" as const,
  participant_user_id: 10,
  participant_name: "Jane Customer",
  participant_email: "jane@example.com",
  status: "open",
  last_message_at: null,
  last_message_preview: null,
  admin_unread_count: 0,
  participant_unread_count: 0,
  created_at: "2026-08-20T00:00:00Z",
  messages: [
    { id: 1, conversation_id: 1, sender_role: "admin" as const, sender_user_id: 2, sender_name: "Support", body: "Hi, how can we help?", is_deleted: false, created_at: "2026-08-20T00:00:00Z" },
    { id: 2, conversation_id: 1, sender_role: "customer" as const, sender_user_id: 10, sender_name: "Jane Customer", body: "I have a question about my booking.", is_deleted: false, created_at: "2026-08-20T00:01:00Z" },
  ],
};

const getOwnConversation = vi.fn();
const sendOwnMessage = vi.fn();
const deleteOwnMessage = vi.fn();

vi.mock("@/lib/api/services/messagingService", () => ({
  getOwnConversation: (...args: unknown[]) => getOwnConversation(...args),
  sendOwnMessage: (...args: unknown[]) => sendOwnMessage(...args),
  deleteOwnMessage: (...args: unknown[]) => deleteOwnMessage(...args),
}));

const { default: PortalMessageThread } = await import("@/components/messaging/PortalMessageThread");

describe("PortalMessageThread delete-own-message", () => {
  beforeEach(() => {
    getOwnConversation.mockReset();
    sendOwnMessage.mockReset();
    deleteOwnMessage.mockReset();
    getOwnConversation.mockResolvedValue(structuredClone(mockThread));
  });

  it("shows a delete button only on the participant's own message, not the admin's", async () => {
    render(<PortalMessageThread portal="customer" />);

    await waitFor(() => expect(screen.getByText("Hi, how can we help?")).toBeInTheDocument());

    const deleteButtons = screen.getAllByRole("button", { name: "Delete message" });
    expect(deleteButtons).toHaveLength(1);
  });

  it("deletes the caller's own message and shows the deleted placeholder", async () => {
    const user = userEvent.setup();
    deleteOwnMessage.mockResolvedValue({
      id: 2,
      conversation_id: 1,
      sender_role: "customer",
      sender_user_id: 10,
      sender_name: "Jane Customer",
      body: null,
      is_deleted: true,
      created_at: "2026-08-20T00:01:00Z",
    });

    render(<PortalMessageThread portal="customer" />);

    await waitFor(() => expect(screen.getByText("I have a question about my booking.")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Delete message" }));

    expect(deleteOwnMessage).toHaveBeenCalledWith(2);
    await waitFor(() => expect(screen.getByText("This message was deleted.")).toBeInTheDocument());
    expect(screen.queryByText("I have a question about my booking.")).not.toBeInTheDocument();
    // The now-deleted message no longer offers a delete action.
    expect(screen.queryAllByRole("button", { name: "Delete message" })).toHaveLength(0);
  });

  it("shows an error and keeps the message if deletion fails", async () => {
    const user = userEvent.setup();
    deleteOwnMessage.mockRejectedValue(new Error("network error"));

    render(<PortalMessageThread portal="customer" />);

    await waitFor(() => expect(screen.getByText("I have a question about my booking.")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Delete message" }));

    await waitFor(() => expect(screen.getByText("Could not delete that message.")).toBeInTheDocument());
    expect(screen.getByText("I have a question about my booking.")).toBeInTheDocument();
  });
});
