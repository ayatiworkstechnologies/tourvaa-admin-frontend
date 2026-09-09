import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
const generate = vi.hoisted(() => vi.fn());
vi.mock("@/components/common/ModuleWrapper", () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("@/components/ui/DataTable", () => ({ default: () => <div>Invoices table</div> }));
vi.mock("@/hooks/useToast", () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));
vi.mock("@/hooks/useCurrency", () => ({ useCurrency: () => ({ formatExact: String }) }));
vi.mock("@/lib/api/services/invoiceService", () => ({
  getInvoices: async () => ({ items: [] }), generateInvoice: generate,
  downloadInvoicePdf: vi.fn(), emailInvoice: vi.fn(), regenerateInvoicePdf: vi.fn(),
  invoiceActionError: () => "Generation failed",
}));
import InvoicesPage from "@/app/admin/invoices/page";

describe("Invoice generation", () => {
  it("opens the form and prevents repeated submission while pending", async () => {
    let finish!: () => void;
    generate.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
    const user = userEvent.setup();
    render(<InvoicesPage />);
    await user.click(screen.getByRole("button", { name: "Generate Invoice" }));
    await user.type(screen.getByLabelText("Booking ID"), "42");
    await user.selectOptions(screen.getByLabelText("Type"), "partial_payment");
    const button = screen.getByRole("button", { name: /^Generate$/ });
    await user.dblClick(button);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenCalledWith(expect.objectContaining({ booking_id: 42, invoice_type: "partial_payment" }));
    finish();
    await waitFor(() => expect(screen.queryByRole("form", { name: "Generate invoice" })).not.toBeInTheDocument());
  });
});
