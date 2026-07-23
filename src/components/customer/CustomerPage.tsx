import Link from "next/link";
import { LuArrowRight as ArrowRight } from "react-icons/lu";

type CustomerPageShellProps = {
  children: React.ReactNode;
  className?: string;
};

type CustomerPageHeaderProps = {
  title: string;
  description: string;
  icon: React.ElementType;
  action?: {
    label: string;
    href: string;
    icon?: React.ElementType;
  };
  eyebrow?: string;
  children?: React.ReactNode;
};

export function CustomerPageShell({ children, className = "" }: CustomerPageShellProps) {
  return (
    <div className={`min-h-screen min-w-0 bg-[#F8FBFF] px-4 py-4 text-[#0C2043] sm:px-6 sm:py-6 xl:px-8 ${className}`}>
      <div className="mx-auto max-w-[1440px]">{children}</div>
    </div>
  );
}

export function CustomerPageHeader({
  title,
  description,
  icon: Icon,
  action,
  eyebrow = "Traveller Portal",
  children,
}: CustomerPageHeaderProps) {
  const ActionIcon = action?.icon ?? ArrowRight;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#DCE7F5] bg-white px-5 py-5 shadow-[0_12px_40px_-32px_rgba(21,77,151,.55)] sm:px-6">
      <div className="pointer-events-none absolute -right-12 -top-20 h-52 w-52 rounded-full bg-[#E9F3FF] blur-2xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-[#0D73F6] to-[#0757D6] text-white shadow-lg shadow-blue-200">
            <Icon size={24} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#2475E8]">{eyebrow}</p>
            <h1 className="mt-1 text-[24px] font-black leading-tight tracking-tight text-[#0C2043]">{title}</h1>
            <p className="mt-1 max-w-2xl text-[13px] leading-5 text-[#5D7292]">{description}</p>
          </div>
        </div>
        {action && (
          <Link
            href={action.href}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0868E8] px-4 py-2.5 text-[12px] font-black text-white shadow-md shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-[#075AC9] sm:w-auto"
          >
            <ActionIcon size={15} />
            {action.label}
          </Link>
        )}
      </div>
      {children && <div className="relative mt-5 border-t border-[#E6EDF6] pt-4">{children}</div>}
    </div>
  );
}

export function CustomerSection({
  title,
  description,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-[#DDE7F3] bg-white shadow-[0_8px_30px_-25px_rgba(24,68,126,.6)] ${className}`}>
      {(title || description) && (
        <div className="border-b border-[#E6EDF6] px-5 py-4">
          {title && <h2 className="text-[15px] font-black text-[#0C2043]">{title}</h2>}
          {description && <p className="mt-1 text-[11px] text-[#6B7F9D]">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
