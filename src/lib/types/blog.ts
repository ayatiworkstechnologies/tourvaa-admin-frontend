export type BlogItem = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  featured_image?: string | null;
  banner_title?: string | null;
  banner_alt?: string | null;
  author?: string | null;
  tags?: string[] | null;
  seo_title?: string | null;
  seo_description?: string | null;
  status: "draft" | "published";
  published_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export type BlogFaqItem = {
  question: string;
  answer: string;
};

export type BlogFormData = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  banner_title: string;
  banner_alt: string;
  author: string;
  tags: string[];
  seo_title: string;
  seo_description: string;
  status: "draft" | "published";
  faqs?: BlogFaqItem[];
};

export const DEFAULT_BLOG_FORM: BlogFormData = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  featured_image: "",
  banner_title: "",
  banner_alt: "",
  author: "Tourvaa Editorial",
  tags: ["Travel Guide"],
  seo_title: "",
  seo_description: "",
  status: "draft",
  faqs: [],
};

/** Extract structured FAQs and clean body text from raw blog content */
export function extractFaqsFromContent(rawContent: string = ""): {
  cleanContent: string;
  faqs: BlogFaqItem[];
} {
  if (!rawContent) return { cleanContent: "", faqs: [] };

  const faqs: BlogFaqItem[] = [];
  let contentWithoutMarker = rawContent;

  // 1. JSON marker extraction
  const markerMatch = rawContent.match(/<!--TOURVAA_FAQS_START-->([\s\S]*?)<!--TOURVAA_FAQS_END-->/);
  if (markerMatch) {
    try {
      const parsed = JSON.parse(markerMatch[1]);
      if (Array.isArray(parsed)) {
        faqs.push(...parsed);
      }
      contentWithoutMarker = rawContent.replace(markerMatch[0], "").trim();
    } catch {
      // Ignore JSON parse error
    }
  }

  // 2. HTML details/summary FAQ blocks extraction
  const detailsRegex = /<details[^>]*>[\s\S]*?<summary[^>]*>([\s\S]*?)<\/summary>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>[\s\S]*?<\/details>/gi;
  let dMatch;
  while ((dMatch = detailsRegex.exec(contentWithoutMarker)) !== null) {
    const q = dMatch[1].replace(/<[^>]*>/g, "").replace(/▼|▾/g, "").trim();
    const a = dMatch[2].replace(/<[^>]*>/g, "").trim();
    if (q && a && !faqs.some((f) => f.question === q)) {
      faqs.push({ question: q, answer: a });
    }
  }

  // 3. HTML div/h4 FAQ blocks extraction (e.g. from older snippet templates)
  const legacyFaqRegex = /<div class="[^"]*space-y-4[^"]*">[\s\S]*?<h[234][^>]*>Frequently Asked Questions<\/h[234]>([\s\S]*?)<\/div>\s*<\/div>/gi;
  let legMatch;
  while ((legMatch = legacyFaqRegex.exec(contentWithoutMarker)) !== null) {
    const inner = legMatch[1];
    const itemRegex = /<h4[^>]*>([\s\S]*?)<\/h4>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/gi;
    let itemMatch;
    while ((itemMatch = itemRegex.exec(inner)) !== null) {
      const q = itemMatch[1].replace(/<[^>]*>/g, "").trim();
      const a = itemMatch[2].replace(/<[^>]*>/g, "").trim();
      if (q && a && !faqs.some((f) => f.question === q)) {
        faqs.push({ question: q, answer: a });
      }
    }
  }

  // Remove FAQ HTML blocks from content
  const clean = contentWithoutMarker
    .replace(/<details[^>]*>[\s\S]*?<\/details>/gi, "")
    .replace(/<div class="[^"]*space-y-4[^"]*">[\s\S]*?<h[234][^>]*>Frequently Asked Questions<\/h[234]>[\s\S]*?<\/div>\s*<\/div>/gi, "")
    .replace(/<h[234][^>]*>Frequently Asked Questions<\/h[234]>/gi, "")
    .trim();

  return { cleanContent: clean, faqs };
}

