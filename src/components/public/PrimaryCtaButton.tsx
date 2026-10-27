import Link from "next/link";
import { LuArrowRight as ArrowRight } from "react-icons/lu";

/** The one primary CTA style used across the public site -- dark navy,
 * softly rounded, bold white label and white arrow. Use this instead of a bespoke button/Link anywhere a
 * marketing-style call-to-action is needed (hero banners, section headers,
 * tour card actions) so they all stay visually identical by construction. */

const SIZE_CLASSES = {
  // The radius, spacing, and weight intentionally match the approved
  // "Explore Top Deals" public-site reference CTA.
  // Keep this component as the single source of truth for public primary
  // actions rather than introducing page-specific primary button styles.
  md: "gap-3 rounded-[10px] px-7 py-3.5 text-sm sm:text-base",
  sm: "gap-2.5 rounded-[10px] px-5 py-3 text-xs sm:text-sm",
} as const;

const ICON_SIZE = { md: 16, sm: 14 } as const;

type PrimaryCtaButtonProps = {
  href: string;
  children: React.ReactNode;
  leadingIcon?: React.ReactNode;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
  showArrow?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  target?: string;
  rel?: string;
};

export default function PrimaryCtaButton({
  href,
  children,
  leadingIcon,
  size = "md",
  className = "",
  showArrow = true,
  onClick,
  target,
  rel,
}: PrimaryCtaButtonProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      target={target}
      rel={rel}
      className={`group/btn inline-flex items-center justify-center ${SIZE_CLASSES[size]} bg-pub-primary font-extrabold text-white shadow-[0_8px_18px_rgba(11,31,58,0.2)] transition-all duration-200 hover:bg-pub-primary-dark hover:shadow-[0_12px_24px_rgba(11,31,58,0.28)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pub-accent/35 active:scale-[0.98] cursor-pointer ${className}`}
    >
      {leadingIcon ? <span className="shrink-0" aria-hidden="true">{leadingIcon}</span> : null}
      <span>{children}</span>
      {showArrow && (
        <ArrowRight
          size={ICON_SIZE[size]}
          className="text-white stroke-[2.5] transition-transform duration-200 group-hover/btn:translate-x-1"
          aria-hidden="true"
        />
      )}
    </Link>
  );
}

