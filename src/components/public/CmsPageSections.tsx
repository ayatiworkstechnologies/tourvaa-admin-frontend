/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { LuArrowRight as ArrowRight } from "react-icons/lu";

// A page built with the admin "Pages" section builder (CMS > Content &
// Pages > Pages > Add Pages) - an ordered list of typed content blocks an
// admin assembles freely, rendered with real design here instead of the
// legacy plain-HTML `content` field (see [slug]/page.tsx, which falls back
// to that field when a page has no sections). Every block field is plain
// text rendered via normal JSX interpolation (never dangerouslySetInnerHTML)
// so, unlike `content`, none of this needs server-side HTML sanitization.
export type CmsPageBlock =
  | { type: "hero"; heading?: string; subtitle?: string; image?: string }
  | { type: "text"; heading?: string; body?: string }
  | { type: "image_text"; heading?: string; body?: string; image?: string; image_position?: "left" | "right" }
  | { type: "cards"; heading?: string; subtitle?: string; items?: { image?: string; title?: string; description?: string; link?: string }[] }
  | { type: "cta"; heading?: string; subtitle?: string; button_text?: string; button_link?: string };

function Paragraphs({ body, className }: { body?: string; className?: string }) {
  const lines = (body || "").split("\n").filter((l) => l.trim());
  if (!lines.length) return null;
  return (
    <>
      {lines.map((line, i) => (
        <p key={i} className={className}>
          {line}
        </p>
      ))}
    </>
  );
}

export default function CmsPageSections({ sections }: { sections: CmsPageBlock[] }) {
  return (
    <div className="space-y-14 sm:space-y-20">
      {sections.map((block, index) => {
        if (block.type === "hero") {
          return (
            <section key={index} className="relative min-h-[280px] sm:min-h-[360px] w-full overflow-hidden rounded-[26px] bg-[#0B1F3A] shadow-xl flex items-center">
              {block.image && (
                <img src={block.image} alt={block.heading || ""} className="absolute inset-0 h-full w-full object-cover opacity-55 scale-105" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B1F3A] via-[#0B1F3A]/85 to-transparent" />
              <div className="relative z-10 max-w-2xl px-6 sm:px-12 py-10">
                {block.heading && (
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white font-heading leading-tight drop-shadow-md">
                    {block.heading}
                  </h1>
                )}
                {block.subtitle && <p className="mt-3 text-sm sm:text-base leading-relaxed text-white/85 font-medium">{block.subtitle}</p>}
              </div>
            </section>
          );
        }

        if (block.type === "text") {
          return (
            <section key={index} className="mx-auto max-w-3xl">
              {block.heading && <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 font-heading">{block.heading}</h2>}
              <div className="mt-3 space-y-3 text-sm sm:text-base leading-relaxed text-slate-600 font-medium">
                <Paragraphs body={block.body} />
              </div>
            </section>
          );
        }

        if (block.type === "image_text") {
          const imageFirst = (block.image_position || "left") === "left";
          return (
            <section key={index} className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
              {block.image && (
                <div className={`overflow-hidden rounded-2xl border border-slate-200/80 shadow-xs ${imageFirst ? "md:order-1" : "md:order-2"}`}>
                  <img src={block.image} alt={block.heading || ""} className="h-full w-full object-cover" />
                </div>
              )}
              <div className={imageFirst ? "md:order-2" : "md:order-1"}>
                {block.heading && <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 font-heading">{block.heading}</h2>}
                <div className="mt-3 space-y-3 text-sm sm:text-base leading-relaxed text-slate-600 font-medium">
                  <Paragraphs body={block.body} />
                </div>
              </div>
            </section>
          );
        }

        if (block.type === "cards") {
          const items = block.items ?? [];
          return (
            <section key={index}>
              {(block.heading || block.subtitle) && (
                <div className="mx-auto max-w-2xl text-center">
                  {block.heading && <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 font-heading">{block.heading}</h2>}
                  {block.subtitle && <p className="mt-2 text-sm text-slate-600 font-medium">{block.subtitle}</p>}
                </div>
              )}
              {items.length > 0 && (
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item, i) => {
                    const card = (
                      <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-slate-300">
                        {item.image && (
                          <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                            <img src={item.image} alt={item.title || ""} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                          </div>
                        )}
                        <div className="flex flex-1 flex-col p-5">
                          {item.title && <h3 className="text-base font-bold text-slate-950 font-heading">{item.title}</h3>}
                          {item.description && <p className="mt-2 flex-1 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">{item.description}</p>}
                          {item.link && (
                            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-pub-secondary">
                              <span>Learn more</span>
                              <ArrowRight size={13} />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                    return item.link ? (
                      <Link key={i} href={item.link} className="block h-full">
                        {card}
                      </Link>
                    ) : (
                      <div key={i}>{card}</div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        }

        if (block.type === "cta") {
          return (
            <section
              key={index}
              className="relative flex min-h-[240px] flex-col items-center justify-center overflow-hidden rounded-[26px] bg-[#0B1F3A] p-8 text-center text-white shadow-xl"
            >
              <div className="relative z-10 max-w-xl">
                {block.heading && <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading">{block.heading}</h2>}
                {block.subtitle && <p className="mt-3 text-sm text-white/90 font-medium leading-relaxed">{block.subtitle}</p>}
                {block.button_text && (
                  <Link
                    href={block.button_link || "/"}
                    className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-7 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-slate-100"
                  >
                    <span>{block.button_text}</span>
                    <ArrowRight size={15} />
                  </Link>
                )}
              </div>
            </section>
          );
        }

        return null;
      })}
    </div>
  );
}
