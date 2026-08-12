import api from "@/lib/api/client";

import axios from "axios";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";

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
  gst_rate: string;
  gst_amount: string;
  total_amount: string;
  amount_paid: string;
  amount_due: string;
  balance_due_date?: string | null;
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
  gst_rate?: number;
  balance_due_date?: string;
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

export async function emailInvoice(invoiceId: number | string, email?: string, message?: string) {
  const response = await api.post<ApiDataResponse<Invoice>>(`/invoices/${invoiceId}/email`, { email, message });
  return response.data.data;
}

/** Re-renders an invoice's PDF from its current data (e.g. after a booking
 * detail like tour name or traveller list changes, or after the PDF layout
 * itself is updated) without creating a new invoice record. */
export async function regenerateInvoicePdf(invoiceId: number | string) {
  const response = await api.post<ApiDataResponse<Invoice>>(`/invoices/${invoiceId}/generate-pdf`);
  return response.data.data;
}

export function invoiceActionError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) return getApiErrorMessage(error) || fallback;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/**
 * Downloads an invoice PDF and saves it via the browser.
 *
 * A plain `<a href="/api/invoices/{id}/download">` cannot carry the
 * Authorization header the API requires - it's a raw navigation, not an
 * authenticated request - so the download always 401s. Fetching the file
 * as a blob through the authenticated `api` client (which injects the
 * Bearer token via its request interceptor) and saving it client-side is
 * the correct fix.
 */
export async function downloadInvoicePdf(invoiceId: number | string, filename?: string, customerScoped = false) {
  const endpoint = customerScoped ? `/customer/invoices/${invoiceId}/download` : `/invoices/${invoiceId}/download`;
  let response;
  try {
    response = await api.get(endpoint, { responseType: "blob" });
  } catch (error) {
    const responseBlob = (error as { response?: { data?: unknown } })?.response?.data;
    if (responseBlob instanceof Blob) {
      let payload: { detail?: string; message?: string } | null = null;
      try {
        payload = JSON.parse(await responseBlob.text()) as { detail?: string; message?: string };
      } catch { /* Preserve the original Axios error for non-JSON responses. */ }
      if (payload?.detail || payload?.message) throw new Error(payload.detail || payload.message);
    }
    throw error;
  }

  const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: "application/pdf" });
  const signature = new TextDecoder("ascii").decode((await blob.slice(0, 5).arrayBuffer()));
  if (signature !== "%PDF-") throw new Error("The server did not return a valid invoice PDF. Please regenerate it and try again.");

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `invoice-${invoiceId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking synchronously can cancel downloads in Safari/WebKit.
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1_000);
}



