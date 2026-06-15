import Loader from "@/components/ui/Loader";

type Props = {
  label?: string;
  fullPage?: boolean;
  table?: boolean;
};

export default function LoadingState({ label = "Loading...", fullPage, table }: Props) {
  if (table) {
    return <Loader label={label} />;
  }

  if (fullPage) {
    return <Loader label={label} fullScreen />;
  }

  return <p className="text-sm text-[#667085]">{label}</p>;
}
