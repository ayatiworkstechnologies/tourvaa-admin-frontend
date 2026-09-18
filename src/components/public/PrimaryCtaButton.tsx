import Link from "next/link";
import { LuArrowRight as ArrowRight } from "react-icons/lu";

/** The one primary CTA style used across the public site -- dark navy pill,
 * bold white label, orange arrow that nudges forward on hover (see the
 * "Read Stories" button in BlogTeaserSection, the original reference for
 * this design). Use this instead of a bespoke button/Link anywhere a
 * marketing-style call-to-action is needed (hero banners, section headers,
 * tour card actions) so they all stay visually identical by construction. */

const SIZE_CLASSES = {
  md: "gap-2.5 rounded-xl px-7 py-3.5 text-sm sm:text-base",
  sm: "gap-2 rounded-lg px-4 py-2.5 text-xs sm:text-sm",
} as const;

const ICON_SIZE = { md: 16, sm: 14 } as const;

type PrimaryCtaButtonProps = {
  href: string;
  children: React.ReactNode;
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
      className={`group/btn inline-flex items-center justify-center ${SIZE_CLASSES[size]} bg-pub-primary font-bold text-white shadow-md transition-all duration-200 hover:bg-pub-primary-dark hover:shadow-xl hover:-translate-y-0.5 active:scale-95 cursor-pointer ${className}`}
    >
      <span>{children}</span>
      {showArrow && (
        <ArrowRight
          size={ICON_SIZE[size]}
          className="text-pub-accent stroke-[2.5] transition-transform duration-200 group-hover/btn:translate-x-1"
          aria-hidden="true"
        />
      )}
    </Link>
  );
}

