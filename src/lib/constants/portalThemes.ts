import type { CSSProperties } from "react";

export type PortalThemeName = "admin" | "supplier" | "agent" | "customer";

type PortalThemeProperties = CSSProperties & Record<`--${string}`, string>;

export const portalThemeStyles: Record<PortalThemeName, PortalThemeProperties> = {
  admin: {
    "--color-dash-brand": "#1D3A6D",
    "--color-dash-brand-hover": "#17315D",
    "--color-dash-brand-dark": "#102649",
    "--color-dash-bg": "#F5F7FB",
    "--color-dash-bg-muted": "#EEF2F7",
    "--color-dash-border": "#DDE4EE",
    "--portal-hero-from": "#101A33",
    "--portal-hero-via": "#1D3A6D",
    "--portal-hero-to": "#315B92",
    "--portal-soft": "#EDF2FA",
  },
  supplier: {
    "--color-dash-brand": "#16833A",
    "--color-dash-brand-hover": "#117331",
    "--color-dash-brand-dark": "#0D5C29",
    "--color-dash-bg": "#F5FAF7",
    "--color-dash-bg-muted": "#EAF7EF",
    "--color-dash-border": "#D8EADF",
    "--portal-hero-from": "#082E1B",
    "--portal-hero-via": "#126B34",
    "--portal-hero-to": "#34A853",
    "--portal-soft": "#EAF7EF",
  },
  agent: {
    "--color-dash-brand": "#2563EB",
    "--color-dash-brand-hover": "#1D4ED8",
    "--color-dash-brand-dark": "#1E3A8A",
    "--color-dash-bg": "#F6F8FC",
    "--color-dash-bg-muted": "#EEF4FF",
    "--color-dash-border": "#DBE5F2",
    "--portal-hero-from": "#0F172A",
    "--portal-hero-via": "#1E3A8A",
    "--portal-hero-to": "#2563EB",
    "--portal-soft": "#EFF6FF",
  },
  customer: {
    "--color-dash-brand": "#075B57",
    "--color-dash-brand-hover": "#064E4B",
    "--color-dash-brand-dark": "#063C42",
    "--color-dash-bg": "#F6FAF9",
    "--color-dash-bg-muted": "#EAF6F4",
    "--color-dash-border": "#D9E9E6",
    "--portal-hero-from": "#063C42",
    "--portal-hero-via": "#075B57",
    "--portal-hero-to": "#0F8B83",
    "--portal-soft": "#E8F5F3",
  },
};
