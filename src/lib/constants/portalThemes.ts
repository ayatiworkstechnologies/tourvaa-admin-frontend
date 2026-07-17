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
    "--color-dash-brand": "#E65C00",
    "--color-dash-brand-hover": "#D65300",
    "--color-dash-brand-dark": "#B94700",
    "--color-dash-bg": "#FFF9F5",
    "--color-dash-bg-muted": "#FFF1E8",
    "--color-dash-border": "#F0E2D8",
    "--portal-hero-from": "#3D1B07",
    "--portal-hero-via": "#A84205",
    "--portal-hero-to": "#F97316",
    "--portal-soft": "#FFF1E7",
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
