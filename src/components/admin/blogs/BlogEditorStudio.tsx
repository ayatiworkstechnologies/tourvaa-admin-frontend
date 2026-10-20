"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LuArrowLeft as ArrowLeft,
  LuCalendar as Calendar,
  LuCircleHelp as CircleHelp,
  LuClock as Clock,
  LuExternalLink as ExternalLink,
  LuEye as Eye,
  LuLock as Lock,
  LuLockOpen as Unlock,
  LuPlus as Plus,
  LuRefreshCw as RefreshCw,
  LuSave as Save,
  LuSend as Send,
  LuTag as Tag,
  LuTrash2 as Trash2,
  LuUser as User,
  LuX as X,
} from "react-icons/lu";
import AdminAssetUpload from "@/components/operations/AdminAssetUpload";
import BlogContentEditor from "./BlogContentEditor";
import {
  BlogFormData,
  BlogItem,
  calculateReadingTime,
  cleanHtmlToHumanText,
  DEFAULT_BLOG_FORM,
  embedFaqsIntoContent,
  extractFaqsFromContent,
  POPULAR_TRAVEL_TAGS,
  slugifyBlogTitle,
} from "@/lib/types/blog";
import api from "@/lib/api/client";
import { useToast } from "@/hooks/useToast";

interface BlogEditorStudioProps {
  initialBlog?: BlogItem | null;
  onSaved?: (blog: BlogItem) => void;
}