/** Embed structured FAQs into content safely without exposing HTML to the user */
export function embedFaqsIntoContent(content: string, faqs: BlogFaqItem[] = []): string {
  const base = content.replace(/<!--TOURVAA_FAQS_START-->[\s\S]*?<!--TOURVAA_FAQS_END-->/g, "").trim();
  if (!faqs || faqs.length === 0) return base;
  return `${base}\n\n<!--TOURVAA_FAQS_START-->\n${JSON.stringify(faqs, null, 2)}\n<!--TOURVAA_FAQS_END-->`;
}

/**
 * Converts legacy raw HTML snippets back into simple, human-friendly text/markdown
 * so non-technical users never have to see or deal with <div>, <span>, <h2> or class names.
 */
export function cleanHtmlToHumanText(html: string = ""): string {
  if (!html) return "";

  let text = html;

  // Convert Trip Highlights HTML card to clean text
  text = text.replace(
    /<div[^>]*>[\s\S]*?<h[234][^>]*>(?:🌟\s*)?Trip Highlights[^<]*<\/h[234]>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>[\s\S]*?<\/div>/gi,
    (_, listHtml) => {
      const items: string[] = [];
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let liMatch;
      while ((liMatch = liRegex.exec(listHtml)) !== null) {
        items.push(`• ${liMatch[1].replace(/<[^>]*>/g, "").trim()}`);
      }
      return `\n\n🌟 Trip Highlights:\n${items.join("\n")}\n\n`;
    }
  );

  // Convert Packing Checklist HTML card to clean text
  text = text.replace(
    /<div[^>]*>[\s\S]*?<h[234][^>]*>(?:🎒\s*)?(?:Essential\s*)?Packing Checklist[^<]*<\/h[234]>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>[\s\S]*?<\/div>/gi,
    (_, listHtml) => {
      const items: string[] = [];
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let liMatch;
      while ((liMatch = liRegex.exec(listHtml)) !== null) {
        const cleanItem = liMatch[1].replace(/<[^>]*>/g, "").replace(/^[✓\s*-]+/, "").trim();
        if (cleanItem) items.push(`• ${cleanItem}`);
      }
      return `\n\n🎒 Packing Checklist:\n${items.join("\n")}\n\n`;
    }
  );

  // Convert Insider Travel Tip HTML card to clean text
  text = text.replace(
    /<div[^>]*>[\s\S]*?<h[234][^>]*>(?:💡\s*)?(?:Insider\s*)?Travel Tip[^<]*<\/h[234]>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi,
    (_, bodyHtml) => {
      const tipText = bodyHtml.replace(/<[^>]*>/g, "").trim();
      return `\n\n💡 Travel Tip:\n${tipText}\n\n`;
    }
  );

  // Convert Headings
  text = text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n\n# $1\n\n");
  text = text.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n\n## $1\n\n");
  text = text.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n\n### $1\n\n");
  text = text.replace(/<h[456][^>]*>([\s\S]*?)<\/h[456]>/gi, "\n\n#### $1\n\n");

  // Convert bold and italics
  text = text.replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, "**$1**");
  text = text.replace(/<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, "*$1*");

  // Convert lists
  text = text.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, list) => {
    return (
      "\n" +
      list
        .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "• $1\n")
        .replace(/<[^>]*>/g, "")
        .trim() +
      "\n"
    );
  });
  text = text.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, list) => {
    let count = 1;
    return (
      "\n" +
      list
        .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, () => `${count++}. $1\n`)
        .replace(/<[^>]*>/g, "")
        .trim() +
      "\n"
    );
  });

  // Convert blockquote
  text = text.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, q) => {
    return `\n> ${q.replace(/<[^>]*>/g, "").trim()}\n`;
  });

  // Convert divider line
  text = text.replace(/<hr\s*\/?>/gi, "\n---\n");

  // Convert links
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)");

  // Convert images
  text = text.replace(/<figure[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>[\s\S]*?<\/figure>/gi, "![$2]($1)");
  text = text.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, "![$2]($1)");

  // Remove paragraphs & line breaks
  text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n\n$1\n\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");

  // Strip remaining unwanted HTML tags (div, span, details, etc.)
  text = text.replace(/<\/?(?:div|span|details|summary|section|article)[^>]*>/gi, "");

  // Clean up HTML entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Normalize excessive empty lines
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  return text;
}

