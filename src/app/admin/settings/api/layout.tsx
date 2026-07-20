import { metadataFor } from "@/lib/seo/pageMetadata";

export const metadata = metadataFor("/admin/settings/api");

export default function MetadataLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

