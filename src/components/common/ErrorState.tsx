type Props = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export default function ErrorState({ title = "Something went wrong", message, onRetry }: Props) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50 p-5">
      <p className="font-bold text-red-700">{title}</p>
      <p className="mt-1 text-sm text-red-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
        >
          Retry
        </button>
      )}
    </div>
  );
}
