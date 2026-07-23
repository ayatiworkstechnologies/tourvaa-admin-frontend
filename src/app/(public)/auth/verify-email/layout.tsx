import { metadataFor } from "@/lib/seo/pageMetadata";

export const metadata = metadataFor("/auth/verify-email");

export default function MetadataLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