export default function BlogEditorStudio({
  initialBlog,
  onSaved,
}: BlogEditorStudioProps) {
  const router = useRouter();
  const toast = useToast();

  const [form, setForm] = useState<BlogFormData>(() => {
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
        tags: Array.isArray(initialBlog.tags) ? initialBlog.tags : [],
        seo_title: initialBlog.seo_title || "",
        seo_description: initialBlog.seo_description || "",
        status: initialBlog.status || "draft",
        faqs: extracted.faqs,
      };
    }
    return DEFAULT_BLOG_FORM;
  });

  const [saving, setSaving] = useState(false);
  const [slugLocked, setSlugLocked] = useState(Boolean(initialBlog?.slug));
  const [tagInput, setTagInput] = useState("");
  const [showPublicPreview, setShowPublicPreview] = useState(false);

  useEffect(() => {
    if (initialBlog) {
      const extracted = extractFaqsFromContent(initialBlog.content || "");
      const humanText = cleanHtmlToHumanText(extracted.cleanContent);
      setForm({
        title: initialBlog.title || "",
        slug: initialBlog.slug || "",
        excerpt: initialBlog.excerpt || "",
        content: humanText,
        featured_image: initialBlog.featured_image || "",
        banner_title: initialBlog.banner_title || "",
        banner_alt: initialBlog.banner_alt || "",
        author: initialBlog.author || "Tourvaa Editorial",
        tags: Array.isArray(initialBlog.tags) ? initialBlog.tags : [],
        seo_title: initialBlog.seo_title || "",
        seo_description: initialBlog.seo_description || "",
        status: initialBlog.status || "draft",
        faqs: extracted.faqs,
      });
      if (initialBlog.slug) {
        setSlugLocked(true);
      }
    }
  }, [initialBlog]);

  // Structured Plain-Text FAQ Inputs (No HTML required!)
  const [newFaqQuestion, setNewFaqQuestion] = useState("");
  const [newFaqAnswer, setNewFaqAnswer] = useState("");

  const handleAddFaq = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newFaqQuestion.trim()) {
      toast.error("Please enter an FAQ question.");
      return;
    }
    if (!newFaqAnswer.trim()) {
      toast.error("Please enter an FAQ answer.");
      return;
    }
    setForm((prev) => ({
      ...prev,
      faqs: [...(prev.faqs || []), { question: newFaqQuestion.trim(), answer: newFaqAnswer.trim() }],
    }));
    setNewFaqQuestion("");
    setNewFaqAnswer("");
    toast.success("FAQ item added!");
  };

  const handleRemoveFaq = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      faqs: (prev.faqs || []).filter((_, i) => i !== idx),
    }));
  };

  // Auto-generate slug when title changes (if slug is not manually locked)
  const handleTitleChange = (newTitle: string) => {
    setForm((prev) => {
      const updated = { ...prev, title: newTitle };
      if (!slugLocked) {
        updated.slug = slugifyBlogTitle(newTitle);
      }
      return updated;
    });
  };

  const regenerateSlug = () => {
    setForm((prev) => ({
      ...prev,
      slug: slugifyBlogTitle(prev.title || "untitled-article"),
    }));
  };

  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim();
    if (!clean || form.tags.includes(clean)) return;
    setForm((prev) => ({
      ...prev,
      tags: [...prev.tags, clean],
    }));
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const handleSave = async (statusOverride?: "draft" | "published") => {
    if (!form.title.trim()) {
      toast.error("Please enter an article title.");
      return;
    }
    if (!form.content.trim()) {
      toast.error("Please write some article content.");
      return;
    }

    const finalStatus = statusOverride || form.status;
    const finalSlug = form.slug.trim() || slugifyBlogTitle(form.title);
    const finalContent = embedFaqsIntoContent(form.content, form.faqs || []);

    const payload = {
      ...form,
      content: finalContent,
      slug: finalSlug,
      status: finalStatus,
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
            : "Blog article saved as draft."
        );
      }

      if (onSaved) {
        onSaved(savedBlog);
      } else {
        router.push("/admin/blogs");
      }
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
    form.seo_description ||
    form.excerpt ||
    "Discover handpicked travel itineraries, cultural destinations, and insider guides on Tourvaa.";

  return (
    <div className="space-y-6">
      {/* ── Studio Top Action Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white px-5 py-4 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/blogs"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs"
            title="Return to Blogs"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 truncate max-w-[280px] sm:max-w-md">
                {initialBlog ? `Editing: ${form.title || "Untitled"}` : "Create New Article"}
              </h2>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  form.status === "published"
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                    : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    form.status === "published" ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                {form.status === "published" ? "Live" : "Draft"}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {form.slug ? `/blogs/${form.slug}` : "Slug not configured yet"} · {readTime} min read
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPublicPreview(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <Eye size={14} className="text-slate-400" />
            <span>Preview Layout</span>
          </button>

          {initialBlog && form.status === "published" && (
            <a
              href={`/blogs/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50/60 shadow-2xs transition"
            >
              <ExternalLink size={13} />
              <span>View Public</span>
            </a>
          )}

          {form.status !== "published" && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave("draft")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition disabled:opacity-50"
            >
              <Save size={14} />
              <span>Save Draft</span>
            </button>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave("published")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4.5 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow-xs transition disabled:opacity-50"
          >
            <Send size={14} />
            <span>{saving ? "Saving..." : form.status === "published" ? "Update Article" : "Publish Live"}</span>
          </button>
        </div>
      </div>

      {/* ── Main Two-Column Studio Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left 8 Columns: Article Canvas ── */}
        <div className="lg:col-span-8 space-y-6">
          {/* Title & Slug Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
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

            {/* Slug Configuration */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  URL Permalink Slug
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSlugLocked(!slugLocked)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                  >
                    {slugLocked ? <Lock size={12} /> : <Unlock size={12} />}
                    <span>{slugLocked ? "Slug Locked" : "Auto-Syncing"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={regenerateSlug}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    <RefreshCw size={11} />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm shadow-2xs">
                <span className="font-mono text-xs text-slate-400 select-none">
                  tourvaa.com/blogs/
                </span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugLocked(true);
                    setForm({ ...form, slug: slugifyBlogTitle(e.target.value) });
                  }}
                  placeholder="japan-first-trip-guide"
                  className="w-full bg-transparent pl-1 font-mono text-xs font-semibold text-slate-800 outline-none"
                />
              </div>
            </div>

            {/* Excerpt Summary */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Summary / Excerpt (Shown on cards and search)
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {form.excerpt.length} characters
                </span>
              </div>
              <textarea
                rows={2}
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                placeholder="A compelling 2-sentence preview of what travelers will learn from this article..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white focus:bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-2xs outline-none transition focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
          </div>

          {/* Rich Content Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Article Body Content <span className="text-rose-500">*</span>
              </span>
              <span className="text-xs text-slate-400">
                Supports headings, lists, quotes, images &amp; styled travel callouts
              </span>
            </div>

            <BlogContentEditor
              value={form.content}
              onChange={(val) => setForm({ ...form, content: val })}
              placeholder="Write your story, tips, and destination highlights here using simple text..."
              onAddFaqItem={(q, a) => {
                setForm((prev) => ({
                  ...prev,
                  faqs: [...(prev.faqs || []), { question: q, answer: a }],
                }));
                toast.success("FAQ item added to the list below!");
              }}
            />
          </div>

          {/* ── Article FAQs Card (Plain Text — No HTML required!) ── */}
          <div id="article-faqs-card" className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4 scroll-mt-24">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                  <CircleHelp size={16} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Article FAQs (Frequently Asked Questions)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add clean question &amp; answer items in plain text. No HTML code required.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                {(form.faqs || []).length} {(form.faqs || []).length === 1 ? "FAQ" : "FAQs"}
              </span>
            </div>

            {/* Existing FAQs List */}
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
                      <p className="text-slate-600 leading-relaxed pl-5 font-medium">
                        {faq.answer}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(idx)}
                      title="Remove this FAQ"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New FAQ Form */}
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-4 space-y-3">
              <span className="text-xs font-bold text-slate-700 block">
                + Add a New FAQ Item
              </span>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  Question (Plain Text)
                </label>
                <input
                  type="text"
                  value={newFaqQuestion}
                  onChange={(e) => setNewFaqQuestion(e.target.value)}
                  placeholder="e.g. Is an international driving permit required?"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 outline-none focus:border-slate-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  Answer (Plain Text)
                </label>
                <textarea
                  rows={2}
                  value={newFaqAnswer}
                  onChange={(e) => setNewFaqAnswer(e.target.value)}
                  placeholder="e.g. Yes, travelers planning to rent vehicles must carry a valid 1949 Geneva Convention IDP alongside their domestic license."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 outline-none focus:border-slate-800 resize-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow-2xs cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add FAQ Item</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right 4 Columns: Metadata, Media, Tags, SEO ── */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card: Publishing Status */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
              Publishing &amp; Status
            </h3>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Publication State
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, status: "draft" })}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition ${
                    form.status === "draft"
                      ? "border-amber-300 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20 shadow-2xs"
                      : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-amber-500 mb-1" />
                  <span>Draft</span>
                  <span className="text-[10px] font-normal text-slate-500 mt-0.5">
                    Private only
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, status: "published" })}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition ${
                    form.status === "published"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-2xs"
                      : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500 mb-1" />
                  <span>Published</span>
                  <span className="text-[10px] font-normal text-slate-500 mt-0.5">
                    Live to visitors
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Author Byline
              </label>
              <div className="relative">
                <User
                  size={14}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  placeholder="e.g. Tourvaa Editorial or Local Guide"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white pl-9 pr-3.5 py-2 text-sm font-medium text-slate-800 shadow-2xs outline-none transition focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
              <div className="flex gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, author: "Tourvaa Editorial" })}
                  className="text-[10px] font-semibold rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600 hover:bg-slate-100"
                >
                  Tourvaa Editorial
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, author: "Local Travel Expert" })}
                  className="text-[10px] font-semibold rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600 hover:bg-slate-100"
                >
                  Local Expert
                </button>
              </div>
            </div>
          </div>

          {/* Card: Cover Image & Banner */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
              Featured Cover Banner
            </h3>

            <AdminAssetUpload
              label="Article Banner Image"
              value={form.featured_image}
              onChange={(val) => setForm({ ...form, featured_image: val })}
            />

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Banner Title (Hero Overlay)
              </label>
              <input
                type="text"
                value={form.banner_title}
                onChange={(e) => setForm({ ...form, banner_title: e.target.value })}
                placeholder="Custom title on banner (defaults to article title)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white px-3.5 py-2 text-xs font-medium text-slate-800 shadow-2xs outline-none transition focus:border-slate-800"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Banner Alt Text (Accessibility &amp; SEO)
              </label>
              <input
                type="text"
                value={form.banner_alt}
                onChange={(e) => setForm({ ...form, banner_alt: e.target.value })}
                placeholder="Descriptive image summary for screen readers"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white px-3.5 py-2 text-xs font-medium text-slate-800 shadow-2xs outline-none transition focus:border-slate-800"
              />
            </div>
          </div>

          {/* Card: Tags & Categories */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900">Tags &amp; Taxonomy</h3>
              <span className="text-[11px] font-semibold text-slate-400">
                {form.tags.length} selected
              </span>
            </div>

            {/* Current Tags */}
            <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-xl border border-slate-200 bg-slate-50/50">
              {form.tags.length === 0 && (
                <span className="text-xs text-slate-400 italic">No tags selected.</span>
              )}
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 border border-slate-200/90 shadow-2xs"
                >
                  <Tag size={11} className="text-slate-400" />
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-slate-400 hover:text-rose-600 transition"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            {/* Add Custom Tag */}
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    handleAddTag(tagInput);
                  }
                }}
                placeholder="Type tag & press enter"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-800"
              />
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="shrink-0 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                Add
              </button>
            </div>

            {/* Recommended Tags */}
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

          {/* Card: SEO & Google Search Snippet */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
              Search Engine Optimization (SEO)
            </h3>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  SEO Meta Title
                </label>
                <span
                  className={`text-[11px] font-mono ${
                    form.seo_title.length > 60 ? "text-amber-600 font-bold" : "text-slate-400"
                  }`}
                >
                  {form.seo_title.length}/60
                </span>
              </div>
              <input
                type="text"
                value={form.seo_title}
                onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                placeholder={form.title || "Target article title for Google search"}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white px-3.5 py-2 text-xs font-medium text-slate-800 shadow-2xs outline-none transition focus:border-slate-800"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  SEO Meta Description
                </label>
                <span
                  className={`text-[11px] font-mono ${
                    form.seo_description.length > 160
                      ? "text-amber-600 font-bold"
                      : "text-slate-400"
                  }`}
                >
                  {form.seo_description.length}/160
                </span>
              </div>
              <textarea
                rows={3}
                value={form.seo_description}
                onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                placeholder={
                  form.excerpt ||
                  "Engaging summary that appears in Google search engine result snippets."
                }
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white px-3.5 py-2 text-xs font-medium text-slate-800 shadow-2xs outline-none transition focus:border-slate-800"
              />
            </div>

            {/* Google SERP Snippet Preview */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <span className="block mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Google Search Snippet Preview
              </span>
              <p className="truncate text-xs text-emerald-800 font-medium font-mono">
                https://www.tourvaa.com &gt; blogs &gt; {form.slug || "sample-article"}
              </p>
              <h4 className="mt-0.5 line-clamp-1 text-base font-medium text-[#1a0dab] hover:underline cursor-pointer">
                {effectiveSeoTitle} | Tourvaa
              </h4>
              <p className="mt-1 line-clamp-2 text-xs text-slate-600 leading-snug">
                {effectiveSeoDesc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Public Page Live Layout Preview Modal ── */}
      {showPublicPreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4 sm:p-8 backdrop-blur-xs flex items-center justify-center">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl relative">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur-md">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Full Public Webpage Preview
              </span>
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
                <img
                  src={form.featured_image}
                  alt={form.banner_alt || form.title}
                  className="h-full w-full object-cover opacity-60"
                />
              ) : (
                <div className="h-full w-full bg-slate-800 flex items-center justify-center text-slate-400">
                  No banner cover image uploaded
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 max-w-3xl mx-auto px-6 pb-8">
                <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
                  {form.tags[0] || "Travel Guide"}
                </span>
                <h1 className="mt-3 text-2xl sm:text-4xl font-black text-white drop-shadow-sm">
                  {form.banner_title || form.title || "Article Headline"}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium text-white/80">
                  <span className="flex items-center gap-1.5">
                    <User size={14} className="text-white/60" />
                    {form.author}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-white/60" />
                    {new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-white/60" />
                    {readTime} min read
                  </span>
                </div>
              </div>
            </div>

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
                  __html:
                    form.content ||
                    "<p class='text-slate-400 italic text-center py-8'>No content written yet.</p>",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
