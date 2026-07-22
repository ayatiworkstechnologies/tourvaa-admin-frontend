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
    "--color-dash-brand": "#1478F2",
    "--color-dash-brand-hover": "#0B63CE",
    "--color-dash-brand-dark": "#0A4FA8",
    "--color-dash-bg": "#F7FAFF",
    "--color-dash-bg-muted": "#EFF6FF",
    "--color-dash-border": "#DFEAF8",
    "--portal-hero-from": "#0B3266",
    "--portal-hero-via": "#1478F2",
    "--portal-hero-to": "#56B4FF",
    "--portal-soft": "#EFF6FF",
  },
};
