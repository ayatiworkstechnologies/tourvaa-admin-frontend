import { LuCompass as Compass } from "react-icons/lu";

// Partner attribution shown wherever Viator inventory appears, so these
// experiences are never presented as Tourvaa-operated products.
export default function PoweredByViator({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        tone === "dark" ? "border border-white/20 bg-white/10 text-white/90" : "border border-slate-200 bg-white text-slate-600"
      } ${className}`}
    >
      <Compass size={12} className={tone === "dark" ? "text-teal-200" : "text-teal-600"} aria-hidden="true" />
      Powered by <strong className={tone === "dark" ? "text-white" : "text-slate-900"}>Viator</strong>
    </span>
  );
}
