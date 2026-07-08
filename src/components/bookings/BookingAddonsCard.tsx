type BookingAddonItem = {
  id?: number;
  name?: string;
  title?: string;
  amount?: string;
  price?: string;
};

type BookingAddonsCardProps = {
  title: string;
  items?: BookingAddonItem[];
};

function getItemLabel(item: BookingAddonItem, index: number) {
  return item.name || item.title || `Item ${index + 1}`;
}

function getItemAmount(item: BookingAddonItem) {
  return item.amount || item.price || "-";
}

export default function BookingAddonsCard({ title, items = [] }: BookingAddonsCardProps) {
  return (
    <section className="rounded-lg border border-dash-border bg-white p-4">
      <h3 className="font-bold text-dash-text">{title}</h3>

      {items.length === 0 ? (
        <p className="mt-2 text-sm text-dash-muted">No items selected.</p>
      ) : (
        <ul className="mt-3 divide-y divide-[#EEF2F6] text-sm">
          {items.map((item, index) => (
            <li key={item.id ?? index} className="flex items-center justify-between py-2">
              <span className="font-medium text-dash-text">{getItemLabel(item, index)}</span>
              <span className="text-dash-muted">{getItemAmount(item)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
