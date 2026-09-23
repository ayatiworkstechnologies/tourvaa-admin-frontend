"use client";

import { useMemo, useState } from "react";
import { LuShieldCheck as ShieldCheck, LuUserRound as UserRound } from "react-icons/lu";
import { mediaUrl } from "@/lib/utils/mediaUrl";

export type CustomerAvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export type CustomerAvatarProps = {
  name?: string | null;
  src?: string | null;
  size?: CustomerAvatarSize;
  variant?: "auto" | "initials" | "icon";
  showBadge?: boolean;
  className?: string;
  badgeClassName?: string;
};

const SIZE_MAP: Record<
  CustomerAvatarSize,
  {
    container: string;
    text: string;
    icon: number;
    badgeContainer: string;
    badgeIcon: number;
    ring: string;
  }
> = {
  xs: {
    container: "h-7 w-7 min-w-7",
    text: "text-[11px] font-black",
    icon: 13,
    badgeContainer: "h-3.5 w-3.5 -bottom-0.5 -right-0.5 ring-1",
    badgeIcon: 8,
    ring: "ring-1 ring-slate-200/80",
  },
  sm: {
    container: "h-9 w-9 min-w-9",
    text: "text-xs font-black",
    icon: 16,
    badgeContainer: "h-4 w-4 -bottom-0.5 -right-0.5 ring-1.5",
    badgeIcon: 9,
    ring: "ring-2 ring-slate-100",
  },
  md: {
    container: "h-11 w-11 min-w-11",
    text: "text-sm font-black",
    icon: 20,
    badgeContainer: "h-4.5 w-4.5 -bottom-0.5 -right-0.5 ring-1.5",
    badgeIcon: 10,
    ring: "ring-2 ring-slate-100",
  },
  lg: {
    container: "h-16 w-16 min-w-16",
    text: "text-lg font-black tracking-wide",
    icon: 26,
    badgeContainer: "h-5 w-5 -bottom-0.5 -right-0.5 ring-2",
    badgeIcon: 11,
    ring: "ring-2 ring-slate-100 shadow-xs",
  },
  xl: {
    container: "h-24 w-24 min-w-24",
    text: "text-2xl font-black tracking-wider",
    icon: 36,
    badgeContainer: "h-7 w-7 bottom-0 right-0 ring-2.5",
    badgeIcon: 14,
    ring: "ring-4 ring-slate-100 shadow-sm",
  },
};

export function getInitials(name?: string | null): string {
  if (!name) return "";
  const trimmed = name.trim();
  if (!trimmed) return "";

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // If single word, check if CamelCase or PascalCase (e.g. RubanKumar -> RK)
  const capitals = trimmed.match(/[A-Z]/g);
  if (capitals && capitals.length >= 2) {
    return (capitals[0] + capitals[1]).toUpperCase();
  }

  // Otherwise take first 2 characters
  return trimmed.slice(0, 2).toUpperCase();
}

export default function CustomerAvatar({
  name,
  src,
  size = "md",
  variant = "auto",
  showBadge = false,
  className = "",
  badgeClassName = "",
}: CustomerAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const cfg = SIZE_MAP[size] || SIZE_MAP.md;

  const initials = useMemo(() => getInitials(name), [name]);
  const showInitials = (variant === "initials" || (variant === "auto" && Boolean(initials))) && initials.length > 0;
  const imageSrc = src ? mediaUrl(src) : null;
  const hasImage = Boolean(imageSrc) && !imageError;

  return (
    <div className={`relative inline-flex shrink-0 items-center justify-center select-none ${cfg.container} ${className}`}>
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc || ""}
          alt={name || "User Avatar"}
          onError={() => setImageError(true)}
          className={`h-full w-full rounded-full object-cover ${cfg.ring}`}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-[#0B1527] via-[#15284F] to-[#1464F4] text-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.25)] ${cfg.ring}`}
        >
          {showInitials ? (
            <span className={cfg.text}>{initials}</span>
          ) : (
            <UserRound size={cfg.icon} className="stroke-[2.2] text-white/95" />
          )}
        </div>
      )}

      {showBadge && (
        <span
          title="Verified Explorer"
          className={`absolute flex items-center justify-center rounded-full bg-emerald-500 text-white ring-white shadow-xs ${cfg.badgeContainer} ${badgeClassName}`}
        >
          <ShieldCheck size={cfg.badgeIcon} className="stroke-[2.5]" />
        </span>
      )}
    </div>
  );
}
