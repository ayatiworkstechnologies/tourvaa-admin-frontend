type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export default function Button({
  children,
  loading = false,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={loading}
      className={`rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 ${className}`}
      {...props}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}