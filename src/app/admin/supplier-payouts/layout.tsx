import { metadataFor } from "@/lib/seo/pageMetadata";

export const metadata = metadataFor("/admin/supplier-payouts");

export default function MetadataLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

