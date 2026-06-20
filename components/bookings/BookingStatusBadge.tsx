export default function BookingStatusBadge({ value }: { value: string }) {
  return <span className="rounded-full bg-[#EEF6FF] px-3 py-1 text-xs font-bold capitalize text-[#2368A2]">{value.replaceAll("_", " ")}</span>;
}
