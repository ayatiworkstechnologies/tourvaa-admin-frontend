type BookingSummaryCardProps = {
  label: string;
  value: React.ReactNode;
};

export default function BookingSummaryCard({ label, value }: BookingSummaryCardProps) {
  return (
    <div className="rounded-lg border border-[#E7EAF0] bg-white p-4">
      <p className="text-xs font-bold uppercase text-[#98A2B3]">{label}</p>
      <p className="mt-1 text-lg font-bold text-[#121826]">{value}</p>
    </div>
  );
}
