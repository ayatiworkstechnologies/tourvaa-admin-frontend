"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { LuSquarePen as Edit, LuLoaderCircle as Loader2, LuMessageSquare as MessageSquare, LuPlus as Plus, LuTrash2 as Trash2, LuX as X } from "react-icons/lu";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useDashboard } from "@/hooks/useDashboard";
import api from "@/lib/api/client";
import Loader from "@/components/ui/Loader";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";

type FAQ = {
  id: number;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
};

const emptyForm = {
  question: "",
  answer: "",
  category: "general",
  sort_order: 0,
  is_active: true,
};

const CATEGORIES = ["general", "booking", "payment", "destinations", "policies", "other"];

type ChatSession = {
  id: number;
  session_key: string;
  user_name: string;
  user_email: string;
  message_count: number;
  created_at: string;
};

type ChatMessage = {
  id: number;
  role: string;
  content: string;
  created_at: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) return error.response?.data?.detail || fallback;
  return fallback;
}

export default function ChatbotFAQPage() {
  const { dashboard, loading: dashboardLoading } = useDashboard();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(faqs.length / pageSize));
  const paginated = faqs.slice((page - 1) * pageSize, page * pageSize);

  const [activeTab, setActiveTab] = useState<"faqs" | "sessions">("faqs");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsPage, setSessionsPage] = useState(1);
  const [sessionsTotal, setSessionsTotal] = useState(0);
  const [sessionsTotalPages, setSessionsTotalPages] = useState(1);
  const sessionsPageSize = 10;
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const fetchFAQs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/chatbot/admin/faqs");
      setFaqs(res.data || []);
      setPage(1);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await api.get("/chatbot/admin/sessions", { params: { page: sessionsPage, limit: sessionsPageSize } });
      const data = res.data ?? {};
      setSessions(data.items ?? []);
      setSessionsTotal(data.total ?? 0);
      setSessionsTotalPages(data.total_pages ?? 1);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, [sessionsPage]);

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  useEffect(() => {
    if (activeTab === "sessions") void fetchSessions();
  }, [activeTab, fetchSessions]);

  const toggleSessionExpand = async (session: ChatSession) => {
    if (expandedSessionId === session.id) {
      setExpandedSessionId(null);
      return;
    }
    setExpandedSessionId(session.id);
    setMessagesLoading(true);
    try {
      const res = await api.get(`/chatbot/admin/sessions/${session.id}/messages`);
      setSessionMessages(res.data?.data ?? []);
    } catch {
      setSessionMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (faq: FAQ) => {
    setEditing(faq);
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      sort_order: faq.sort_order,
      is_active: faq.is_active,
    });
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      if (editing) {
        await api.put(`/chatbot/admin/faqs/${editing.id}`, form);
      } else {
        await api.post("/chatbot/admin/faqs", form);
      }
      await fetchFAQs();
      close();
      setMessage(editing ? "FAQ updated successfully." : "FAQ created successfully.");
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Could not save FAQ."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (faq: FAQ) => {
    if (!confirm(`Delete FAQ: "${faq.question}"?`)) return;
    try {
      await api.delete(`/chatbot/admin/faqs/${faq.id}`);
      await fetchFAQs();
      setMessage("FAQ deleted.");
    } catch {
      setMessage("Could not delete FAQ.");
    }
  };

  const columns: DataTableColumn<FAQ>[] = [
    {
      key: "no",
      header: "#",
      className: "w-14 font-bold text-dash-muted",
      render: (_, index) => (page - 1) * pageSize + index + 1,
    },
    {
      key: "question",
      header: "Question",
      render: (faq) => (
        <>
          <div className="font-semibold text-dash-text line-clamp-1">{faq.question}</div>
          <div className="text-xs text-dash-muted mt-0.5 line-clamp-1">{faq.answer}</div>
        </>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (faq) => (
        <span className="capitalize rounded-full bg-indigo-50 text-indigo-700 px-3 py-1 text-xs font-semibold">
          {faq.category}
        </span>
      ),
    },
    {
      key: "sort_order",
      header: "Order",
      className: "text-dash-muted",
      render: (faq) => faq.sort_order,
    },
    {
      key: "status",
      header: "Status",
      render: (faq) => (
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            faq.is_active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          }`}
        >
          {faq.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const sessionColumns: DataTableColumn<ChatSession>[] = [
    {
      key: "user",
      header: "Visitor",
      render: (session) => (
        <>
          <div className="font-semibold text-dash-text">{session.user_name || "Anonymous"}</div>
          {session.user_email && <div className="text-xs text-dash-muted">{session.user_email}</div>}
        </>
      ),
    },
    { key: "session_key", header: "Session Key", className: "font-mono text-xs text-dash-subtle", render: (session) => session.session_key },
    { key: "message_count", header: "Messages", className: "text-dash-muted", render: (session) => session.message_count },
    { key: "created_at", header: "Started", className: "text-xs text-dash-muted", render: (session) => (session.created_at ? new Date(session.created_at).toLocaleString() : "-") },
  ];

  if (dashboardLoading || loading) return <Loader label="Loading chatbot FAQs..." fullScreen />;
  if (!dashboard) return null;

  return (
    <ProtectedRoute requiredPermission="chatbot.view">
      <DashboardLayout title="Chatbot FAQ" menus={dashboard.menus} user={dashboard.user}>
        <div className="space-y-6">
          <section className="rounded-2xl border border-dash-border bg-white p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <MessageSquare size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-dash-text">Chatbot FAQ</h2>
                  <p className="text-sm text-dash-muted mt-0.5">
                    Manage AI knowledge base - these Q&amp;As are injected into the AI assistant&apos;s context.
                  </p>
                </div>
              </div>
              {activeTab === "faqs" && (
                <button
                  onClick={openCreate}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover"
                >
                  <Plus size={16} />
                  Add FAQ
                </button>
              )}
            </div>
            {message && (
              <p className="mt-4 rounded-xl bg-sky-50 px-4 py-3 text-sm text-dash-brand-hover">{message}</p>
            )}
            <div className="mt-4 inline-flex rounded-xl border border-dash-border p-1">
              <button
                type="button"
                onClick={() => setActiveTab("faqs")}
                className={`rounded-lg px-4 py-2 text-sm font-bold ${activeTab === "faqs" ? "bg-dash-brand text-white" : "text-dash-muted hover:bg-dash-bg"}`}
              >
                FAQs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("sessions")}
                className={`rounded-lg px-4 py-2 text-sm font-bold ${activeTab === "sessions" ? "bg-dash-brand text-white" : "text-dash-muted hover:bg-dash-bg"}`}
              >
                Chat Sessions
              </button>
            </div>
          </section>

          {activeTab === "faqs" && (
            <section className="rounded-2xl border border-dash-border bg-white p-6">
              <div className="p-0">
                <DataTable
                  ariaLabel="Chatbot FAQs table"
                  columns={columns}
                  rows={paginated}
                  loading={loading}
                  page={page}
                  pageSize={pageSize}
                  total={faqs.length}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  emptyTitle="No FAQs yet."
                  emptyDescription="Add your first FAQ to train the AI assistant."
                  actions={(faq) => (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(faq)}
                        className="rounded-lg border border-dash-border p-2 text-dash-muted hover:bg-sky-50 hover:text-dash-brand-hover"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => remove(faq)}
                        className="rounded-lg border border-dash-border p-2 text-dash-muted hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                />
              </div>
            </section>
          )}

          {activeTab === "sessions" && (
            <section className="rounded-2xl border border-dash-border bg-white p-6">
              <div className="p-0">
                <DataTable
                  ariaLabel="Chatbot sessions table"
                  columns={sessionColumns}
                  rows={sessions}
                  loading={sessionsLoading}
                  page={sessionsPage}
                  pageSize={sessionsPageSize}
                  total={sessionsTotal}
                  totalPages={sessionsTotalPages}
                  onPageChange={setSessionsPage}
                  emptyTitle="No chat sessions yet."
                  emptyDescription="Sessions appear once visitors start chatting with the assistant."
                  actions={(session) => (
                    <button
                      onClick={() => void toggleSessionExpand(session)}
                      className="rounded-lg border border-dash-border px-3 py-1.5 text-xs font-bold text-dash-muted hover:bg-sky-50 hover:text-dash-brand-hover"
                    >
                      {expandedSessionId === session.id ? "Hide" : "View messages"}
                    </button>
                  )}
                  renderExpandedRow={(session) => {
                    if (expandedSessionId !== session.id) return null;
                    return (
                      <tr key={`messages-${session.id}`} className="border-b border-dash-border bg-dash-bg">
                        <td colSpan={sessionColumns.length + 1} className="px-4 py-4">
                          {messagesLoading ? (
                            <div className="flex items-center gap-2 text-sm text-dash-muted">
                              <Loader2 className="animate-spin" size={15} /> Loading messages...
                            </div>
                          ) : sessionMessages.length === 0 ? (
                            <p className="text-sm text-dash-muted">No messages recorded for this session.</p>
                          ) : (
                            <div className="space-y-2">
                              {sessionMessages.map((msg) => (
                                <div key={msg.id} className={`max-w-2xl rounded-xl px-4 py-2 text-sm ${msg.role === "user" ? "bg-white" : "ml-auto bg-blue-50"}`}>
                                  <p className="mb-1 text-[10px] font-bold uppercase text-dash-subtle">{msg.role}</p>
                                  <p className="text-dash-text">{msg.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  }}
                />
              </div>
            </section>
          )}
        </div>

        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-bold text-dash-text">
                  {editing ? "Edit FAQ" : "Add FAQ"}
                </h3>
                <button onClick={close} className="rounded-lg p-2 text-dash-muted hover:bg-dash-bg">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Question</span>
                  <input
                    value={form.question}
                    onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                    className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                    placeholder="e.g. What is the cancellation policy?"
                    required
                  />
                </label>

                <label className="block flex-1">
                  <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Answer</span>
                  <textarea
                    value={form.answer}
                    onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                    className="w-full min-h-32 rounded-xl border border-dash-border px-4 py-3 text-sm outline-none focus:border-dash-brand leading-6"
                    placeholder="Provide a clear, helpful answer..."
                    required
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Category</span>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand bg-white"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c} className="capitalize">{c}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Sort Order</span>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                      className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                      min={0}
                    />
                  </label>
                </div>

                <label className="flex items-center gap-2 text-sm font-semibold text-dash-muted">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  />
                  Active (visible to AI assistant and public FAQ)
                </label>

                <div className="flex justify-end gap-3 border-t border-dash-border pt-4 mt-auto">
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
                    {saving ? "Saving..." : editing ? "Update FAQ" : "Create FAQ"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}


