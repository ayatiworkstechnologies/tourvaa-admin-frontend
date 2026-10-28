// Partner attribution shown wherever Viator inventory appears, so these
// experiences are never presented as Tourvaa-operated products.
export default function PoweredByViator({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        tone === "dark" ? "border border-white/20 bg-white/10 text-white/90" : "border border-slate-200 bg-white text-slate-600"
      } ${className}`}
    >
      <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" className={tone === "dark" ? "text-teal-200" : "text-[#2563eb]"}>
        <circle cx="12" cy="12" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8.25 14.9 15.9 8.25l-2.45 7.45-5.2-.8Z" fill="currentColor" />
      </svg>
      Powered by <strong className={tone === "dark" ? "text-white" : "text-slate-900"}>Viator</strong>
    </span>
  );
}
