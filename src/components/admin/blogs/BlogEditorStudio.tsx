"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LuTriangleAlert as AlertTriangle,
  LuArrowLeft as ArrowLeft,
  LuCalendar as Calendar,
  LuCircleCheck as CircleCheck,
  LuCircleHelp as CircleHelp,
  LuClock as Clock,
  LuExternalLink as ExternalLink,
  LuEye as Eye,
  LuGlobe as Globe,
  LuLayers as Layers,
  LuLock as Lock,
  LuLockOpen as Unlock,
  LuMap as Map,
  LuPlus as Plus,
  LuRefreshCw as RefreshCw,
  LuSave as Save,
  LuSend as Send,
  LuTag as Tag,
  LuTrash2 as Trash2,
  LuUser as User,
  LuX as X,
  LuZap as Zap,
} from "react-icons/lu";
import AdminAssetUpload from "@/components/operations/AdminAssetUpload";
import BlogContentEditor from "./BlogContentEditor";
import {
  BLOG_CATEGORIES,
  BlogFormData,
  BlogItem,
  calculateReadingTime,
  cleanHtmlToHumanText,
  DEFAULT_BLOG_FORM,
  extractFaqsFromContent,
  formatBlogTextToHtml,
  generateTableOfContents,
  POPULAR_TRAVEL_TAGS,
  slugifyBlogTitle,
} from "@/lib/types/blog";
import api from "@/lib/api/client";
import { useToast } from "@/hooks/useToast";

interface BlogEditorStudioProps {
  initialBlog?: BlogItem | null;
  onSaved?: (blog: BlogItem) => void;
}

function buildInitialForm(initialBlog?: BlogItem | null): BlogFormData {
  if (initialBlog) {
    const extracted = extractFaqsFromContent(initialBlog.content || "");
    const humanText = cleanHtmlToHumanText(extracted.cleanContent);
    return {
      title: initialBlog.title || "",
      slug: initialBlog.slug || "",
      excerpt: initialBlog.excerpt || "",
      content: humanText,
      featured_image: initialBlog.featured_image || "",
      banner_title: initialBlog.banner_title || "",
      banner_alt: initialBlog.banner_alt || "",
      author: initialBlog.author || "Tourvaa Editorial",
      category: initialBlog.category || "",
      tags: Array.isArray(initialBlog.tags) ? initialBlog.tags : [],
      seo_title: initialBlog.seo_title || "",
      seo_description: initialBlog.seo_description || "",
      og_image: initialBlog.og_image || "",
      related_tour_ids: Array.isArray(initialBlog.related_tour_ids) ? initialBlog.related_tour_ids : [],
      scheduled_at: initialBlog.scheduled_at || "",
      status: initialBlog.status || "draft",
      faqs: initialBlog.faqs?.length ? initialBlog.faqs : extracted.faqs,
    };
  }
  return DEFAULT_BLOG_FORM;
}

