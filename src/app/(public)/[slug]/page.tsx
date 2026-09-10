import { notFound } from "next/navigation";
import { fetchCmsPageForServer } from "@/lib/seo/cmsPageMetadata";

export default async function CmsPageDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await fetchCmsPageForServer(slug);
  if (!page) notFound();

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-5 py-16 md:px-8">
        <h1 className="text-3xl font-black text-slate-950 md:text-4xl">{page.title}</h1>
        <article
          className="mt-8 space-y-6 text-base leading-relaxed text-slate-600 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-slate-950 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-slate-950 [&_a]:text-pub-secondary [&_a]:underline [&_strong]:text-slate-950 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6"
          dangerouslySetInnerHTML={{ __html: page.content || "" }}
        />
      </div>
    </main>
  );
}
