import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

const mockCalendarEntries = [
  { id: 1, tour_date: "2026-09-20", available_seats: 10, booked_seats: 0, status: "available" },
  { id: 2, tour_date: "2026-09-21", available_seats: 10, booked_seats: 0, status: "available" },
  { id: 3, tour_date: "2026-09-24", available_seats: 10, booked_seats: 0, status: "sold_out" },
  { id: 4, tour_date: "2026-09-27", available_seats: 10, booked_seats: 0, status: "available" },
  { id: 5, tour_date: "2026-10-01", available_seats: 10, booked_seats: 0, status: "available" },
  { id: 6, tour_date: "2026-10-05", available_seats: 10, booked_seats: 0, status: "unavailable" },
  { id: 7, tour_date: "2027-01-15", available_seats: 8, booked_seats: 2, status: "available" },
  { id: 8, tour_date: "2027-01-20", available_seats: 8, booked_seats: 2, status: "available" },
  { id: 9, tour_date: "2027-01-25", available_seats: 8, booked_seats: 2, status: "available" },
  { id: 10, tour_date: "2027-02-01", available_seats: 5, booked_seats: 5, status: "sold_out" },
  { id: 11, tour_date: "2027-02-10", available_seats: 10, booked_seats: 0, status: "available" },
  { id: 12, tour_date: "2027-02-15", available_seats: 10, booked_seats: 0, status: "available" },
];

const mockToast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };
vi.mock("@/hooks/useToast", () => ({
  useToast: () => mockToast,
}));

const mockConfirm = { confirm: vi.fn(), dialog: null };
vi.mock("@/hooks/useConfirm", () => ({
  useConfirm: () => mockConfirm,
}));

vi.mock("@/lib/api/services/tourDetailService", () => ({
  getCalendar: vi.fn(() => Promise.resolve(mockCalendarEntries)),
  getUnavailableDates: vi.fn(() => Promise.resolve([])),
  getAvailabilityConfig: vi.fn(() => Promise.resolve(null)),
  createCalendarEntry: vi.fn(),
  updateCalendarEntry: vi.fn(),
  deleteCalendarEntry: vi.fn(),
  createUnavailableDate: vi.fn(),
  deleteUnavailableDate: vi.fn(),
  saveAvailabilityConfig: vi.fn(),
}));

vi.mock("@/components/ui/DatePicker", () => ({
  default: ({ value, placeholder }: { value?: string; placeholder?: string }) => (
    <input data-testid="mock-datepicker" value={value || ""} placeholder={placeholder} readOnly />
  ),
}));

import TourCalendarTab from "@/components/tours/TourCalendarTab";

describe("TourCalendarTab pagination and filters", () => {
  it("renders the Tour Calendar table with pagination and filter bar", async () => {
    render(<TourCalendarTab tourId="123" />);

    await waitFor(() => {
      expect(screen.queryByText("Loading calendar...")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Tour Calendar" })).toBeInTheDocument();

    // Check filter controls
    expect(screen.getByLabelText(/Year:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Month:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Status:/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Available Only/i })).toBeInTheDocument();

    // Check pagination exists (12 total items with pageSize 10 = 2 pages)
    expect(screen.getByTestId("calendar-dates-count")).toHaveTextContent("Showing 12 of 12 dates");
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("filters by Month (September)", async () => {
    render(<TourCalendarTab tourId="123" />);

    await waitFor(() => {
      expect(screen.queryByText("Loading calendar...")).not.toBeInTheDocument();
    });

    const monthSelect = screen.getByLabelText(/Month:/i);
    fireEvent.change(monthSelect, { target: { value: "09" } });

    // September dates should be present
    expect(screen.getByText("2026-09-20")).toBeInTheDocument();
    expect(screen.getByText("2026-09-21")).toBeInTheDocument();
    expect(screen.getByText("2026-09-24")).toBeInTheDocument();
    expect(screen.getByText("2026-09-27")).toBeInTheDocument();

    // October and 2027 dates should not be present
    expect(screen.queryByText("2026-10-01")).not.toBeInTheDocument();
    expect(screen.queryByText("2027-01-15")).not.toBeInTheDocument();

    // Counter matches
    expect(screen.getByTestId("calendar-dates-count")).toHaveTextContent("Showing 4 of 12 dates");
  });

  it("filters by Year (2027)", async () => {
    render(<TourCalendarTab tourId="123" />);

    await waitFor(() => {
      expect(screen.queryByText("Loading calendar...")).not.toBeInTheDocument();
    });

    const yearSelect = screen.getByLabelText(/Year:/i);
    fireEvent.change(yearSelect, { target: { value: "2027" } });

    // 2027 dates should be shown
    expect(screen.getByText("2027-01-15")).toBeInTheDocument();
    expect(screen.getByText("2027-01-20")).toBeInTheDocument();

    // 2026 dates should not be shown
    expect(screen.queryByText("2026-09-20")).not.toBeInTheDocument();
  });

  it("filters for Available Only toggle", async () => {
    render(<TourCalendarTab tourId="123" />);

    await waitFor(() => {
      expect(screen.queryByText("Loading calendar...")).not.toBeInTheDocument();
    });

    // 2026-09-24 is sold_out, initially visible on page 1
    expect(screen.getByText("2026-09-24")).toBeInTheDocument();

    // Click "Available Only" toggle button
    const availableOnlyBtn = screen.getByRole("button", { name: /Available Only/i });
    fireEvent.click(availableOnlyBtn);

    // 2026-09-24 (sold_out) should disappear
    expect(screen.queryByText("2026-09-24")).not.toBeInTheDocument();

    // Available items remain
    expect(screen.getByText("2026-09-20")).toBeInTheDocument();
  });

  it("navigates pagination pages correctly", async () => {
    render(<TourCalendarTab tourId="123" />);

    await waitFor(() => {
      expect(screen.queryByText("Loading calendar...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("1 / 2")).toBeInTheDocument();

    // Page 1 has 2026-09-20, does not have 11th item 2027-02-10
    expect(screen.getByText("2026-09-20")).toBeInTheDocument();
    expect(screen.queryByText("2027-02-10")).not.toBeInTheDocument();

    // Click Next
    const nextBtn = screen.getByRole("button", { name: /Next/i });
    fireEvent.click(nextBtn);

    // Page 2 shows items 11 and 12
    expect(screen.getByText("2027-02-15")).toBeInTheDocument();
    expect(screen.queryByText("2026-09-20")).not.toBeInTheDocument();
  });

  it("renders Apply Seats to All button and prompts confirmation", async () => {
    mockConfirm.confirm.mockResolvedValueOnce(true);

    render(<TourCalendarTab tourId="123" />);

    await waitFor(() => {
      expect(screen.queryByText("Loading calendar...")).not.toBeInTheDocument();
    });

    const applySeatsBtn = screen.getByRole("button", { name: /Apply.*Seats to All/i });
    expect(applySeatsBtn).toBeInTheDocument();

    fireEvent.click(applySeatsBtn);

    await waitFor(() => {
      expect(mockConfirm.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Apply Available Seats to All Dates",
        })
      );
    });
  });
});
