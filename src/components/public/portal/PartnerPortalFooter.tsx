"use client";

import PublicFooter from "@/components/public/PublicFooter";

export default function PartnerPortalFooter({ portal }: { portal: "agent" | "supplier" | "affiliate" }) {
  return <PublicFooter contentBlockKey={`${portal}_portal_footer`} />;
}
