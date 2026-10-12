export default function PresenceBadge({ online, subject = "User" }: { online: boolean; subject?: string }) {
  const status = online ? "Online" : "Offline";
  return (
    <span
      role="status"
      aria-label={`${subject} ${status.toLowerCase()}`}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${
        online ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-500" : "bg-slate-400"}`} />
      {status}
    </span>
  );
}
