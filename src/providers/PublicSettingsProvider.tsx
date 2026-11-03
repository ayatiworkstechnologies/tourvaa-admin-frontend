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
const BRANDING_UPDATED_EVENT = "tourvaa:branding-updated";
const BRANDING_CHANNEL = "tourvaa-branding";
const PUBLIC_SETTINGS_CACHE_KEY = "tourvaa:public-settings";

const PLACEHOLDER_EMAILS = new Set(["hello@tourvaa.com", "support@tourvaa.com"]);
const PLACEHOLDER_PHONES = new Set(["+910000000000", "+919876543210"]);
const PLACEHOLDER_ADDRESSES = new Set(["new zealand"]);

function configuredValue(value: string | undefined, placeholders: Set<string>) {
  const normalized = (value || "").trim();
  return normalized && !placeholders.has(normalized.toLowerCase()) ? normalized : "";
}

function readCachedSettings(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const cached = JSON.parse(window.localStorage.getItem(PUBLIC_SETTINGS_CACHE_KEY) || "{}");
    return cached && typeof cached === "object" && !Array.isArray(cached) ? cached as Record<string, string> : {};
  } catch {
    return {};
  }
}

function cacheSettings(settings: Record<string, string>) {
  try {
    window.localStorage.setItem(PUBLIC_SETTINGS_CACHE_KEY, JSON.stringify(settings));
  } catch {
    // Private browsing or a full storage quota must not affect page rendering.
  }
}

export function PublicSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Record<string, string>>(readCachedSettings);

  useEffect(() => {
    let active = true;
    fetchPublicSettings()
      .then((values) => {
        if (!active) return;
        setSettings(values);
        cacheSettings(values);
      })
      .catch(() => { /* Contact links stay hidden when settings are unavailable. */ });
    return () => { active = false; };
  }, []);

  // Branding is edited in the admin app, which can be open in another tab.
  // Apply a saved logo/favicon immediately instead of waiting for a reload or
  // the next provider mount.
  useEffect(() => {
    const applyUpdate = (update: Record<string, string>) => {
      setSettings((current) => {
        const next = { ...current, ...update };
        cacheSettings(next);
        return next;
      });
    };
    const onBrandingUpdate = (event: Event) => {
      applyUpdate((event as CustomEvent<Record<string, string>>).detail || {});
    };
    window.addEventListener(BRANDING_UPDATED_EVENT, onBrandingUpdate);
    const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(BRANDING_CHANNEL);
    if (channel) channel.onmessage = (event: MessageEvent<Record<string, string>>) => applyUpdate(event.data || {});
    return () => {
      window.removeEventListener(BRANDING_UPDATED_EVENT, onBrandingUpdate);
      channel?.close();
    };
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
