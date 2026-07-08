type Props = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export default function EmptyState({ title, description, action }: Props) {
  return (
    <div className="rounded-xl bg-dash-bg p-6 text-center">
      <p className="font-bold text-dash-text">{title}</p>
      {description && <p className="mt-1 text-sm text-dash-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
