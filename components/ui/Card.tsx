type CardProps = {
  title: string;
  value: string | number;
};

export default function Card({ title, value }: CardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <h3 className="mt-2 text-2xl font-bold text-slate-900">{value}</h3>
    </div>
  );
}