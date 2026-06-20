import api from "@/lib/api";

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