/**
 * Formats plain human text written by non-technical users into gorgeous, clean HTML.
 * Handles paragraphs, headings, travel tips, highlights, checklists, lists, blockquotes,
 * links and formatting without demanding any HTML code from the user.
 */
export function formatBlogTextToHtml(raw: string = ""): string {
  if (!raw) return "";

  // Split by double line breaks (paragraphs/blocks)
  const blocks = raw.split(/\n{2,}/);
  const out: string[] = [];

  for (let block of blocks) {
    block = block.trim();
    if (!block) continue;

    // If this block is already a complete HTML block (e.g. figure, div, table, etc.)
    if (/^<(div|figure|blockquote|details|table)[\s\S]*>/i.test(block)) {
      out.push(block);
      continue;
    }

    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    // 1. Horizontal divider: "---" or "***"
    if (lines.length === 1 && /^[-*_]{3,}$/.test(lines[0])) {
      out.push(`<hr class="my-8 border-slate-200" />`);
      continue;
    }

    // 2. Blockquote: lines starting with ">"
    if (lines.every((l) => /^>\s*/.test(l))) {
      const quoteText = lines.map((l) => l.replace(/^>\s*/, "")).join(" ");
      out.push(
        `<blockquote class="my-6 border-l-4 border-sky-500 bg-sky-50/40 py-3 px-5 italic text-slate-700 rounded-r-2xl font-serif text-base shadow-2xs">${quoteText}</blockquote>`
      );
      continue;
    }

    // 3. Numbered travel points: e.g. "1. Explore the Energy of Tokyo" or "10. Experience Japan..."
    const numberedHeadingMatch = lines[0].match(/^(\d+)\.\s+([A-Z0-9].*)$/);
    if (lines.length === 1 && numberedHeadingMatch) {
      const num = numberedHeadingMatch[1];
      const title = numberedHeadingMatch[2];
      out.push(
        `<h3 class="text-xl sm:text-2xl font-black text-slate-950 mt-10 mb-3 flex items-center gap-3">` +
          `<span class="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-600 text-sm font-black text-white shadow-xs shrink-0">${num}</span>` +
          `<span>${title}</span>` +
        `</h3>`
      );
      continue;
    }

    // 4. Markdown Headings: e.g. "## Heading", "### Sub-heading"
    if (lines.length === 1 && /^#+\s+/.test(lines[0])) {
      const level = lines[0].match(/^(#+)/)?.[1].length || 2;
      const headingText = lines[0].replace(/^#+\s*/, "");
      if (level === 1) {
        out.push(`<h2 class="text-2xl sm:text-3xl font-black text-slate-950 mt-10 mb-4 tracking-tight">${headingText}</h2>`);
      } else if (level === 2) {
        out.push(`<h2 class="text-xl sm:text-2xl font-black text-slate-900 mt-9 mb-3.5 tracking-tight">${headingText}</h2>`);
      } else {
        out.push(`<h3 class="text-lg sm:text-xl font-bold text-slate-900 mt-7 mb-2.5">${headingText}</h3>`);
      }
      continue;
    }

    // 5. Travel Tip Block: "💡 Travel Tip:" or "Travel Tip:"
    if (/^(?:💡\s*)?Travel Tip:?/i.test(lines[0])) {
      const tipHeading = "Insider Travel Tip";
      const tipBody = lines.length > 1
        ? lines.slice(1).join(" ")
        : lines[0].replace(/^(?:💡\s*)?Travel Tip:?\s*/i, "");
      out.push(
        `<div class="my-7 rounded-2xl border border-sky-100 bg-sky-50/70 p-5 shadow-xs">` +
          `<div class="flex items-start gap-3.5">` +
            `<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-2xs text-lg">💡</span>` +
            `<div>` +
              `<h4 class="font-bold text-sky-950 text-base">${tipHeading}</h4>` +
              `<p class="mt-1 text-sm text-sky-900 leading-relaxed font-medium">${tipBody}</p>` +
            `</div>` +
          `</div>` +
        `</div>`
      );
      continue;
    }

    // 6. Trip Highlights Block: "🌟 Trip Highlights:" or "Trip Highlights:"
    if (/^(?:🌟\s*)?Trip Highlights:?/i.test(lines[0])) {
      const items = lines
        .slice(1)
        .map((l) => `<li class="flex items-start gap-2"><span class="text-sky-600 font-bold">•</span><span>${l.replace(/^[-*•]\s*/, "")}</span></li>`)
        .join("");
      out.push(
        `<div class="my-8 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">` +
          `<h3 class="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2"><span>🌟</span><span>Trip Highlights</span></h3>` +
          `<ul class="space-y-2 text-sm text-slate-700">${items}</ul>` +
        `</div>`
      );
      continue;
    }

    // 7. Packing Checklist Block: "🎒 Packing Checklist:" or "Packing Checklist:"
    if (/^(?:🎒\s*)?(?:Essential\s*)?Packing Checklist:?/i.test(lines[0])) {
      const items = lines
        .slice(1)
        .map((l) => `<li class="flex items-center gap-2"><span class="text-emerald-600 font-bold">✓</span><span>${l.replace(/^[-*•✓]\s*/, "")}</span></li>`)
        .join("");
      out.push(
        `<div class="my-8 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-6 shadow-xs">` +
          `<h3 class="text-lg font-bold text-emerald-950 mb-3 flex items-center gap-2"><span>🎒</span><span>Essential Packing Checklist</span></h3>` +
          `<ul class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-emerald-900">${items}</ul>` +
        `</div>`
      );
      continue;
    }

    // 8. Final Thoughts Block
    if (/^Final Thoughts:?$/i.test(lines[0])) {
      out.push(`<h3 class="text-xl sm:text-2xl font-black text-slate-950 mt-10 mb-3">Final Thoughts</h3>`);
      if (lines.length > 1) {
        out.push(`<p class="text-base leading-relaxed text-slate-700 my-4">${lines.slice(1).join("<br />")}</p>`);
      }
      continue;
    }

    // 9. Unordered List (bullet points)
    if (lines.every((l) => /^[-*•]\s+/.test(l))) {
      const items = lines.map((l) => `<li class="leading-relaxed">${l.replace(/^[-*•]\s+/, "")}</li>`).join("\n");
      out.push(`<ul class="space-y-2 list-disc pl-5 text-slate-700 my-4 font-normal">\n${items}\n</ul>`);
      continue;
    }

    // 10. Ordered List (1. Item, 2. Item)
    if (lines.length > 1 && lines.every((l) => /^\d+\.\s+/.test(l))) {
      const items = lines.map((l) => `<li class="leading-relaxed">${l.replace(/^\d+\.\s+/, "")}</li>`).join("\n");
      out.push(`<ol class="space-y-2 list-decimal pl-5 text-slate-700 my-4 font-normal">\n${items}\n</ol>`);
      continue;
    }

    // 11. Image markdown: ![caption](url)
    const imgMatch = lines[0].match(/^!\[(.*?)\]\((.*?)\)$/);
    if (lines.length === 1 && imgMatch) {
      const alt = imgMatch[1] || "Travel image";
      const src = imgMatch[2];
      out.push(
        `<figure class="my-8 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-md">` +
          `<img src="${src}" alt="${alt}" class="w-full max-h-[520px] object-cover" />` +
          (alt ? `<figcaption class="py-2.5 px-4 text-center text-xs text-slate-500 italic bg-white border-t border-slate-100">${alt}</figcaption>` : "") +
        `</figure>`
      );
      continue;
    }

    // 12. Regular paragraph with inline markdown bold, italic, links
    let p = lines.join("<br />");
    p = p
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-sky-600 hover:text-sky-800 underline font-semibold">$1</a>');

    out.push(`<p class="text-base leading-relaxed text-slate-700 my-4 font-normal">${p}</p>`);
  }

  return out.join("\n\n");
}

export function slugifyBlogTitle(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function calculateReadingTime(content: string = ""): number {
  const plainText = content.replace(/<[^>]*>/g, " ").trim();
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

export function getWordCount(content: string = ""): number {
  return content
    .replace(/<[^>]*>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export const POPULAR_TRAVEL_TAGS = [
  "Travel Guide",
  "Destinations",
  "Adventure",
  "Cultural Heritage",
  "Food & Wine",
  "Luxury Escapes",
  "Budget Travel",
  "Family Holidays",
  "Solo Travel",
  "Wildlife Safari",
  "Packing Tips",
  "Visa & Entry",
  "Best Time to Visit",
];
