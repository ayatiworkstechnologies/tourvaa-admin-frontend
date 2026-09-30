import { metadataFor } from "@/lib/seo/pageMetadata";

export const metadata = metadataFor("/admin/blogs/create");

export default function MetadataLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}