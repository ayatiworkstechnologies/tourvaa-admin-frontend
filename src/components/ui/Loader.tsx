type LoaderProps = {
  label?: string;
  fullScreen?: boolean;
  compact?: boolean;
};

export default function Loader({ label = "Loading...", fullScreen = false, compact = false }: LoaderProps) {
  if (compact) {
    return (
      <div role="status" aria-live="polite" aria-label={label} className="flex items-center justify-center gap-3 py-4">
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
          <span aria-hidden="true" className="absolute inset-0 rounded-full border border-dashed border-blue-300 motion-safe:animate-[spin_2.4s_linear_infinite] motion-reduce:border-solid">
            <span className="absolute left-1/2 top-[-3px] h-2 w-2 -translate-x-1/2 rounded-full border border-white bg-[#EA6B2D]" />
          </span>
          <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0B203A] text-[10px] font-black text-white shadow-sm">T<span className="text-[#EA6B2D]">.</span></span>
        </span>
        <span className="text-xs font-semibold text-slate-500">{label}</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={`relative flex items-center justify-center overflow-hidden ${
        fullScreen
          ? "min-h-screen bg-[radial-gradient(circle_at_50%_38%,#eef7ff_0%,#f7fafc_38%,#f1f5f9_100%)]"
          : "py-12"
      }`}
    >
      {fullScreen && (
        <>
          <span aria-hidden="true" className="absolute left-[18%] top-[20%] h-28 w-28 rounded-full bg-blue-200/30 blur-3xl" />
          <span aria-hidden="true" className="absolute bottom-[18%] right-[16%] h-32 w-32 rounded-full bg-orange-200/25 blur-3xl" />
        </>
      )}

      <div className="relative flex min-w-[190px] flex-col items-center rounded-3xl border border-white/80 bg-white/90 px-8 py-7 shadow-[0_20px_55px_-30px_rgba(15,37,64,0.5)] backdrop-blur-xl">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span aria-hidden="true" className="absolute inset-1 rounded-full bg-blue-100/70 blur-md motion-safe:animate-pulse" />

          {/* Route orbit */}
          <span aria-hidden="true" className="absolute inset-0 rounded-full border border-dashed border-blue-300/80 motion-safe:animate-[spin_3s_linear_infinite] motion-reduce:border-solid">
            <span className="absolute left-1/2 top-[-4px] h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-white bg-[#EA6B2D] shadow-[0_2px_8px_rgba(234,107,45,0.55)]" />
          </span>

          {/* Tourvaa mark */}
          <span aria-hidden="true" className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#12345B] to-[#071B36] text-xl font-black tracking-[-0.08em] text-white shadow-[0_10px_24px_-10px_rgba(7,27,54,0.8)]">
            T<span className="text-[#EA6B2D]">.</span>
          </span>
        </div>

        <p className="mt-4 text-sm font-black tracking-tight text-[#0B203A]">Tourvaa</p>
        <p className="mt-1 max-w-[220px] text-center text-xs font-medium text-slate-500">{label}</p>

        <span aria-hidden="true" className="mt-4 flex items-center gap-1.5">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="h-1.5 w-1.5 rounded-full bg-[#EA6B2D] motion-safe:animate-bounce motion-reduce:animate-none"
              style={{ animationDelay: `${index * 140}ms`, animationDuration: "900ms" }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
