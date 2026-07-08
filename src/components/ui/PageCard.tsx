type PageCardProps = {
  title: string;
  description: string;
};

export default function PageCard({ title, description }: PageCardProps) {
  return (
    <div className="rounded-lg border border-[#E6E8F0] bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-[#1F1B2D]">{title}</h2>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  );
}