"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchPublicSettings } from "@/lib/api/publicClient";

type PublicSettingsContextValue = {
  settings: Record<string, string>;
  supportEmail: string;
  supportPhone: string;
  supportPhoneHref: string;
  companyAddress: string;
};

const PublicSettingsContext = createContext<PublicSettingsContextValue | null>(null);

const PLACEHOLDER_EMAILS = new Set(["hello@tourvaa.com", "support@tourvaa.com"]);
const PLACEHOLDER_PHONES = new Set(["+910000000000", "+919876543210"]);
const PLACEHOLDER_ADDRESSES = new Set(["new zealand"]);

function configuredValue(value: string | undefined, placeholders: Set<string>) {
  const normalized = (value || "").trim();
  return normalized && !placeholders.has(normalized.toLowerCase()) ? normalized : "";
}

export function PublicSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    fetchPublicSettings()
      .then((values) => { if (active) setSettings(values); })
      .catch(() => { /* Contact links stay hidden when settings are unavailable. */ });
    return () => { active = false; };
  }, []);

  const value = useMemo(() => {
    const supportEmail = configuredValue(settings.support_email || settings.contact_email, PLACEHOLDER_EMAILS);
    const supportPhone = configuredValue(settings.support_phone || settings.contact_phone, PLACEHOLDER_PHONES);
    return {
      settings,
      supportEmail,
      supportPhone,
      supportPhoneHref: supportPhone.replace(/(?!^\+)\D/g, ""),
      companyAddress: configuredValue(settings.company_address, PLACEHOLDER_ADDRESSES),
    };
  }, [settings]);

  return <PublicSettingsContext.Provider value={value}>{children}</PublicSettingsContext.Provider>;
}

export function usePublicSettings() {
  const context = useContext(PublicSettingsContext);
  if (!context) throw new Error("usePublicSettings must be used inside PublicSettingsProvider");
  return context;
}
