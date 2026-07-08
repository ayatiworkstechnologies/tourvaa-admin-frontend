type BookingSummaryCardProps = {
  label: string;
  value: React.ReactNode;
};

export default function BookingSummaryCard({ label, value }: BookingSummaryCardProps) {
  return (
    <div className="rounded-lg border border-dash-border bg-white p-4">
      <p className="text-xs font-bold uppercase text-dash-subtle">{label}</p>
      <p className="mt-1 text-lg font-bold text-dash-text">{value}</p>
    </div>
  );
}
