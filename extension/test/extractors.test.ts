// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { extractSubstack } from "../platformExtractors/substackExtractor.js";
import { extractX } from "../platformExtractors/xExtractor.js";

function fixture(name: string): Document {
  const html = readFileSync(resolve(__dirname, "fixtures", name), "utf8");
  return new DOMParser().parseFromString(html, "text/html");
}

describe("extension extractors", () => {
  it("extracts a published Substack post with sections and media", () => {
    const result = extractSubstack(fixture("substack.html"), "https://ada.substack.com/p/paid-agents?utm_source=x");
    expect(result).toMatchObject({
      sourcePlatform: "substack",
      sourceUrl: "https://ada.substack.com/p/paid-agents",
      title: "Paid agents are here",
      authorName: "Ada Writer",
      isPartial: false,
    });
    expect(result.body).toContain("## What changed");
    expect(result.sections).toContainEqual({ heading: "What changed", text: "The payment loop became simple." });
    expect(result.media[0]).toMatchObject({ type: "image", alt: "Payment chart" });
  });

  it("extracts the selected X post", () => {
    const result = extractX(fixture("x.html"), "https://x.com/ada/status/123?s=20");
    expect(result).toMatchObject({
      sourcePlatform: "x",
      sourceUrl: "https://x.com/ada/status/123",
      authorName: "Ada Writer",
      authorHandle: "ada",
      body: "Agents can now pay for exactly the words they read.",
      publishedAt: "2026-06-20T12:00:00Z",
    });
    expect(result.warnings[0]).toContain("Thread import is experimental");
  });
});
