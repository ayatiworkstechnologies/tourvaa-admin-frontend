import { describe, expect, it } from "vitest";
import {
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  getYouTubeVideoId,
} from "@/lib/tours/youtubeVideo";

const videoId = "dQw4w9WgXcQ";

describe("YouTube tour video URLs", () => {
  it.each([
    [`https://www.youtube.com/watch?v=${videoId}`, videoId],
    [`https://youtu.be/${videoId}`, videoId],
    [`https://www.youtube.com/embed/${videoId}`, videoId],
    [`http://m.youtube.com/watch?feature=share&v=${videoId}`, videoId],
  ])("extracts the ID from a supported URL: %s", (url, expectedId) => {
    expect(getYouTubeVideoId(url)).toBe(expectedId);
  });

  it.each([
    "",
    "not a URL",
    `https://youtube.com.evil.example/watch?v=${videoId}`,
    `https://youtu.be.evil.example/${videoId}`,
    `https://www.youtube.com/shorts/${videoId}`,
    "javascript:alert(1)",
    "https://www.youtube.com/watch?v=too-short",
    `https://user:pass@www.youtube.com/watch?v=${videoId}`,
  ])("rejects unsupported or malformed input: %s", (url) => {
    expect(getYouTubeVideoId(url)).toBeNull();
  });

  it("builds the thumbnail and privacy-enhanced official embed URLs from a validated ID", () => {
    expect(getYouTubeThumbnailUrl(videoId)).toBe(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
    expect(getYouTubeEmbedUrl(videoId)).toBe(`https://www.youtube-nocookie.com/embed/${videoId}`);

    const autoplayUrl = new URL(getYouTubeEmbedUrl(videoId, true));
    expect(autoplayUrl.origin).toBe("https://www.youtube-nocookie.com");
    expect(autoplayUrl.pathname).toBe(`/embed/${videoId}`);
    expect(autoplayUrl.searchParams.get("autoplay")).toBe("1");
    expect(autoplayUrl.searchParams.get("rel")).toBe("0");
  });

  it("does not generate URLs for invalid IDs", () => {
    expect(getYouTubeThumbnailUrl("not-an-id")).toBe("");
    expect(getYouTubeEmbedUrl("not-an-id", true)).toBe("");
  });
});
