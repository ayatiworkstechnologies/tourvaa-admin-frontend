import api from "@/lib/api/client";

export type Invoice = {
  id: number;
  invoice_number: string;
  booking_id: number;
  payment_id?: number | null;
  customer_id: number;
  invoice_type: string;
  status: string;
  currency: string;
  subtotal_amount: string;
  gst_amount: string;
  total_amount: string;
  amount_paid: string;
  amount_due: string;
  pdf_path?: string | null;
  emailed_at?: string | null;
  created_at?: string | null;
};

export type InvoiceFilters = {
  page?: number;
  limit?: number;
  booking_id?: number;
  customer_id?: number;
};

export type InvoiceGenerateRequest = {
  booking_id: number;
  payment_id?: number;
  invoice_type?: string;
};

export type PaginatedInvoices = {
  items: Invoice[];
  data: Invoice[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

type ApiDataResponse<T> = {
  status: string;
  data: T;
};

export async function getInvoices(filters: InvoiceFilters = {}) {
  const response = await api.get<PaginatedInvoices & { status: string }>("/invoices/", {
    params: filters,
  });

  return response.data;
}

export async function generateInvoice(invoice: InvoiceGenerateRequest) {
  const response = await api.post<ApiDataResponse<Invoice>>("/invoices/generate", invoice);
  return response.data.data;
}

export async function emailInvoice(invoiceId: number | string, email?: string) {
  const response = await api.post<ApiDataResponse<Invoice>>(`/invoices/${invoiceId}/email`, { email });
  return response.data.data;
}

/** Re-renders an invoice's PDF from its current data (e.g. after a booking
 * detail like tour name or traveller list changes, or after the PDF layout
 * itself is updated) without creating a new invoice record. */
export async function regenerateInvoicePdf(invoiceId: number | string) {
  const response = await api.post<ApiDataResponse<Invoice>>(`/invoices/${invoiceId}/generate-pdf`);
  return response.data.data;
}

/**
 * Downloads an invoice PDF and saves it via the browser.
 *
 * A plain `<a href="/api/invoices/{id}/download">` cannot carry the
 * Authorization header the API requires — it's a raw navigation, not an
 * authenticated request — so the download always 401s. Fetching the file
 * as a blob through the authenticated `api` client (which injects the
 * Bearer token via its request interceptor) and saving it client-side is
 * the correct fix.
 */
export async function downloadInvoicePdf(invoiceId: number | string, filename?: string) {
  const response = await api.get(`/invoices/${invoiceId}/download`, { responseType: "blob" });
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `invoice-${invoiceId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}



