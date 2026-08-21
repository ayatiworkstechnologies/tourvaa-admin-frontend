import { describe, expect, it, vi } from "vitest";

const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
};

vi.mock("@/lib/api/client", () => ({ default: mockApi }));

const { deleteOwnMessage, deleteOwnBookingMessage } = await import("@/lib/api/services/messagingService");

describe("messagingService delete endpoints", () => {
  it("deleteOwnMessage calls DELETE /messages/{id} and returns the updated message", async () => {
    const deletedMessage = { id: 42, conversation_id: 7, sender_role: "admin", sender_user_id: 1, sender_name: "Admin", body: null, is_deleted: true, created_at: "2026-08-21T00:00:00Z" };
    mockApi.delete.mockResolvedValueOnce({ data: { status: "success", data: deletedMessage } });

    const result = await deleteOwnMessage(42);

    expect(mockApi.delete).toHaveBeenCalledWith("/messages/42");
    expect(result).toEqual(deletedMessage);
  });

  it("deleteOwnBookingMessage calls DELETE /messages/booking/{id} and returns the updated message", async () => {
    const deletedMessage = { id: 99, conversation_id: 3, sender_role: "supplier", sender_user_id: 5, sender_name: "Supplier", body: null, is_deleted: true, created_at: "2026-08-21T00:00:00Z" };
    mockApi.delete.mockResolvedValueOnce({ data: { status: "success", data: deletedMessage } });

    const result = await deleteOwnBookingMessage(99);

    expect(mockApi.delete).toHaveBeenCalledWith("/messages/booking/99");
    expect(result).toEqual(deletedMessage);
  });
});
