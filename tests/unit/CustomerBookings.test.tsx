import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
const get = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/client", () => ({ default: { get } }));
vi.mock("@/hooks/useCurrency", () => ({ useCurrency: () => ({ formatExact: (amount: string | number, currency = "USD") => `${currency} ${amount}` }) }));
vi.mock("@/components/ui/DatePicker", () => ({ default: () => <input aria-label="Travel date" /> }));
import CustomerBookings from "@/app/customer/bookings/page";

describe("Customer booking data", () => {
  beforeEach(() => { get.mockReset(); });
  it("shows an empty account without sample bookings", async () => {
    get.mockResolvedValue({ data: { items: [] } });
    render(<CustomerBookings />);
    await waitFor(() => expect(screen.queryByText("Loading your bookings...")).not.toBeInTheDocument());
    expect(screen.queryByText(/Bali Island Retreat/)).not.toBeInTheDocument();
    expect(screen.getByText("No bookings match your filters")).toBeInTheDocument();
  });
  it("shows an API error without inventing bookings", async () => {
    get.mockRejectedValue(new Error("offline"));
    render(<CustomerBookings />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load your bookings");
    expect(screen.queryByText(/TRV-2847/)).not.toBeInTheDocument();
  });
  it("preserves a zero amount and the booking currency", async () => {
    get.mockResolvedValue({ data: { items: [{ id: 42, tour_name: "Actual tour", final_amount: "0", currency: "NZD", no_of_adults: 1 }] } });
    render(<CustomerBookings />);
    expect(await screen.findByText("Actual tour")).toBeInTheDocument();
    expect(screen.getByText("NZD 0")).toBeInTheDocument();
  });
});
