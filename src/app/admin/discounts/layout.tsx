import { metadataFor } from "@/lib/seo/pageMetadata";

export const metadata = metadataFor("/admin/discounts");

export default function MetadataLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