export default function BlogEditorStudio({
  initialBlog,
  onSaved,
}: BlogEditorStudioProps) {
  const router = useRouter();
  const toast = useToast();
  const savedFormRef = useRef<BlogFormData>(buildInitialForm(initialBlog));

  const [form, setForm] = useState<BlogFormData>(() => buildInitialForm(initialBlog));
  const [saving, setSaving] = useState(false);
  const [slugLocked, setSlugLocked] = useState(Boolean(initialBlog?.slug));
  const [tagInput, setTagInput] = useState("");
  const [showPublicPreview, setShowPublicPreview] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeSidePanel, setActiveSidePanel] = useState<"publish" | "media" | "tags" | "seo" | "social" | "tours">("publish");

  // FAQ state
  const [newFaqQuestion, setNewFaqQuestion] = useState("");
  const [newFaqAnswer, setNewFaqAnswer] = useState("");

  // Related tours search
  const [tourSearch, setTourSearch] = useState("");
  const [tourResults, setTourResults] = useState<{ id: number; title: string }[]>([]);
  const [tourSearching, setTourSearching] = useState(false);
  const [tourTitleMap, setTourTitleMap] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    if (Array.isArray(initialBlog?.related_tours)) {
      initialBlog.related_tours.forEach((t: { id: number; title: string }) => {
        if (t?.id && t?.title) map[t.id] = t.title;
      });
    }
    return map;
  });

  useEffect(() => {
    const missingIds = form.related_tour_ids.filter((id) => !tourTitleMap[id]);
    if (!missingIds.length) return;
    api
      .get("/tours", { params: { ids: missingIds.join(","), limit: 50 } })
      .then((res) => {
        const items = res.data?.items ?? res.data?.data ?? [];
        if (Array.isArray(items)) {
          setTourTitleMap((prev) => {
            const next = { ...prev };
            items.forEach((t: { id: number; title: string }) => {
              if (t?.id && t?.title) next[t.id] = t.title;
            });
            return next;
          });
        }
      })
      .catch(() => {});
  }, [form.related_tour_ids, tourTitleMap]);

  // Track unsaved changes
  const updateForm = useCallback((updater: (prev: BlogFormData) => BlogFormData) => {
    setForm((prev) => {
      const next = updater(prev);
      setHasUnsavedChanges(JSON.stringify(next) !== JSON.stringify(savedFormRef.current));
      return next;
    });
  }, []);

  // Browser beforeunload warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  // Structured FAQ handlers
  const handleAddFaq = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newFaqQuestion.trim()) { toast.error("Please enter an FAQ question."); return; }
    if (!newFaqAnswer.trim()) { toast.error("Please enter an FAQ answer."); return; }
    updateForm((prev) => ({
      ...prev,
      faqs: [...(prev.faqs || []), { question: newFaqQuestion.trim(), answer: newFaqAnswer.trim() }],
    }));
    setNewFaqQuestion("");
    setNewFaqAnswer("");
    toast.success("FAQ item added!");
  };

  const handleRemoveFaq = (idx: number) => {
    updateForm((prev) => ({ ...prev, faqs: (prev.faqs || []).filter((_, i) => i !== idx) }));
  };

  // Slug handlers
  const handleTitleChange = (newTitle: string) => {
    updateForm((prev) => ({
      ...prev,
      title: newTitle,
      slug: slugLocked ? prev.slug : slugifyBlogTitle(newTitle),
    }));
  };

  const regenerateSlug = () => {
    updateForm((prev) => ({ ...prev, slug: slugifyBlogTitle(prev.title || "untitled-article") }));
  };

  // Tag handlers
  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim();
    if (!clean || form.tags.includes(clean)) return;
    updateForm((prev) => ({ ...prev, tags: [...prev.tags, clean] }));
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tagToRemove) }));
  };

  // Related Tours search
  const searchTours = useCallback(async (q: string) => {
    if (!q.trim()) { setTourResults([]); return; }
    setTourSearching(true);
    try {
      const res = await api.get("/tours", { params: { search: q, limit: 8, page: 1 } });
      const items = res.data?.items ?? res.data?.data ?? [];
      setTourResults(Array.isArray(items) ? items.map((t: { id: number; title: string }) => ({ id: t.id, title: t.title })) : []);
    } catch {
      setTourResults([]);
    } finally {
      setTourSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void searchTours(tourSearch), 300);
    return () => clearTimeout(t);
  }, [tourSearch, searchTours]);

  const addRelatedTour = (tour: { id: number; title: string }) => {
    if (form.related_tour_ids.includes(tour.id)) return;
    setTourTitleMap((prev) => ({ ...prev, [tour.id]: tour.title }));
    updateForm((prev) => ({ ...prev, related_tour_ids: [...prev.related_tour_ids, tour.id] }));
    setTourSearch("");
    setTourResults([]);
  };

  const removeRelatedTour = (id: number) => {
    updateForm((prev) => ({ ...prev, related_tour_ids: prev.related_tour_ids.filter((tid) => tid !== id) }));
  };

  // Save handler
  const handleSave = async (statusOverride?: "draft" | "published" | "scheduled") => {
    if (!form.title.trim()) { toast.error("Please enter an article title."); return; }
    if (!form.content.trim()) { toast.error("Please write some article content."); return; }
    if (statusOverride === "scheduled" && !form.scheduled_at) {
      toast.error("Please pick a scheduled publish date & time.");
      return;
    }

    const finalStatus = statusOverride || form.status;
    const finalSlug = form.slug.trim() || slugifyBlogTitle(form.title);
    // FAQs travel in the dedicated `faqs` API field.  Never append their
    // JSON to article content: the backend quite correctly strips comments
    // during sanitisation, which used to expose that JSON publicly.
    const finalContent = form.content.trim();

    // A datetime-local input returns an empty string until the editor chooses
    // a schedule. The API correctly expects a datetime or null, never "".
    const payload = {
      ...form,
      content: finalContent,
      slug: finalSlug,
      status: finalStatus,
      scheduled_at: form.scheduled_at.trim() || null,
    };

    setSaving(true);
    try {
      let savedBlog: BlogItem;
      if (initialBlog?.id) {
        const res = await api.put(`/cms/blogs/${initialBlog.id}`, payload);
        savedBlog = res.data?.data || res.data;
        toast.success("Blog article successfully updated!");
      } else {
        const res = await api.post("/cms/blogs", payload);
        savedBlog = res.data?.data || res.data;
        toast.success(
          finalStatus === "published"
            ? "Blog article published live!"
            : finalStatus === "scheduled"
            ? "Blog article scheduled for publish!"
            : "Blog article saved as draft."
        );
      }
      savedFormRef.current = { ...form };
      setHasUnsavedChanges(false);
      if (onSaved) { onSaved(savedBlog); } else { router.push("/admin/blogs"); }
    } catch (err: unknown) {
      console.error("Save error:", err);
      toast.error("Failed to save the blog article. Please check required fields.");
    } finally {
      setSaving(false);
    }
  };

  const readTime = calculateReadingTime(form.content);
  const effectiveSeoTitle = form.seo_title || form.title || "Tourvaa Travel Guides";
  const effectiveSeoDesc =
    form.seo_description || form.excerpt ||
    "Discover handpicked travel itineraries, cultural destinations, and insider guides on Tourvaa.";
  const tocItems = generateTableOfContents(form.content);

  const SIDE_PANELS = [
    { id: "publish" as const, label: "Publish", icon: <Zap size={14} /> },
    { id: "media" as const, label: "Media", icon: <Layers size={14} /> },
    { id: "tags" as const, label: "Tags", icon: <Tag size={14} /> },
    { id: "seo" as const, label: "SEO", icon: <Globe size={14} /> },
    { id: "social" as const, label: "Social", icon: <Eye size={14} /> },
    { id: "tours" as const, label: "Tours", icon: <Map size={14} /> },
  ];

  return (
    <div className="space-y-4">
      {/* ── Unsaved Changes Banner ── */}
      {hasUnsavedChanges && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          <span className="font-semibold">You have unsaved changes.</span>
          <span className="text-amber-600 text-xs">Remember to save before leaving.</span>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition disabled:opacity-50"
          >
            <Save size={12} /> Save Now
          </button>
        </div>
      )}

      {/* ── Studio Top Action Bar ── */}
      <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-5 py-3.5 shadow-xs">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link
            href="/admin/blogs"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs"
            title="Return to Blogs"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 truncate max-w-[240px] sm:max-w-md">
                {initialBlog ? `Editing: ${form.title || "Untitled"}` : "Create New Article"}
              </h2>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  form.status === "published"
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                    : form.status === "scheduled"
                    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20"
                    : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    form.status === "published" ? "bg-emerald-500" : form.status === "scheduled" ? "bg-blue-500" : "bg-amber-500"
                  }`}
                />
                {form.status === "published" ? "Live" : form.status === "scheduled" ? "Scheduled" : "Draft"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {form.slug ? `/blogs/${form.slug}` : "Slug not set"} · {readTime} min read
            </p>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPublicPreview(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <Eye size={13} className="text-slate-400" />
            <span>Preview</span>
          </button>

          {initialBlog && form.status === "published" && (
            <a
              href={`/blogs/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50/60 shadow-2xs transition"
            >
              <ExternalLink size={13} />
              <span>View Live</span>
            </a>
          )}

          {form.status !== "published" && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave("draft")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition disabled:opacity-50"
            >
              <Save size={13} />
              <span>Save Draft</span>
            </button>
          )}

          {form.status !== "scheduled" && (
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                updateForm((prev) => ({ ...prev, status: "scheduled" }));
                setActiveSidePanel("publish");
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 shadow-2xs transition disabled:opacity-50"
            >
              <Calendar size={13} />
              <span>Schedule</span>
            </button>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave("published")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow-xs transition disabled:opacity-50"
          >
            <Send size={13} />
            <span>{saving ? "Saving…" : form.status === "published" ? "Update Article" : "Publish Live"}</span>
          </button>
        </div>
      </div>

      {/* ── Main Studio Layout: Left Content + Right Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── Left: Article Canvas ── */}
        <div className="lg:col-span-8 space-y-5">
          {/* Title, Slug, Excerpt Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            {/* Title */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Article Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. 10 Essential Experiences for Your First Trip to Japan"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white focus:bg-white px-4 py-3 text-lg font-bold text-slate-900 shadow-2xs outline-none transition focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 placeholder:text-slate-300"
              />
            </div>

            {/* Slug */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  URL Slug
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSlugLocked(!slugLocked)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                  >
                    {slugLocked ? <Lock size={11} /> : <Unlock size={11} />}
                    <span>{slugLocked ? "Locked" : "Auto"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={regenerateSlug}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    <RefreshCw size={10} />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm shadow-2xs">
                <span className="font-mono text-xs text-slate-400 select-none shrink-0">tourvaa.com/blogs/</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugLocked(true);
                    updateForm((prev) => ({ ...prev, slug: slugifyBlogTitle(e.target.value) }));
                  }}
                  placeholder="article-slug"
                  className="w-full bg-transparent pl-1 font-mono text-xs font-semibold text-slate-800 outline-none"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Article Category
              </label>
              <select
                value={form.category}
                onChange={(e) => updateForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-2xs outline-none transition focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10"
              >
                <option value="">— Select a category —</option>
                {BLOG_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Excerpt */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Summary / Excerpt
                </label>
                <span className={`text-[11px] font-mono ${form.excerpt.length > 200 ? "text-amber-600 font-bold" : "text-slate-400"}`}>
                  {form.excerpt.length}/200
                </span>
              </div>
              <textarea
                rows={2}
                value={form.excerpt}
                onChange={(e) => updateForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                placeholder="A compelling 2-sentence preview shown on article cards and search snippets..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white focus:bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-2xs outline-none transition focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
          </div>

          {/* ── Table of Contents Preview (auto-generated) ── */}
          {tocItems.length > 0 && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                  <Layers size={13} />
                </span>
                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  Auto Table of Contents ({tocItems.length} sections)
                </span>
              </div>
              <ol className="space-y-1">
                {tocItems.map((item, idx) => (
                  <li
                    key={idx}
                    className={`text-xs font-medium text-indigo-700 flex items-center gap-1.5 ${
                      item.level === 3 ? "pl-4 text-indigo-500" : ""
                    }`}
                  >
                    <span className="text-indigo-400 tabular-nums w-5 text-right shrink-0">{idx + 1}.</span>
                    {item.text}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Rich Content Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Article Body <span className="text-rose-500">*</span>
              </span>
              <span className="text-xs text-slate-400">
                Headings, lists, quotes, images & travel callouts
              </span>
            </div>
            <BlogContentEditor
              value={form.content}
              onChange={(val) => updateForm((prev) => ({ ...prev, content: val }))}
              placeholder="Write your story, tips, and destination highlights here using simple text..."
              onAddFaqItem={(q, a) => {
                updateForm((prev) => ({
                  ...prev,
                  faqs: [...(prev.faqs || []), { question: q, answer: a }],
                }));
                toast.success("FAQ item added to the list below!");
              }}
            />
          </div>

          {/* ── Article FAQs ── */}
          <div id="article-faqs-card" className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4 scroll-mt-24">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                  <CircleHelp size={16} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Article FAQs</h3>
                  <p className="text-xs text-slate-500">Plain text Q&A. Renders as structured schema on the public page.</p>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                {(form.faqs || []).length} {(form.faqs || []).length === 1 ? "FAQ" : "FAQs"}
              </span>
            </div>

            {(form.faqs || []).length > 0 && (
              <div className="space-y-2.5">
                {form.faqs!.map((faq, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 transition hover:bg-slate-50"
                  >
                    <div className="space-y-1 text-xs flex-1">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="text-sky-600 font-black">Q{idx + 1}:</span>
                        {faq.question}
                      </p>
                      <p className="text-slate-600 leading-relaxed pl-5 font-medium">{faq.answer}</p>
                    </div>
                    <button
                      type="button"
                      aria-label="Remove FAQ item"
                      onClick={() => handleRemoveFaq(idx)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New FAQ */}
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-4 space-y-3">
              <span className="text-xs font-bold text-slate-700 block">+ Add a New FAQ Item</span>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">Question</label>
                <input
                  type="text"
                  value={newFaqQuestion}
                  onChange={(e) => setNewFaqQuestion(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddFaq(); } }}
                  placeholder="e.g. Is an international driving permit required?"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 transition"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">Answer</label>
                <textarea
                  rows={2}
                  value={newFaqAnswer}
                  onChange={(e) => setNewFaqAnswer(e.target.value)}
                  placeholder="e.g. Yes, travelers planning to rent vehicles must carry a valid 1949 Geneva Convention IDP."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 outline-none focus:border-slate-800 resize-none focus:ring-2 focus:ring-slate-900/10 transition"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow-2xs"
                >
                  <Plus size={13} />
                  <span>Add FAQ</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Sidebar ── */}
        <div className="lg:col-span-4 space-y-4">
          {/* Sidebar Tab Navigation */}
          <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xs">
            {SIDE_PANELS.map((panel) => (
              <button
                key={panel.id}
                type="button"
                onClick={() => setActiveSidePanel(panel.id)}
                className={`inline-flex shrink-0 items-center justify-center gap-1 rounded-xl px-3 py-2 text-[11px] font-bold transition ${
                  activeSidePanel === panel.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {panel.icon}
                <span>{panel.label}</span>
              </button>
            ))}
          </div>

          {/* ── Panel: Publish & Status ── */}
          {activeSidePanel === "publish" && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">Publishing & Status</h3>

              {/* Status Selector */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["draft", "published", "scheduled"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateForm((prev) => ({ ...prev, status: s }))}
                      className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border text-[10px] font-bold transition ${
                        form.status === s
                          ? s === "published"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20"
                            : s === "scheduled"
                            ? "border-blue-300 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20"
                            : "border-amber-300 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20"
                          : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full mb-1 ${
                        s === "published" ? "bg-emerald-500" : s === "scheduled" ? "bg-blue-500" : "bg-amber-500"
                      }`} />
                      <span className="capitalize">{s}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scheduled At */}
              {form.status === "scheduled" && (
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Publish Date & Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.scheduled_at}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={(e) => updateForm((prev) => ({ ...prev, scheduled_at: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white px-3.5 py-2 text-xs font-medium text-slate-800 shadow-2xs outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                  />
                  {form.scheduled_at && (
                    <p className="mt-1.5 text-[11px] text-blue-600 font-medium">
                      <Clock size={11} className="inline mr-1" />
                      Publishes {new Date(form.scheduled_at).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}
                    </p>
                  )}
                </div>
              )}

              {/* Author */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Author Byline</label>
                <div className="relative">
                  <User size={13} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={form.author}
                    onChange={(e) => updateForm((prev) => ({ ...prev, author: e.target.value }))}
                    placeholder="e.g. Tourvaa Editorial"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white pl-9 pr-3.5 py-2 text-sm font-medium text-slate-800 shadow-2xs outline-none transition focus:border-slate-800"
                  />
                </div>
                <div className="flex gap-1.5 mt-2">
                  {["Tourvaa Editorial", "Local Expert", "Guest Writer"].map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => updateForm((prev) => ({ ...prev, author: a }))}
                      className="text-[10px] font-semibold rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600 hover:bg-slate-100 transition"
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timestamps */}
              {initialBlog && (
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1.5 text-[11px] text-slate-500">
                  {initialBlog.created_at && (
                    <div className="flex items-center gap-2">
                      <Calendar size={11} className="text-slate-400 shrink-0" />
                      <span>Created: {new Date(initialBlog.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })}</span>
                    </div>
                  )}
                  {initialBlog.published_at && (
                    <div className="flex items-center gap-2">
                      <CircleCheck size={11} className="text-emerald-500 shrink-0" />
                      <span>Published: {new Date(initialBlog.published_at).toLocaleDateString("en-US", { dateStyle: "medium" })}</span>
                    </div>
                  )}
                  {initialBlog.updated_at && (
                    <div className="flex items-center gap-2">
                      <RefreshCw size={11} className="text-slate-400 shrink-0" />
                      <span>Updated: {new Date(initialBlog.updated_at).toLocaleDateString("en-US", { dateStyle: "medium" })}</span>
                    </div>
                  )}
                  {initialBlog.view_count != null && (
                    <div className="flex items-center gap-2">
                      <Eye size={11} className="text-slate-400 shrink-0" />
                      <span>{initialBlog.view_count.toLocaleString()} page views</span>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Publish Buttons */}
              <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
                {form.status !== "published" && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSave("published")}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-700 shadow-xs transition disabled:opacity-50"
                  >
                    <Send size={13} /> Publish Live Now
                  </button>
                )}
                {form.status === "scheduled" && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSave("scheduled")}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-700 shadow-xs transition disabled:opacity-50"
                  >
                    <Calendar size={13} /> Schedule Article
                  </button>
                )}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave("draft")}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition disabled:opacity-50"
                >
                  <Save size={13} /> Save as Draft
                </button>
              </div>
            </div>
          )}

          {/* ── Panel: Media ── */}
          {activeSidePanel === "media" && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">Featured Cover Banner</h3>

              <AdminAssetUpload
                label="Article Banner Image"
                value={form.featured_image}
                onChange={(val) => updateForm((prev) => ({ ...prev, featured_image: val }))}
              />
              {form.featured_image && (
                <div className="overflow-hidden rounded-xl border border-slate-200 aspect-[16/9] bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.featured_image} alt="Banner preview" className="h-full w-full object-cover" />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Banner Title (Hero Overlay)
                </label>
                <input
                  type="text"
                  value={form.banner_title}
                  onChange={(e) => updateForm((prev) => ({ ...prev, banner_title: e.target.value }))}
                  placeholder="Defaults to article title"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white px-3.5 py-2 text-xs font-medium text-slate-800 shadow-2xs outline-none transition focus:border-slate-800"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Banner Alt Text (SEO)
                </label>
                <input
                  type="text"
                  value={form.banner_alt}
                  onChange={(e) => updateForm((prev) => ({ ...prev, banner_alt: e.target.value }))}
                  placeholder="Descriptive summary for screen readers"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white px-3.5 py-2 text-xs font-medium text-slate-800 shadow-2xs outline-none transition focus:border-slate-800"
                />
              </div>
            </div>
          )}

          {/* ── Panel: Tags ── */}
          {activeSidePanel === "tags" && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-bold text-slate-900">Tags & Taxonomy</h3>
                <span className="text-[11px] font-semibold text-slate-400">{form.tags.length} selected</span>
              </div>

              {/* Current Tags */}
              <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-xl border border-slate-200 bg-slate-50/50">
                {form.tags.length === 0 && <span className="text-xs text-slate-400 italic">No tags selected.</span>}
                {form.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 border border-slate-200/90 shadow-2xs">
                    <Tag size={11} className="text-slate-400" />
                    <span>{tag}</span>
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="text-slate-400 hover:text-rose-600 transition">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>

              {/* Custom Tag Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); handleAddTag(tagInput); }
                  }}
                  placeholder="Type tag & press enter"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-800 transition"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(tagInput)}
                  className="shrink-0 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                >
                  Add
                </button>
              </div>

              {/* Popular Tags */}
              <div>
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Recommended Travel Tags:
                </span>
                <div className="flex flex-wrap gap-1">
                  {POPULAR_TRAVEL_TAGS.map((t) => {
                    const isSelected = form.tags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={isSelected}
                        onClick={() => handleAddTag(t)}
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition ${
                          isSelected
                            ? "bg-slate-100 text-slate-400 cursor-default"
                            : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-white hover:border-slate-300"
                        }`}
                      >
                        {isSelected ? `✓ ${t}` : `+ ${t}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Panel: SEO ── */}
          {activeSidePanel === "seo" && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">Search Engine Optimization</h3>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">SEO Meta Title</label>
                  <span className={`text-[11px] font-mono ${
                    form.seo_title.length > 60
                      ? "text-red-600 font-bold"
                      : form.seo_title.length >= 55
                      ? "text-amber-600 font-bold"
                      : "text-slate-400"
                  }`}>
                    {form.seo_title.length}/60
                  </span>
                </div>
                <input
                  type="text"
                  value={form.seo_title}
                  onChange={(e) => updateForm((prev) => ({ ...prev, seo_title: e.target.value }))}
                  placeholder={form.title || "Target article title for Google search"}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white px-3.5 py-2 text-xs font-medium text-slate-800 shadow-2xs outline-none transition focus:border-slate-800"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Meta Description</label>
                  <span className={`text-[11px] font-mono ${form.seo_description.length > 160 ? "text-amber-600 font-bold" : "text-slate-400"}`}>
                    {form.seo_description.length}/160
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={form.seo_description}
                  onChange={(e) => updateForm((prev) => ({ ...prev, seo_description: e.target.value }))}
                  placeholder={form.excerpt || "Engaging summary for Google search snippets."}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white px-3.5 py-2 text-xs font-medium text-slate-800 shadow-2xs outline-none transition focus:border-slate-800"
                />
              </div>

              {/* Google SERP Preview */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <span className="block mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Google Search Preview
                </span>
                <p className="truncate text-xs text-emerald-700 font-medium font-mono">
                  https://www.tourvaa.com › blogs › {form.slug || "sample-article"}
                </p>
                <h4 className="mt-0.5 line-clamp-1 text-base font-medium text-[#1a0dab] hover:underline cursor-pointer">
                  {effectiveSeoTitle} | Tourvaa
                </h4>
                <p className="mt-1 line-clamp-2 text-xs text-slate-600 leading-snug">{effectiveSeoDesc}</p>
              </div>
            </div>
          )}

          {/* ── Panel: Social (Open Graph / Twitter) ── */}
          {activeSidePanel === "social" && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">Social Share Preview</h3>
              <p className="text-xs text-slate-500">
                Controls how this article appears when shared on Facebook, Twitter/X, WhatsApp, and LinkedIn.
              </p>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  OG Image URL
                </label>
                <input
                  type="url"
                  value={form.og_image}
                  onChange={(e) => updateForm((prev) => ({ ...prev, og_image: e.target.value }))}
                  placeholder="Defaults to article banner image"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white px-3.5 py-2 text-xs font-medium text-slate-800 shadow-2xs outline-none transition focus:border-slate-800"
                />
                {!form.og_image && form.featured_image && (
                  <button
                    type="button"
                    onClick={() => updateForm((prev) => ({ ...prev, og_image: prev.featured_image }))}
                    className="mt-1.5 text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    Use banner image
                  </button>
                )}
              </div>

              {/* Facebook OG Card Preview */}
              <div>
                <span className="block mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Facebook / LinkedIn Preview</span>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                  {(form.og_image || form.featured_image) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.og_image || form.featured_image}
                      alt="OG preview"
                      className="w-full h-32 object-cover border-b border-slate-100"
                    />
                  ) : (
                    <div className="w-full h-32 bg-slate-100 flex items-center justify-center border-b border-slate-100">
                      <Globe size={24} className="text-slate-300" />
                    </div>
                  )}
                  <div className="p-3 bg-[#f0f2f5]">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">TOURVAA.COM</p>
                    <p className="text-xs font-bold text-slate-900 line-clamp-1 mt-0.5">
                      {effectiveSeoTitle}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{effectiveSeoDesc}</p>
                  </div>
                </div>
              </div>

              {/* Twitter Card Preview */}
              <div>
                <span className="block mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Twitter/X Preview</span>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                  {(form.og_image || form.featured_image) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.og_image || form.featured_image}
                      alt="Twitter preview"
                      className="w-full h-28 object-cover border-b border-slate-100"
                    />
                  ) : (
                    <div className="w-full h-28 bg-slate-100 flex items-center justify-center border-b border-slate-100">
                      <Globe size={20} className="text-slate-300" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-xs font-bold text-slate-900 line-clamp-1">{effectiveSeoTitle}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{effectiveSeoDesc}</p>
                    <p className="text-[10px] text-slate-400 mt-1">tourvaa.com</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Panel: Related Tours ── */}
          {activeSidePanel === "tours" && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-bold text-slate-900">Related Tours</h3>
                <span className="text-[11px] font-semibold text-slate-400">{form.related_tour_ids.length} linked</span>
              </div>
              <p className="text-xs text-slate-500">
                Link relevant tour packages to this article. They will display as recommendations on the public blog page.
              </p>

              {/* Current linked tours */}
              {form.related_tour_ids.length > 0 && (
                <div className="space-y-2">
                  {form.related_tour_ids.map((tid) => (
                    <div key={tid} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <Map size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{tourTitleMap[tid] || `Tour #${tid}`}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRelatedTour(tid)}
                        className="text-slate-400 hover:text-rose-600 transition"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Tour Search */}
              <div className="relative">
                <input
                  type="text"
                  value={tourSearch}
                  onChange={(e) => setTourSearch(e.target.value)}
                  placeholder="Search tours to link..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 transition"
                />
                {tourSearching && (
                  <RefreshCw size={13} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                )}
              </div>

              {tourResults.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden shadow-xs">
                  {tourResults.map((tour) => {
                    const isLinked = form.related_tour_ids.includes(tour.id);
                    return (
                      <button
                        key={tour.id}
                        type="button"
                        disabled={isLinked}
                        onClick={() => addRelatedTour(tour)}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs transition ${
                          isLinked ? "bg-slate-50 text-slate-400 cursor-default" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <Map size={12} className="text-slate-400 shrink-0" />
                        <span className="flex-1 truncate font-medium">{tour.title}</span>
                        {isLinked ? <CircleCheck size={12} className="text-emerald-500" /> : <Plus size={12} className="text-slate-400" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {tourSearch && tourResults.length === 0 && !tourSearching && (
                <p className="text-center text-xs text-slate-400 py-2">No tours found for &quot;{tourSearch}&quot;</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Public Page Live Layout Preview Modal ── */}
      {showPublicPreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4 sm:p-8 backdrop-blur-xs flex items-center justify-center">
          <div className="w-full max-w-4xl max-h-[90dvh] overflow-y-auto rounded-3xl bg-white shadow-2xl relative">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur-md">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Page Preview</span>
              <button
                type="button"
                onClick={() => setShowPublicPreview(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Preview Hero */}
            <div className="relative h-80 bg-[#063c42] w-full">
              {form.featured_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.featured_image} alt={form.banner_alt || form.title} className="h-full w-full object-cover opacity-60" />
              ) : (
                <div className="h-full w-full bg-slate-800 flex items-center justify-center text-slate-400 text-sm">
                  No banner image uploaded
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 max-w-3xl mx-auto px-6 pb-8">
                {form.category && (
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
                    {form.category}
                  </span>
                )}
                <h1 className="mt-3 text-2xl sm:text-4xl font-black text-white drop-shadow-sm">
                  {form.banner_title || form.title || "Article Headline"}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium text-white/80">
                  <span className="flex items-center gap-1.5"><User size={14} className="text-white/60" />{form.author}</span>
                  <span className="flex items-center gap-1.5"><Clock size={14} className="text-white/60" />{readTime} min read</span>
                </div>
              </div>
            </div>

            {/* Preview: ToC */}
            {tocItems.length > 0 && (
              <div className="max-w-3xl mx-auto px-6 pt-8">
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
                  <h2 className="text-sm font-bold text-indigo-900 mb-3">Table of Contents</h2>
                  <ol className="space-y-1.5">
                    {tocItems.map((item, idx) => (
                      <li key={idx} className={`text-sm font-medium ${item.level === 3 ? "pl-4 text-indigo-500 text-xs" : "text-indigo-700"}`}>
                        <a href={`#${item.anchor}`} className="hover:underline hover:text-indigo-900 transition-colors inline-block">
                          {idx + 1}. {item.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {/* Preview Body */}
            <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
              {form.excerpt && (
                <p className="text-lg font-medium leading-relaxed text-slate-600 border-l-4 border-blue-600 pl-4 italic">
                  {form.excerpt}
                </p>
              )}
              <article
                className="space-y-6 text-base leading-relaxed text-slate-700 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-slate-950 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-slate-950 [&_a]:text-blue-600 [&_a]:underline [&_strong]:text-slate-950 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-600 [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:rounded-2xl"
                dangerouslySetInnerHTML={{
                  __html: formatBlogTextToHtml(form.content) ||
                    "<p class='text-slate-400 italic text-center py-8'>No content written yet.</p>",
                }}
              />

              {/* FAQs Preview */}
              {(form.faqs || []).length > 0 && (
                <div className="rounded-2xl border border-sky-100 bg-sky-50/40 p-6 space-y-4">
                  <h2 className="text-xl font-black text-slate-900">Frequently Asked Questions</h2>
                  {form.faqs!.map((faq, idx) => (
                    <details key={idx} className="group rounded-xl border border-sky-200 bg-white overflow-hidden">
                      <summary className="flex items-center justify-between gap-3 cursor-pointer p-4 font-bold text-slate-900 text-sm list-none hover:bg-sky-50 transition">
                        <span>{faq.question}</span>
                        <span className="text-sky-600 group-open:rotate-180 transition-transform shrink-0">▾</span>
                      </summary>
                      <div className="px-4 pb-4 pt-0 text-sm text-slate-600 leading-relaxed">{faq.answer}</div>
                    </details>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
