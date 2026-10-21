import { describe, expect, it } from "vitest";

import { extractFaqsFromContent } from "@/lib/types/blog";


describe("legacy blog FAQ content", () => {
  it("extracts a raw trailing FAQ JSON array without exposing it as article text", () => {
    const raw = `Plan your journey with Tourvaa.\n\n[\n  {\n    "question": "What should I check?",\n    "answer": "Review the itinerary and inclusions."\n  }\n]`;

    const result = extractFaqsFromContent(raw);

    expect(result.cleanContent).toBe("Plan your journey with Tourvaa.");
    expect(result.faqs).toEqual([
      { question: "What should I check?", answer: "Review the itinerary and inclusions." },
    ]);
  });

  it("keeps an ordinary article list that is not valid FAQ JSON", () => {
    const raw = "Packing list:\n\n[passport, tickets]";
    const result = extractFaqsFromContent(raw);

    expect(result.cleanContent).toBe(raw);
    expect(result.faqs).toEqual([]);
  });
});
