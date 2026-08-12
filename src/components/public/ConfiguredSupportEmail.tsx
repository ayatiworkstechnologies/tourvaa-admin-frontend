"use client";

import { usePublicSettings } from "@/providers/PublicSettingsProvider";

export default function ConfiguredSupportEmail({
  prefix = "",
  suffix = "",
  className = "",
}: {
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const { supportEmail } = usePublicSettings();
  if (!supportEmail) return null;
  return <>{prefix}<a href={`mailto:${supportEmail}`} className={className}>{supportEmail}</a>{suffix}</>;
}
