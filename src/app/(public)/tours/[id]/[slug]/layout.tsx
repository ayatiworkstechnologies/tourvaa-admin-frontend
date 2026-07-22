import { metadataFor } from "@/lib/seo/pageMetadata";

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }

export async function generateMetadata({ params }: LayoutProps<"/tours/[id]/[slug]">) {
  const resolved = await params;
  return metadataFor("/tours/[id]/[slug]", `/tours/${resolved.id}/${resolved.slug}`);
}
