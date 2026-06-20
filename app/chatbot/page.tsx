"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Edit, MessageSquare, Plus, Trash2, X } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useDashboard } from "@/hooks/useDashboard";
import api from "@/lib/api";
import Loader from "@/components/ui/Loader";
import Pagination from "@/components/ui/Pagination";

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

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

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

  if (dashboardLoading || loading) return <Loader label="Loading chatbot FAQs..." fullScreen />;
  if (!dashboard) return null;

  return (
    <ProtectedRoute requiredPermission="chatbot.view">
      <DashboardLayout title="Chatbot FAQ" menus={dashboard.menus} user={dashboard.user}>
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#E7EAF0] bg-white p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <MessageSquare size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#121826]">Chatbot FAQ</h2>
                  <p className="text-sm text-[#667085] mt-0.5">
                    Manage AI knowledge base — these Q&amp;As are injected into the AI assistant&apos;s context.
                  </p>
                </div>
              </div>
              <button
                onClick={openCreate}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#43A9F6] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#2F9FE9]"
              >
                <Plus size={16} />
                Add FAQ
              </button>
            </div>
            {message && (
              <p className="mt-4 rounded-xl bg-sky-50 px-4 py-3 text-sm text-[#238DD7]">{message}</p>
            )}
          </section>

          <section className="rounded-2xl border border-[#E7EAF0] bg-white p-6">
            <div className="overflow-hidden rounded-2xl border border-[#E7EAF0]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-[#F7F9FC] text-xs uppercase text-[#667085]">
                    <tr>
                      <th className="w-14 px-5 py-4">#</th>
                      <th className="px-5 py-4">Question</th>
                      <th className="px-5 py-4">Category</th>
                      <th className="px-5 py-4">Order</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF2F6]">
                    {paginated.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-[#667085]">
                          No FAQs yet. Add your first FAQ to train the AI assistant.
                        </td>
                      </tr>
                    )}
                    {paginated.map((faq, index) => (
                      <tr key={faq.id} className="hover:bg-[#FAFBFC]">
                        <td className="px-5 py-4 font-bold text-[#667085]">
                          {(page - 1) * pageSize + index + 1}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-[#121826] line-clamp-1">{faq.question}</div>
                          <div className="text-xs text-[#667085] mt-0.5 line-clamp-1">{faq.answer}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="capitalize rounded-full bg-indigo-50 text-indigo-700 px-3 py-1 text-xs font-semibold">
                            {faq.category}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[#667085]">{faq.sort_order}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              faq.is_active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                            }`}
                          >
                            {faq.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEdit(faq)}
                              className="rounded-lg border border-[#E7EAF0] p-2 text-[#667085] hover:bg-sky-50 hover:text-[#238DD7]"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => remove(faq)}
                              className="rounded-lg border border-[#E7EAF0] p-2 text-[#667085] hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {faqs.length > pageSize && (
                <Pagination
                  page={Math.min(page, totalPages)}
                  pageSize={pageSize}
                  total={faqs.length}
                  onPageChange={setPage}
                />
              )}
            </div>
          </section>
        </div>

        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#121826]">
                  {editing ? "Edit FAQ" : "Add FAQ"}
                </h3>
                <button onClick={close} className="rounded-lg p-2 text-[#667085] hover:bg-[#F7F9FC]">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Question</span>
                  <input
                    value={form.question}
                    onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                    className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                    placeholder="e.g. What is the cancellation policy?"
                    required
                  />
                </label>

                <label className="block flex-1">
                  <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Answer</span>
                  <textarea
                    value={form.answer}
                    onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                    className="w-full min-h-32 rounded-xl border border-[#E7EAF0] px-4 py-3 text-sm outline-none focus:border-[#43A9F6] leading-6"
                    placeholder="Provide a clear, helpful answer..."
                    required
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Category</span>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6] bg-white"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c} className="capitalize">{c}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Sort Order</span>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                      className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                      min={0}
                    />
                  </label>
                </div>

                <label className="flex items-center gap-2 text-sm font-semibold text-[#667085]">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  />
                  Active (visible to AI assistant and public FAQ)
                </label>

                <div className="flex justify-end gap-3 border-t border-[#E7EAF0] pt-4 mt-auto">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-xl border border-[#E7EAF0] px-4 py-2 text-sm font-bold text-[#667085] hover:bg-[#F7F9FC]"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={saving}
                    className="rounded-xl bg-[#43A9F6] px-5 py-2 text-sm font-bold text-white hover:bg-[#2F9FE9] disabled:opacity-60"
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
