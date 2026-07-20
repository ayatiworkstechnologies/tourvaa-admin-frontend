import { metadataFor } from "@/lib/seo/pageMetadata";

export const metadata = metadataFor("/affiliate/referral-links");

export default function MetadataLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
