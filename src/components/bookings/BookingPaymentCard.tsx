type BookingPaymentCardProps = {
  paid: string;
  pending: string;
  currency: string;
};

export default function BookingPaymentCard({ paid, pending, currency }: BookingPaymentCardProps) {
  return (
    <div className="rounded-lg border border-dash-border bg-white p-4 text-sm text-dash-text">
      <p>
        Paid: <b>{currency} {paid}</b>
      </p>
      <p className="mt-2">
        Pending: <b>{currency} {pending}</b>
      </p>
    </div>
  );
}
