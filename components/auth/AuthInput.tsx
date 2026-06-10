import { LucideIcon } from "lucide-react";

type AuthInputProps = {
  label: string;
  icon: LucideIcon;
} & React.InputHTMLAttributes<HTMLInputElement>;

export default function AuthInput({ label, icon: Icon, ...props }: AuthInputProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-[#009FE3]">
        {label}
      </span>

      <div className="flex items-center gap-3 rounded-xl border border-[#D7E8F5] bg-white px-3 py-3 shadow-sm transition focus-within:border-[#43A9F6] focus-within:ring-4 focus-within:ring-sky-100">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E7F5FF] text-[#238DD7]">
          <Icon size={16} />
        </span>
        <input
          {...props}
          className="w-full bg-transparent text-sm font-medium text-[#121826] outline-none placeholder:text-gray-400"
        />
      </div>
    </label>
  );
}
