import { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down";
  icon?: LucideIcon;
};

export default function StatCard({
  title,
  value,
  change = "+2.98%",
  trend = "up",
  icon: Icon,
}: StatCardProps) {
  return (
    <div className="flex min-h-[84px] items-center gap-4 rounded-xl bg-[#E7F5FF] px-4 py-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white text-[#43A9F6]">
        {Icon ? <Icon size={26} strokeWidth={1.9} /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#7A8391]">{title}</p>
        <h3 className="mt-1 text-3xl font-bold leading-none text-[#121826]">
          {value}
        </h3>
      </div>
      <span
        className={`self-end rounded-md px-2.5 py-1 text-xs font-bold ${
          trend === "up"
            ? "bg-white text-[#5F6673]"
            : "bg-[#FFB7C3] text-[#A83E50]"
        }`}
      >
        {change}
      </span>
    </div>
  );
}
