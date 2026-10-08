"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LuBookOpen as BookOpen,
  LuClock as Clock,
  LuExternalLink as ExternalLink,
  LuEye as Eye,
  LuImageOff as ImageOff,
  LuLayoutGrid as LayoutGrid,
  LuPencil as Pencil,
  LuPlus as Plus,
  LuRefreshCw as RefreshCw,
  LuSearch as Search,
  LuTable as TableIcon,
  LuTrash2 as Trash2,
  LuUser as User,
  LuX as X,
} from "react-icons/lu";

import ModuleWrapper from "@/components/common/ModuleWrapper";
import Loader from "@/components/ui/Loader";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import api from "@/lib/api/client";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import { BlogItem, calculateReadingTime } from "@/lib/types/blog";

export default function AdminBlogsPage() {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "published" | "draft">("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [previewBlog, setPreviewBlog] = useState<BlogItem | null>(null);

  // Pagination for table view
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const loadBlogs = useCallback(async (isSilent = false) => {
    if (isSilent) setIsRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get("/cms/blogs", {
        params: { page: 1, limit: 200 },
      });
      const items = res.data?.items ?? res.data?.data ?? [];
      setBlogs(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Failed to load blogs:", err);
      toast.error("Could not load travel blogs.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadBlogs(false);
  }, [loadBlogs]);

  // Filtered blogs based on search & status
  const filteredBlogs = useMemo(() => {
    const term = search.trim().toLowerCase();
    return blogs.filter((b) => {
      const matchesSearch =
        !term ||
        `${b.title} ${b.slug} ${b.author || ""} ${(b.tags || []).join(" ")} ${b.excerpt || ""}`
          .toLowerCase()
          .includes(term);

      const matchesStatus = !statusFilter || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [blogs, search, statusFilter]);

  // Quick Toggle Status between Draft and Published
  const handleToggleStatus = async (blog: BlogItem) => {
    const nextStatus = blog.status === "published" ? "draft" : "published";
    setTogglingId(blog.id);
    try {
      await api.put(`/cms/blogs/${blog.id}`, {
        ...blog,
        status: nextStatus,
      });
      setBlogs((prev) =>
        prev.map((b) => (b.id === blog.id ? { ...b, status: nextStatus } : b))
      );
      toast.success(
        nextStatus === "published"
          ? `"${blog.title}" is now published live!`
          : `"${blog.title}" switched to draft.`
      );
    } catch {
      toast.error("Could not update publication status.");
    } finally {
      setTogglingId(null);
    }
  };

  // Delete Blog
  const handleDelete = async (blog: BlogItem) => {
    const ok = await confirm({
      title: "Delete Article?",
      message: `Are you sure you want to permanently delete "${blog.title}"? This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;

    try {
      await api.delete(`/cms/blogs/${blog.id}`);
      setBlogs((items) => items.filter((b) => b.id !== blog.id));
      toast.success("Blog article deleted successfully.");
    } catch {
      toast.error("Could not delete the article.");
    }
  };

  // Stats calculation
  const totalCount = blogs.length;
  const publishedCount = blogs.filter((b) => b.status === "published").length;
  const draftCount = blogs.filter((b) => b.status === "draft").length;
  const allTags = new Set(blogs.flatMap((b) => b.tags || []));

  // Table Columns
  const tableColumns: DataTableColumn<BlogItem>[] = [
    {
      key: "article",
      header: "Article & Author",
      className: "min-w-[280px]",
      render: (blog) => (
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
            {blog.featured_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={blog.featured_image}
                alt={blog.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-400">
                <ImageOff size={16} />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <Link
              href={`/admin/blogs/${blog.id}/edit`}
              className="font-bold text-slate-900 hover:text-blue-600 transition block truncate text-sm"
            >
              {blog.title}
            </Link>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
              <span className="font-mono text-[11px] text-slate-400">
                /blogs/{blog.slug}
              </span>
              <span>·</span>
              <span>{blog.author || "Tourvaa Editorial"}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "whitespace-nowrap",
      render: (blog) => (
        <button
          type="button"
          disabled={togglingId === blog.id}
          onClick={() => void handleToggleStatus(blog)}
          title="Click to toggle status"
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition shadow-2xs ${
            blog.status === "published"
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 hover:bg-emerald-100"
              : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 hover:bg-amber-100"
          } ${togglingId === blog.id ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              blog.status === "published" ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
          <span>{blog.status === "published" ? "Published" : "Draft"}</span>
        </button>
      ),
    },
    {
      key: "tags",
      header: "Tags",
      className: "min-w-[180px]",
      render: (blog) => (
        <div className="flex flex-wrap gap-1">
          {(blog.tags || []).slice(0, 2).map((t) => (
            <span
              key={t}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200/80"
            >
              {t}
            </span>
          ))}
          {(blog.tags || []).length > 2 && (
            <span className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
              +{blog.tags!.length - 2}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "reading_time",
      header: "Read Time",
      className: "whitespace-nowrap text-xs text-slate-600 tabular-nums",
      render: (blog) => `${calculateReadingTime(blog.content || "")} min read`,
    },
    {
      key: "date",
      header: "Last Updated",
      className: "whitespace-nowrap text-xs text-slate-500 tabular-nums",
      render: (blog) =>
        blog.updated_at
          ? new Date(blog.updated_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—",
    },
    {
      key: "actions",
      header: "Actions",
      className: "whitespace-nowrap text-right min-w-[140px]",
      render: (blog) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setPreviewBlog(blog)}
            title="Quick Preview"
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-50 hover:text-slate-800 transition"
          >
            <Eye size={13} />
          </button>

          {blog.status === "published" && (
            <a
              href={`/blogs/${blog.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="View on Live Website"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-600 shadow-2xs hover:bg-blue-50 transition"
            >
              <ExternalLink size={13} />
            </a>
          )}

          <Link
            href={`/admin/blogs/${blog.id}/edit`}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition"
          >
            <Pencil size={12} className="text-slate-400" />
            <span>Edit</span>
          </Link>

          <button
            type="button"
            onClick={() => void handleDelete(blog)}
            title="Delete Article"
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-2xs hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModuleWrapper title="Travel Blogs & Editorial" requiredPermission="blogs.view">
      {dialog}

      <div className="space-y-6">
        {/* ── Executive Header Banner ── */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute right-32 -bottom-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold tracking-wide uppercase text-blue-200 backdrop-blur-xs">
                <BookOpen size={12} /> Editorial Studio
              </span>
              <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white">
                Travel Blogs &amp; Destination Guides
              </h1>
              <p className="mt-1.5 max-w-xl text-sm text-slate-300">
                Craft immersive destination itineraries, cultural insights, and SEO-optimized travel guides to inspire and convert travelers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => void loadBlogs(true)}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition shadow-2xs disabled:opacity-50"
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>

              <Link
                href="/admin/blogs/create"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-black text-slate-950 hover:bg-slate-100 shadow-md transition hover:-translate-y-0.5"
              >
                <Plus size={16} />
                <span>New Article</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Articles
              </p>
              <p className="mt-1 text-2xl font-black text-white tabular-nums">{totalCount}</p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 backdrop-blur-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                Published Live
              </p>
              <p className="mt-1 text-2xl font-black text-emerald-200 tabular-nums">
                {publishedCount}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 backdrop-blur-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Drafts in Progress
              </p>
              <p className="mt-1 text-2xl font-black text-amber-200 tabular-nums">
                {draftCount}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tags &amp; Topics
              </p>
              <p className="mt-1 text-2xl font-black text-white tabular-nums">
                {allTags.size}
              </p>
            </div>
          </div>
        </div>

        {/* ── Filter Bar & Controls ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles, slugs, tags, authors..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9.5 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition hover:bg-white focus:border-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900/10 shadow-2xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Status Segmented Pill */}
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100/70 p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setStatusFilter("")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === ""
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({blogs.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("published")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === "published"
                    ? "bg-white text-emerald-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Published ({publishedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("draft")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === "draft"
                    ? "bg-white text-amber-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Drafts ({draftCount})
              </button>
            </div>
          </div>

          {/* View Mode Toggle: Grid Cards vs Table */}
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100/70 p-1 shadow-2xs">
            <button
              type="button"
              title="Card Grid View"
              onClick={() => setViewMode("grid")}
              className={`rounded-lg p-1.5 text-xs transition ${
                viewMode === "grid"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              title="Table View"
              onClick={() => setViewMode("table")}
              className={`rounded-lg p-1.5 text-xs transition ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <TableIcon size={15} />
            </button>
          </div>
        </div>

        {/* ── Content View ── */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center">
            <Loader label="Loading blog articles..." compact />
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-16 text-center space-y-4 shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <BookOpen size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">No blog articles found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {search || statusFilter
                  ? "No articles matched your active search or filter criteria. Try clearing filters."
                  : "Create your first travel guide or editorial article to engage Tourvaa travelers."}
              </p>
            </div>
            {search || statusFilter ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
              >
                Reset Filters
              </button>
            ) : (
              <Link
                href="/admin/blogs/create"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 shadow-xs"
              >
                <Plus size={14} /> Write First Article
              </Link>
            )}
          </div>
        ) : viewMode === "grid" ? (
          /* ── Visual Cards Grid View ── */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredBlogs.map((blog) => {
              const readMins = calculateReadingTime(blog.content || "");
              return (
                <article
                  key={blog.id}
                  className="group flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300"
                >
                  {/* Banner Image */}
                  <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                    {blog.featured_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={blog.featured_image}
                        alt={blog.banner_alt || blog.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400 bg-slate-100">
                        <ImageOff size={24} />
                      </div>
                    )}

                    {/* Status Pill Badge */}
                    <div className="absolute top-3 right-3">
                      <button
                        type="button"
                        disabled={togglingId === blog.id}
                        onClick={() => void handleToggleStatus(blog)}
                        title="Click to toggle status"
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shadow-xs backdrop-blur-md transition ${
                          blog.status === "published"
                            ? "bg-emerald-500/90 text-white hover:bg-emerald-600"
                            : "bg-amber-500/90 text-white hover:bg-amber-600"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        <span>{blog.status === "published" ? "Published" : "Draft"}</span>
                      </button>
                    </div>

                    {/* Reading Time Pill */}
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-900/80 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-xs">
                        <Clock size={11} />
                        <span>{readMins} min read</span>
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-1 flex-col p-5 space-y-3">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {(blog.tags || []).slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div>
                      <Link
                        href={`/admin/blogs/${blog.id}/edit`}
                        className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-blue-600 transition"
                      >
                        {blog.title}
                      </Link>
                      <p className="font-mono text-[11px] text-slate-400 mt-0.5 truncate">
                        /blogs/{blog.slug}
                      </p>
                    </div>

                    <p className="line-clamp-2 text-xs text-slate-500 leading-relaxed">
                      {blog.excerpt || "No excerpt summary provided."}
                    </p>

                    {/* Card Footer */}
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                        <User size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{blog.author || "Tourvaa"}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPreviewBlog(blog)}
                          title="Quick Preview"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
                        >
                          <Eye size={13} />
                        </button>

                        {blog.status === "published" && (
                          <a
                            href={`/blogs/${blog.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View on Live Site"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50 transition"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}

                        <Link
                          href={`/admin/blogs/${blog.id}/edit`}
                          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                        >
                          <Pencil size={12} className="text-slate-400" />
                          <span>Edit</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => void handleDelete(blog)}
                          title="Delete Article"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* ── Compact Table View ── */
          <DataTable
            ariaLabel="Blogs Table"
            columns={tableColumns}
            rows={filteredBlogs}
            page={page}
            pageSize={pageSize}
            total={filteredBlogs.length}
            totalPages={Math.ceil(filteredBlogs.length / pageSize) || 1}
            onPageChange={setPage}
            emptyTitle="No blogs found"
          />
        )}
      </div>

      {/* ── Quick Preview Modal ── */}
      {previewBlog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4 sm:p-8 backdrop-blur-xs flex items-center justify-center">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl relative">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Article Preview
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    previewBlog.status === "published"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {previewBlog.status === "published" ? "Live" : "Draft"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/blogs/${previewBlog.id}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Pencil size={13} /> Edit Article
                </Link>
                <button
                  type="button"
                  onClick={() => setPreviewBlog(null)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Preview Hero Banner */}
            <div className="relative h-80 bg-[#063c42] w-full">
              {previewBlog.featured_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewBlog.featured_image}
                  alt={previewBlog.banner_alt || previewBlog.title}
                  className="h-full w-full object-cover opacity-60"
                />
              ) : (
                <div className="h-full w-full bg-slate-800 flex items-center justify-center text-slate-400">
                  No cover banner image
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 max-w-3xl mx-auto px-6 pb-8">
                <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
                  {(previewBlog.tags || [])[0] || "Travel Guide"}
                </span>
                <h1 className="mt-3 text-2xl sm:text-4xl font-black text-white drop-shadow-sm">
                  {previewBlog.banner_title || previewBlog.title}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium text-white/80">
                  <span className="flex items-center gap-1.5">
                    <User size={14} className="text-white/60" />
                    {previewBlog.author || "Tourvaa"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-white/60" />
                    {calculateReadingTime(previewBlog.content || "")} min read
                  </span>
                </div>
              </div>
            </div>

            {/* Preview Content */}
            <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
              {previewBlog.excerpt && (
                <p className="text-lg font-medium leading-relaxed text-slate-600 border-l-4 border-blue-600 pl-4 italic">
                  {previewBlog.excerpt}
                </p>
              )}

              <article
                className="space-y-6 text-base leading-relaxed text-slate-700 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-slate-950 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-slate-950 [&_a]:text-blue-600 [&_a]:underline [&_strong]:text-slate-950 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-600 [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:rounded-2xl"
                dangerouslySetInnerHTML={{
                  __html: previewBlog.content || "<p class='italic text-slate-400'>No content.</p>",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </ModuleWrapper>
  );
}
