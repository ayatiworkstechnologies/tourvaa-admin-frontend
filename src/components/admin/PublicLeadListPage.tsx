"use client";

import { useEffect, useState } from "react";
import { LuEye as Eye, LuX as X } from "react-icons/lu";
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
  const [audience, setAudience] = useState<"all" | ContactEnquiry["audience"]>("all");
  const [selectedEnquiry, setSelectedEnquiry] = useState<ContactEnquiry | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const result = isContact
          ? await listContactEnquiries(page, PAGE_SIZE, search, audience)
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
  }, [audience, isContact, page, search]);

  const contactColumns: DataTableColumn<ContactEnquiry | NewsletterSubscriber>[] = [
    { key: "name", header: "Customer", render: (row) => "name" in row ? <div><p className="font-bold text-dash-text">{row.name}</p><p className="text-xs text-dash-subtle">{row.email}</p></div> : row.email },
    { key: "phone", header: "Phone", render: (row) => "phone" in row ? row.phone || "-" : "-" },
    { key: "audience", header: "Contact", render: (row) => "audience" in row ? <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold capitalize text-slate-700">{row.audience}</span> : "-" },
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
        {isContact && (
          <div className="flex flex-wrap gap-2 border-b border-dash-border-soft pb-3" role="tablist" aria-label="Contact enquiry audience">
            {(["all", "public", "supplier", "agent"] as const).map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={audience === item}
                onClick={() => { setAudience(item); setPage(1); }}
                className={`rounded-xl px-4 py-2 text-sm font-bold capitalize transition ${audience === item ? "bg-dash-text text-white" : "bg-dash-bg text-dash-muted hover:bg-[#EEF2F8]"}`}
              >
                {item === "all" ? "All messages" : `${item} messages`}
              </button>
            ))}
          </div>
        )}
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
          actions={isContact ? (row) => "message" in row ? (
            <button
              type="button"
              onClick={() => setSelectedEnquiry(row)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:translate-y-px"
            >
              <Eye size={14} /> View
            </button>
          ) : null : undefined}
        />
      </div>

      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedEnquiry(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="enquiry-detail-title" className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <header className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <p className="text-xs font-bold capitalize text-dash-brand">{selectedEnquiry.audience} message</p>
                <h2 id="enquiry-detail-title" className="mt-1 text-xl font-black text-dash-text">{selectedEnquiry.subject}</h2>
              </div>
              <button type="button" onClick={() => setSelectedEnquiry(null)} aria-label="Close enquiry details" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"><X size={18} /></button>
            </header>
            <div className="space-y-6 px-6 py-5">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div><dt className="text-xs font-bold text-dash-subtle">Name</dt><dd className="mt-1 font-semibold text-dash-text">{selectedEnquiry.name}</dd></div>
                <div><dt className="text-xs font-bold text-dash-subtle">Submitted</dt><dd className="mt-1 text-sm text-dash-text">{exactDate(selectedEnquiry.created_at)}</dd></div>
                <div><dt className="text-xs font-bold text-dash-subtle">Email</dt><dd className="mt-1 break-all text-sm text-dash-text"><a className="font-semibold text-dash-brand hover:underline" href={`mailto:${selectedEnquiry.email}`}>{selectedEnquiry.email}</a></dd></div>
                <div><dt className="text-xs font-bold text-dash-subtle">Phone</dt><dd className="mt-1 text-sm text-dash-text">{selectedEnquiry.phone || "Not provided"}</dd></div>
                <div className="sm:col-span-2"><dt className="text-xs font-bold text-dash-subtle">Enquiry type</dt><dd className="mt-1 text-sm font-semibold text-dash-text">{selectedEnquiry.enquiry_type}</dd></div>
              </dl>
              <div>
                <h3 className="text-xs font-bold text-dash-subtle">Full message</h3>
                <p className="mt-2 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800">{selectedEnquiry.message}</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </ModuleWrapper>
  );
}
