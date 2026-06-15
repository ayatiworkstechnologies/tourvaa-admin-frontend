export function mediaUrl(value?: string | null) {
  if (!value) return "";

  try {
    const parsed = new URL(value);

    if (
      parsed.pathname.startsWith("/storage/") &&
      (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost")
    ) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return value;
  }

  return value;
}
