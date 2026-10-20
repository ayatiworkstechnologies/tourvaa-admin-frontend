"use client";

import React, { useRef, useState } from "react";
import {
  LuBold as Bold,
  LuColumns2 as Columns,
  LuEye as Eye,
  LuHeading2 as Heading2,
  LuHeading3 as Heading3,
  LuCircleHelp as HelpCircle,
  LuImage as ImageIcon,
  LuItalic as Italic,
  LuLightbulb as Lightbulb,
  LuLink as LinkIcon,
  LuList as List,
  LuListOrdered as ListOrdered,
  LuMinus as Minus,
  LuPenTool as PenTool,
  LuQuote as Quote,
  LuSparkles as Sparkles,
  LuStrikethrough as Strikethrough,
  LuUnderline as Underline,
} from "react-icons/lu";
import {
  calculateReadingTime,
  formatBlogTextToHtml,
  getWordCount,
} from "@/lib/types/blog";

type EditorViewMode = "write" | "split" | "preview";

interface BlogContentEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onAddFaqItem?: (question: string, answer: string) => void;
}

export default function BlogContentEditor({
  value,
  onChange,
  placeholder = "Write your travel guide or article here using simple text...",
  onAddFaqItem,
}: BlogContentEditorProps) {
  const [viewMode, setViewMode] = useState<EditorViewMode>("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Link insertion state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  // Image insertion state
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");

  // FAQ insertion state
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [faqSuccessMessage, setFaqSuccessMessage] = useState(false);

  // Helper to insert or wrap plain-text tokens at cursor position without HTML
  const insertToken = (prefix: string, suffix: string = "", defaultText: string = "") => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + `${prefix}${defaultText}${suffix}`);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.substring(start, end) || defaultText;
    const replacement = `${prefix}${selected}${suffix}`;

    const updated = value.substring(0, start) + replacement + value.substring(end);
    onChange(updated);

    setTimeout(() => {
      el.focus();
      const cursorTarget = start + prefix.length + selected.length;
      el.setSelectionRange(cursorTarget, cursorTarget);
    }, 10);
  };

  const handleOpenLinkModal = () => {
    const el = textareaRef.current;
    if (el) {
      const selected = value.substring(el.selectionStart, el.selectionEnd);
      setLinkText(selected || "Read more");
    } else {
      setLinkText("Read more");
    }
    setLinkUrl("https://");
    setShowLinkModal(true);
  };

  const confirmInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    const label = linkText.trim() || linkUrl.trim();
    insertToken(`[${label}](`, ")", linkUrl.trim());
    setShowLinkModal(false);
    setLinkUrl("");
    setLinkText("");
  };

  const confirmInsertImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    const caption = imageAlt.trim() || "Travel highlight";
    insertToken(`\n\n![${caption}](${imageUrl.trim()})\n\n`, "");
    setShowImageModal(false);
    setImageUrl("");
    setImageAlt("");
  };

  const confirmInsertFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion.trim() || !faqAnswer.trim()) return;

    if (onAddFaqItem) {
      onAddFaqItem(faqQuestion.trim(), faqAnswer.trim());
    }

    // Scroll to the Article FAQs card
    document.getElementById("article-faqs-card")?.scrollIntoView({ behavior: "smooth" });

    setFaqSuccessMessage(true);
    setTimeout(() => {
      setFaqSuccessMessage(false);
      setShowFaqModal(false);
      setFaqQuestion("");
      setFaqAnswer("");
    }, 1200);
  };

  // Predefined Travel Snippet Templates (Clean Plain Text — NO HTML!)
  const insertSnippet = (type: "tip" | "highlights" | "checklist") => {
    switch (type) {
      case "tip":
        insertToken(
          `\n\n💡 Travel Tip:\nBook tickets early in the morning to avoid heavy tourist queues and capture optimal photography lighting.\n\n`
        );
        break;
      case "highlights":
        insertToken(
          `\n\n🌟 Trip Highlights:\n• Best Season: October to March for pleasant temperatures\n• Recommended Duration: 7 - 10 Days\n• Top Must-See: Historic landmarks, cultural quarters, scenic viewpoints\n\n`
        );
        break;
      case "checklist":
        insertToken(
          `\n\n🎒 Packing Checklist:\n• Lightweight breathable clothing\n• Universal power adapter\n• Sturdy walking shoes\n• Sun protection & eco-friendly sunscreen\n• Reusable filtered water bottle\n• Offline translation & navigation maps\n\n`
        );
        break;
    }
  };

  const wordCount = getWordCount(value);
  const readMins = calculateReadingTime(value);
  const renderedHtml =
    formatBlogTextToHtml(value) ||
    "<p class='text-slate-400 italic py-12 text-center'>Article is empty. Start typing to see the live formatted preview.</p>";

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
      {/* ── Top Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-slate-50/80 px-4 py-2.5">
        {/* Formatting Actions */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            title="Section Heading (##)"
            onClick={() => insertToken("\n\n## ", "\n", "Section Heading")}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition cursor-pointer"
          >
            <Heading2 size={16} />
          </button>
          <button
            type="button"
            title="Sub-heading (###)"
            onClick={() => insertToken("\n\n### ", "\n", "Sub-heading")}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition cursor-pointer"
          >
            <Heading3 size={16} />
          </button>

          <span className="mx-1 h-4 w-px bg-slate-300" />

          <button
            type="button"
            title="Bold (**text**)"
            onClick={() => insertToken("**", "**", "bold text")}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition cursor-pointer"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            title="Italic (*text*)"
            onClick={() => insertToken("*", "*", "italic text")}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition cursor-pointer"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            title="Underline (_text_)"
            onClick={() => insertToken("_", "_", "underlined text")}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition cursor-pointer"
          >
            <Underline size={16} />
          </button>
          <button
            type="button"
            title="Strikethrough (~~text~~)"
            onClick={() => insertToken("~~", "~~", "strikethrough text")}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition cursor-pointer"
          >
            <Strikethrough size={16} />
          </button>

          <span className="mx-1 h-4 w-px bg-slate-300" />

          <button
            type="button"
            title="Bullet List (• item)"
            onClick={() => insertToken("\n• ", "\n• Item 2\n• Item 3\n", "Item 1")}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition cursor-pointer"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            title="Numbered List (1. item)"
            onClick={() => insertToken("\n1. ", "\n2. Step 2\n3. Step 3\n", "Step 1")}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition cursor-pointer"
          >
            <ListOrdered size={16} />
          </button>
          <button
            type="button"
            title="Blockquote (> quote)"
            onClick={() => insertToken("\n> ", "\n", "Inspiring travel quote...")}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition cursor-pointer"
          >
            <Quote size={15} />
          </button>
          <button
            type="button"
            title="Divider Line (---)"
            onClick={() => insertToken("\n\n---\n\n")}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition cursor-pointer"
          >
            <Minus size={16} />
          </button>

          <span className="mx-1 h-4 w-px bg-slate-300" />

          <button
            type="button"
            title="Insert Link"
            onClick={handleOpenLinkModal}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition cursor-pointer"
          >
            <LinkIcon size={16} />
          </button>
          <button
            type="button"
            title="Insert Image"
            onClick={() => setShowImageModal(true)}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition cursor-pointer"
          >
            <ImageIcon size={16} />
          </button>
        </div>

        {/* View Mode Switcher (Clean & Simple — No HTML code tab) */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode("write")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
              viewMode === "write"
                ? "bg-slate-900 text-white font-bold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <PenTool size={12} />
            <span>Write Text</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`hidden lg:inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
              viewMode === "split"
                ? "bg-slate-900 text-white font-bold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Columns size={12} />
            <span>Split Preview</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
              viewMode === "preview"
                ? "bg-slate-900 text-white font-bold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Eye size={12} />
            <span>Live Article</span>
          </button>
        </div>
      </div>

      {/* ── Quick Travel Block Snippets Ribbon (100% Plain Text — Zero HTML) ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-4 py-2 text-xs">
        <span className="flex items-center gap-1 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
          <Sparkles size={12} className="text-amber-500" />
          Insert Travel Block:
        </span>
        <button
          type="button"
          onClick={() => insertSnippet("tip")}
          className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-800 hover:bg-sky-100 transition cursor-pointer"
        >
          <Lightbulb size={11} />
          <span>Travel Tip</span>
        </button>
        <button
          type="button"
          onClick={() => insertSnippet("highlights")}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <span>Trip Highlights</span>
        </button>
        <button
          type="button"
          onClick={() => insertSnippet("checklist")}
          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
        >
          <span>Packing Checklist</span>
        </button>
        <button
          type="button"
          onClick={() => setShowFaqModal(true)}
          className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50/80 px-2 py-0.5 text-xs font-semibold text-sky-800 hover:bg-sky-100 transition cursor-pointer ml-auto"
        >
          <HelpCircle size={11} className="text-sky-600" />
          <span>+ Add FAQ Item (Plain Text)</span>
        </button>
      </div>

      {/* ── Main Canvas ── */}
      <div className="relative min-h-[460px] bg-white">
        {/* Mode: Write Text */}
        {viewMode === "write" && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={18}
            className="w-full resize-y p-5 font-sans text-sm leading-relaxed text-slate-800 outline-none"
          />
        )}

        {/* Mode: Split View */}
        {viewMode === "split" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 min-h-[460px]">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              rows={20}
              className="w-full resize-y p-5 font-sans text-sm leading-relaxed text-slate-800 outline-none"
            />
            <div className="p-6 overflow-y-auto max-h-[600px] bg-slate-50/30">
              <span className="block mb-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Live Article Formatting (Auto-Styled)
              </span>
              <article
                className="space-y-4 text-sm leading-relaxed text-slate-700"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            </div>
          </div>
        )}

        {/* Mode: Full Preview */}
        {viewMode === "preview" && (
          <div className="p-8 max-w-3xl mx-auto">
            <article
              className="space-y-6 text-base leading-relaxed text-slate-700"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        )}
      </div>

      {/* ── Plain Text Help & Word Count Footer ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-500">
        <div className="flex items-center gap-2 text-[11px] text-slate-600">
          <span className="font-bold text-sky-700">✍️ Human Text Mode:</span>
          <span>Write naturally. Headings (##), bullet points (•), travel tips (💡) and bold (**) format automatically — zero HTML required.</span>
        </div>
        <div className="flex items-center gap-4 shrink-0 font-medium">
          <span>
            <strong className="font-bold text-slate-800 tabular-nums">{wordCount}</strong> words
          </span>
          <span>
            <strong className="font-bold text-slate-800 tabular-nums">{value.length}</strong> chars
          </span>
          <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-bold text-slate-800">
            {readMins} min read
          </span>
        </div>
      </div>

      {/* ── Link Insertion Modal ── */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <form
            onSubmit={confirmInsertLink}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4"
          >
            <h4 className="text-base font-bold text-slate-900">Insert Link</h4>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Link Label</label>
              <input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="e.g. View Tokyo Tour Details"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Web Address (URL)</label>
              <input
                type="url"
                required
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://tourvaa.com/tours/tokyo"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-800"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow-xs cursor-pointer"
              >
                Insert Link
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Image Insertion Modal ── */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <form
            onSubmit={confirmInsertImage}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4"
          >
            <h4 className="text-base font-bold text-slate-900">Insert Article Photo</h4>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Photo URL</label>
              <input
                type="url"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Caption / Description</label>
              <input
                type="text"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="e.g. Scenic sunset over Mount Fuji"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-800"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow-xs cursor-pointer"
              >
                Insert Photo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── FAQ Modal (Adds Directly to Structured FAQ List — Zero HTML in content!) ── */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <form
            onSubmit={confirmInsertFaq}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <HelpCircle size={18} />
              </span>
              <div>
                <h4 className="text-base font-bold text-slate-900">Add FAQ Item</h4>
                <p className="text-xs text-slate-500">Adds clean plain text Q&amp;A to the article&apos;s FAQ section</p>
              </div>
            </div>

            {faqSuccessMessage ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                <p className="text-xs font-bold text-emerald-800">
                  ✓ Added to Article FAQs below!
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">Question</label>
                  <input
                    type="text"
                    required
                    value={faqQuestion}
                    onChange={(e) => setFaqQuestion(e.target.value)}
                    placeholder="e.g. Is an international driver permit required?"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">Answer</label>
                  <textarea
                    required
                    rows={3}
                    value={faqAnswer}
                    onChange={(e) => setFaqAnswer(e.target.value)}
                    placeholder="e.g. Yes, visitors wishing to rent a vehicle in Japan must carry a valid Geneva Convention 1949 International Driving Permit."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-800 resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowFaqModal(false)}
                    className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 shadow-xs cursor-pointer"
                  >
                    Add FAQ Item
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
