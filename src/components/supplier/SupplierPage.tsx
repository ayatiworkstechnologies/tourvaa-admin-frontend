import Link from "next/link";
import { LuArrowRight as ArrowRight } from "react-icons/lu";

type SupplierPageHeaderAction = {
  label: string;
  href: string;
  icon?: React.ElementType;
  variant?: "primary" | "secondary";
};

export function SupplierPageShell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`min-h-screen min-w-0 bg-[#F5FAF7] px-4 py-4 text-[#123024] sm:px-6 sm:py-6 xl:px-8 ${className}`}>
      <div className="mx-auto max-w-[1500px]">{children}</div>
    </div>
  );
}

export function SupplierPageHeader({
  title,
  description,
  icon: Icon,
  eyebrow = "Supplier Workspace",
  actions = [],
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  eyebrow?: string;
  actions?: SupplierPageHeaderAction[];
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#D8EADF] bg-white px-5 py-5 shadow-[0_14px_40px_-32px_rgba(13,92,41,.65)] sm:px-6">
      <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#E8F7ED] blur-2xl" />
      <div className="pointer-events-none absolute right-32 top-8 h-20 w-20 rounded-full border-[14px] border-emerald-50/70" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-[#16833A] to-[#0D5C29] text-white shadow-lg shadow-emerald-200">
            <Icon size={24} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#16833A]">{eyebrow}</p>
            <h1 className="mt-1 text-[24px] font-black leading-tight tracking-tight text-[#123024]">{title}</h1>
            <p className="mt-1 max-w-3xl text-[13px] leading-5 text-[#647B6E]">{description}</p>
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
                    ? "bg-[#16833A] text-white shadow-md shadow-emerald-200 hover:bg-[#117331]"
                    : "border border-[#D5E6DB] bg-white text-[#365A45] hover:bg-[#F0F8F3]"
                }`}
              >
                <ActionIcon size={15} />
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
      {children && <div className="relative mt-5 border-t border-[#E5EFE9] pt-4">{children}</div>}
    </section>
  );
}

export function SupplierSection({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: SupplierPageHeaderAction;
  children: React.ReactNode;
  className?: string;
}) {
  const ActionIcon = action?.icon ?? ArrowRight;
  return (
    <section className={`overflow-hidden rounded-2xl border border-[#DCEBE2] bg-white shadow-[0_10px_32px_-27px_rgba(15,82,48,.7)] ${className}`}>
      {(title || description || action) && (
        <div className="flex flex-col gap-3 border-b border-[#E5EFE9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <h2 className="text-[15px] font-black text-[#123024]">{title}</h2>}
            {description && <p className="mt-1 text-[11px] leading-5 text-[#6D8276]">{description}</p>}
          </div>
          {action && (
            <Link href={action.href} className="inline-flex items-center gap-2 text-xs font-black text-[#16833A]">
              {action.label} <ActionIcon size={13} />
            </Link>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

export function SupplierMetric({
  label,
  value,
  note,
  icon: Icon,
  tone = "bg-emerald-50 text-emerald-700",
}: {
  label: string;
  value: React.ReactNode;
  note?: string;
  icon: React.ElementType;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#DCEBE2] bg-white p-4 shadow-[0_8px_24px_-22px_rgba(15,82,48,.7)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.1em] text-[#708579]">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-[#123024]">{value}</p>
          {note && <p className="mt-1 text-[10px] text-[#71867A]">{note}</p>}
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon size={18} /></span>
      </div>
    </div>
  );
}
