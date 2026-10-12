import { metadataFor } from "@/lib/seo/pageMetadata";

export const metadata = metadataFor("/message-reply");

export default function MessageReplyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
