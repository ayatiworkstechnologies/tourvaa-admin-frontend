type LoaderProps = {
  label?: string;
  fullScreen?: boolean;
};

export default function Loader({ label = "Loading...", fullScreen = false }: LoaderProps) {
  return (
    <div
      className={`flex items-center justify-center ${
        fullScreen ? "min-h-screen bg-dash-bg" : "py-12"
      }`}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-dash-border bg-white px-5 py-4 shadow-sm">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#D7E8F5] border-t-dash-brand" />
        <span className="text-sm font-semibold text-dash-muted">{label}</span>
      </div>
    </div>
  );
}
