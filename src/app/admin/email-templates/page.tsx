"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { LuSquarePen as Edit, LuEye as Eye, LuPlus as Plus, LuTrash2 as Trash2, LuX as X } from "react-icons/lu";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useDashboard } from "@/hooks/useDashboard";
import api from "@/lib/api/client";
import Loader from "@/components/ui/Loader";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";

type EmailTemplate = {
  id: number;
  key: string;
  name: string;
  subject: string;
  body: string;
  is_active: boolean;
};

const emptyForm = {
  key: "",
  name: "",
  subject: "",
  body: "",
  is_active: true,
};

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || fallback;
  }

  return fallback;
}

export default function EmailTemplatesPage() {
  const { dashboard, loading: dashboardLoading } = useDashboard();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [previewing, setPreviewing] = useState<EmailTemplate | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(templates.length / pageSize));
  const paginatedTemplates = templates.slice((page - 1) * pageSize, page * pageSize);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/email-templates/");
      setTemplates(response.data.data || []);
      setPage(1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
     
    fetchTemplates();
  }, [fetchTemplates]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (template: EmailTemplate) => {
    setEditing(template);
    setForm({
      key: template.key,
      name: template.name,
      subject: template.subject,
      body: template.body,
      is_active: template.is_active,
    });
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const openPreview = async (template: EmailTemplate) => {
    setPreviewing(template);
    setPreviewLoading(true);
    setPreviewHtml("");
    setPreviewSubject("");
    try {
      const response = await api.get(`/email-templates/${template.id}/preview`);
      setPreviewHtml(response.data?.data?.html || "");
      setPreviewSubject(response.data?.data?.subject || template.subject);
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Could not load preview."));
      setPreviewing(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewing(null);
    setPreviewHtml("");
    setPreviewSubject("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      if (editing) {
        await api.put(`/email-templates/${editing.id}`, {
          name: form.name,
          subject: form.subject,
          body: form.body,
          is_active: form.is_active,
        });
      } else {
        await api.post("/email-templates/", form);
      }

      await fetchTemplates();
      close();
      setMessage("Email template saved successfully.");
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Could not save template."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (template: EmailTemplate) => {
    const ok = confirm(`Delete template "${template.name}"?`);
    if (!ok) return;

    try {
      await api.delete(`/email-templates/${template.id}`);
      await fetchTemplates();
      setMessage("Email template deleted successfully.");
    } catch {
      setMessage("Could not delete template.");
    }
  };

  const columns: DataTableColumn<EmailTemplate>[] = [
    {
      key: "no",
      header: "No",
      className: "w-20 font-bold text-dash-muted",
      render: (_, index) => (page - 1) * pageSize + index + 1,
    },
    {
      key: "name",
      header: "Template",
      className: "font-bold text-dash-text",
      render: (t) => t.name,
    },
    {
      key: "key",
      header: "Key",
      className: "text-dash-muted",
      render: (t) => t.key,
    },
    {
      key: "subject",
      header: "Subject",
      className: "text-dash-body",
      render: (t) => t.subject,
    },
    {
      key: "status",
      header: "Status",
      render: (t) => (
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            t.is_active
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {t.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  if (dashboardLoading || loading) {
    return <Loader label="Loading email templates..." fullScreen />;
  }
  if (!dashboard) return null;

  return (
    <ProtectedRoute requiredPermission="email_templates.view">
    <DashboardLayout title="Email Templates" menus={dashboard.menus} user={dashboard.user}>
      <div className="space-y-6">
        <section className="rounded-2xl border border-dash-border bg-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-dash-text">Email Templates</h2>
              <p className="mt-1 text-sm text-dash-muted">
                Manage subjects and body copy for system emails. Variables use
                double braces, for example {"{{name}}"}.
              </p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover"
            >
              <Plus size={16} />
              Add Template
            </button>
          </div>
          {message && (
            <p className="mt-4 rounded-xl bg-sky-50 px-4 py-3 text-sm text-dash-brand-hover">
              {message}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-dash-border bg-white p-6">
          <div className="p-0">
            <DataTable
              ariaLabel="Email Templates table"
              columns={columns}
              rows={paginatedTemplates}
              loading={loading}
              page={page}
              pageSize={pageSize}
              total={templates.length}
              totalPages={totalPages}
              onPageChange={setPage}
              emptyTitle="No email templates found."
              actions={(template) => (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => openPreview(template)}
                    className="rounded-lg border border-dash-border p-2 text-dash-muted hover:bg-sky-50 hover:text-dash-brand-hover"
                    title="Preview design"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={() => openEdit(template)}
                    className="rounded-lg border border-dash-border p-2 text-dash-muted hover:bg-sky-50 hover:text-dash-brand-hover"
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    onClick={() => remove(template)}
                    className="rounded-lg border border-dash-border p-2 text-dash-muted hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            />
          </div>
        </section>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-dash-text">
                {editing ? "Edit Template" : "Add Template"}
              </h3>
              <button
                onClick={close}
                aria-label="Close dialog"
                title="Close dialog"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-dash-muted hover:bg-dash-bg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                    Key
                  </span>
                  <input
                    value={form.key}
                    disabled={!!editing}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, key: event.target.value }))
                    }
                    className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand disabled:bg-gray-50"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                    Name
                  </span>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                  Subject
                </span>
                <input
                  value={form.subject}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, subject: event.target.value }))
                  }
                  className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                  required
                />
              </label>

              <label className="flex min-h-0 flex-1 flex-col">
                <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                  Body
                </span>
                <textarea
                  value={form.body}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, body: event.target.value }))
                  }
                  className="min-h-48 flex-1 rounded-xl border border-dash-border px-4 py-3 text-sm leading-6 outline-none focus:border-dash-brand"
                  required
                />
              </label>

              <label className="flex items-center gap-2 text-sm font-semibold text-dash-muted">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      is_active: event.target.checked,
                    }))
                  }
                />
                Active template
              </label>

              <div className="flex justify-end gap-3 border-t border-dash-border pt-4">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-xl border border-dash-border px-4 py-2 text-sm font-bold text-dash-muted hover:bg-dash-bg"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  className="rounded-xl bg-dash-brand px-5 py-2 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-dash-border px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-dash-text">{previewing.name}</h3>
                <p className="mt-0.5 text-xs text-dash-muted">
                  Subject: <span className="font-semibold text-dash-body">{previewSubject}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={closePreview}
                aria-label="Close preview"
                title="Close preview"
                className="rounded-lg p-2 text-dash-muted hover:bg-dash-bg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-[#F0F4F9]">
              {previewLoading ? (
                <div className="flex h-64 items-center justify-center text-sm text-dash-muted">
                  Loading preview...
                </div>
              ) : (
                <iframe
                  title="Email preview"
                  srcDoc={previewHtml}
                  className="h-[70vh] w-full border-0"
                  sandbox=""
                />
              )}
            </div>
            <div className="border-t border-dash-border px-6 py-3 text-xs text-dash-subtle">
              Preview uses sample placeholder data for any {"{{variables}}"} in this template.
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
    </ProtectedRoute>
  );
}


