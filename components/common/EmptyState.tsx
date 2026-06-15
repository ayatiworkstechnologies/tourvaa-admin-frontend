type Props = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export default function EmptyState({ title, description, action }: Props) {
  return (
    <div className="rounded-xl bg-[#F7F9FC] p-6 text-center">
      <p className="font-bold text-[#121826]">{title}</p>
      {description && <p className="mt-1 text-sm text-[#667085]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
