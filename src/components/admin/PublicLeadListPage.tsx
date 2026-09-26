"use client";

import { useEffect, useState } from "react";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import {
  type ContactEnquiry,
  type NewsletterSubscriber,
  listContactEnquiries,
  listNewsletterSubscribers,
} from "@/lib/api/services/publicLeadService";

const PAGE_SIZE = 15;

function exactDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(date);
}

type Props = { kind: "contact" | "newsletter" };

export default function PublicLeadListPage({ kind }: Props) {
  const isContact = kind === "contact";
  const [rows, setRows] = useState<(ContactEnquiry | NewsletterSubscriber)[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const result = isContact
          ? await listContactEnquiries(page, PAGE_SIZE, search)
          : await listNewsletterSubscribers(page, PAGE_SIZE, search);
        setRows(result.items);
        setTotal(result.total);
        setTotalPages(result.total_pages);
        setError("");
      } catch {
        setError(isContact ? "Could not load contact enquiries." : "Could not load subscribers.");
      } finally {
        setLoading(false);
      }
    }, search ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [isContact, page, search]);

  const contactColumns: DataTableColumn<ContactEnquiry | NewsletterSubscriber>[] = [
    { key: "name", header: "Customer", render: (row) => "name" in row ? <div><p className="font-bold text-dash-text">{row.name}</p><p className="text-xs text-dash-subtle">{row.email}</p></div> : row.email },
    { key: "phone", header: "Phone", render: (row) => "phone" in row ? row.phone || "-" : "-" },
    { key: "enquiry_type", header: "Type", render: (row) => "enquiry_type" in row ? row.enquiry_type : "-" },
    { key: "subject", header: "Enquiry", render: (row) => "subject" in row ? <div className="max-w-md"><p className="font-semibold text-dash-text">{row.subject}</p><p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-dash-muted">{row.message}</p></div> : "-" },
    { key: "created_at", header: "Submitted date & time", className: "whitespace-nowrap", render: (row) => exactDate(row.created_at) },
  ];

  const subscriberColumns: DataTableColumn<ContactEnquiry | NewsletterSubscriber>[] = [
    { key: "email", header: "Subscriber email", className: "font-semibold text-dash-text" },
    { key: "is_active", header: "Status", render: (row) => "is_active" in row && row.is_active ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Active</span> : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">Inactive</span> },
    { key: "created_at", header: "Subscribed date & time", className: "whitespace-nowrap", render: (row) => exactDate(row.created_at) },
  ];

  const title = isContact ? "Contact Enquiries" : "Homepage Subscribers";
  return (
    <ModuleWrapper title={title} requiredPermission={["settings.view", "view-settings", "messages.view"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dash-text">{title}</h1>
          <p className="mt-1 text-sm text-dash-muted">
            {isContact ? "Messages submitted through the public contact form." : "Email addresses collected from the public newsletter signup."}
          </p>
        </div>
        <DataTable
          ariaLabel={title}
          columns={isContact ? contactColumns : subscriberColumns}
          rows={rows}
          loading={loading}
          error={error}
          search={search}
          onSearchChange={(value) => { setSearch(value); setPage(1); }}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyTitle={isContact ? "No contact enquiries yet" : "No subscribers yet"}
          emptyDescription={isContact ? "New contact-form submissions will appear here." : "New homepage newsletter signups will appear here."}
          minWidthClass={isContact ? "min-w-[1050px]" : "min-w-[700px]"}
        />
      </div>
    </ModuleWrapper>
  );
}
