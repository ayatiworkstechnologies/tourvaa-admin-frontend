// Renders an actual SVG country flag via the `flag-icons` package instead of
// a Unicode flag emoji - Windows Chrome/Edge has no flag glyphs in its
// default fonts and just shows the raw two-letter code as text, so emoji
// flags silently fail to render there. SVGs render identically everywhere.
export default function FlagIcon({ countryCode, className = "h-full w-full", square = false }: { countryCode: string | null | undefined; className?: string; square?: boolean }) {
  const code = countryCode?.trim().toUpperCase();
  if (!code || !/^[A-Z]{2}$/.test(code)) return null;
  return <span className={`fi ${square ? "fis" : ""} fi-${code.toLowerCase()} ${className}`} role="img" aria-label={`${code} flag`} />;
}
