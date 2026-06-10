type LoaderProps = {
  label?: string;
  fullScreen?: boolean;
};

export default function Loader({ label = "Loading...", fullScreen = false }: LoaderProps) {
  return (
    <div
      className={`flex items-center justify-center ${
        fullScreen ? "min-h-screen bg-[#F7F9FC]" : "py-12"
      }`}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-[#E7EAF0] bg-white px-5 py-4 shadow-sm">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#DDF1FF] border-t-[#43A9F6]" />
        <span className="text-sm font-semibold text-[#667085]">{label}</span>
      </div>
    </div>
  );
}
