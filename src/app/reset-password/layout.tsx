import { metadataFor } from "@/lib/seo/pageMetadata";

export const metadata = metadataFor("/reset-password");

export default function MetadataLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

