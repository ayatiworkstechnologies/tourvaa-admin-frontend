const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);
const SHORT_LINK_HOSTS = new Set(["youtu.be", "www.youtu.be"]);

/** Extract an ID only from supported YouTube watch, share, or embed URLs. */
export function getYouTubeVideoId(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;

  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password || url.port) return null;

    let candidate: string | null = null;
    if (SHORT_LINK_HOSTS.has(url.hostname)) {
      const segments = url.pathname.split("/").filter(Boolean);
      candidate = segments.length === 1 ? segments[0] : null;
    } else if (YOUTUBE_HOSTS.has(url.hostname)) {
      if (url.pathname === "/watch") {
        candidate = url.searchParams.get("v");
      } else {
        const match = url.pathname.match(/^\/embed\/([^/]+)\/?$/);
        candidate = match?.[1] ?? null;
      }
    }

    return candidate && VIDEO_ID_PATTERN.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

export function getYouTubeThumbnailUrl(videoId: string): string {
  if (!VIDEO_ID_PATTERN.test(videoId)) return "";
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/** Build the embed URL from an already-validated ID, never from the raw URL. */
export function getYouTubeEmbedUrl(videoId: string, autoplay = false): string {
  if (!VIDEO_ID_PATTERN.test(videoId)) return "";
  const url = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
  if (autoplay) {
    url.searchParams.set("autoplay", "1");
    url.searchParams.set("rel", "0");
  }
  return url.toString();
}
