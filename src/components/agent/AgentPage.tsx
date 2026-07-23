import Link from "next/link";
import { LuArrowRight as ArrowRight } from "react-icons/lu";

type AgentPageAction = {
  label: string;
  href: string;
  icon?: React.ElementType;
  variant?: "primary" | "secondary";
};

export function AgentPageShell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`min-h-screen min-w-0 bg-[#F5F8FD] px-4 py-4 text-[#10213F] sm:px-6 sm:py-6 xl:px-8 ${className}`}>
      <div className="mx-auto max-w-[1500px]">{children}</div>
    </div>
  );
}

export function AgentPageHeader({
  title,
  description,
  icon: Icon,
  eyebrow = "Agent Workspace",
  actions = [],
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  eyebrow?: string;
  actions?: AgentPageAction[];
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#DCE6F5] bg-white px-5 py-5 shadow-[0_14px_40px_-32px_rgba(28,73,135,.7)] sm:px-6">
      <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#EAF2FF] blur-2xl" />
      <div className="pointer-events-none absolute right-32 top-8 h-20 w-20 rounded-full border-[14px] border-blue-50/80" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-[#2563EB] to-[#173D7A] text-white shadow-lg shadow-blue-200">
            <Icon size={24} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#2563EB]">{eyebrow}</p>
            <h1 className="mt-1 text-[24px] font-black leading-tight tracking-tight text-[#10213F]">{title}</h1>
            <p className="mt-1 max-w-3xl text-[13px] leading-5 text-[#63728B]">{description}</p>
          </div>
        </div>

        {actions.length > 0 && (
          <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
            {actions.map(({ label, href, icon: ActionIcon = ArrowRight, variant = "primary" }) => (
              <Link
                key={`${href}-${label}`}
                href={href}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition hover:-translate-y-0.5 ${
                  variant === "primary"
                    ? "bg-[#2563EB] text-white shadow-md shadow-blue-200 hover:bg-[#1D4ED8]"
                    : "border border-[#D7E2F2] bg-white text-[#355174] hover:bg-[#F1F6FD]"
                }`}
              >
                <ActionIcon size={15} />
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
      {children && <div className="relative mt-5 border-t border-[#E7EDF6] pt-4">{children}</div>}
    </section>
  );
}

export function AgentSection({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: AgentPageAction;
  children: React.ReactNode;
  className?: string;
}) {
  const ActionIcon = action?.icon ?? ArrowRight;
  return (
    <section className={`overflow-hidden rounded-2xl border border-[#DFE7F2] bg-white shadow-[0_10px_32px_-27px_rgba(28,73,135,.75)] ${className}`}>
      {(title || description || action) && (
        <div className="flex flex-col gap-3 border-b border-[#E7EDF6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <h2 className="text-[15px] font-black text-[#10213F]">{title}</h2>}
            {description && <p className="mt-1 text-[11px] leading-5 text-[#6C7A91]">{description}</p>}
          </div>
          {action && (
            <Link href={action.href} className="inline-flex items-center gap-2 text-xs font-black text-[#2563EB]">
              {action.label} <ActionIcon size={13} />
            </Link>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

export function AgentMetric({
  label,
  value,
  note,
  icon: Icon,
  tone = "bg-blue-50 text-blue-700",
}: {
  label: string;
  value: React.ReactNode;
  note?: string;
  icon: React.ElementType;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#DFE7F2] bg-white p-4 shadow-[0_8px_24px_-22px_rgba(28,73,135,.75)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.1em] text-[#738199]">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-[#10213F]">{value}</p>
          {note && <p className="mt-1 text-[10px] text-[#748298]">{note}</p>}
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon size={18} /></span>
      </div>
    </div>
  );
}
