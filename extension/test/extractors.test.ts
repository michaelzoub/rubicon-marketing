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
  it("preserves Substack structure, inline formatting, links, and images", () => {
    const result = extractSubstack(fixture("substack.html"), "https://ada.substack.com/p/paid-agents?utm_source=x");
    expect(result).toMatchObject({
      sourcePlatform: "substack",
      sourceUrl: "https://ada.substack.com/p/paid-agents",
      title: "Paid agents are here",
      authorName: "Ada Writer",
      isPartial: false,
    });
    expect(result.body).toContain("Opening with **bold text**, *italic text*, ~~old text~~, `inline()`, and [a source](https://ada.substack.com/p/source-note).");
    expect(result.body).toContain("## What changed");
    expect(result.body).toContain("The ***payment loop*** became simple.");
    expect(result.body).toContain("- Fast settlement\n  - With receipts\n- Exact pricing");
    expect(result.body).toContain("3. Connect\n4. Publish");
    expect(result.body).toContain("> Agents pay for exactly what they read.\n>\n> Creators keep control.");
    expect(result.body).toContain("```\nconst paid = true;\n```");
    expect(result.body).toContain("\n\n---\n\n");
    expect(result.body).toContain("![Payment chart](https://ada.substack.com/images/chart.png)");
    expect(result.body).toContain("*Words and earnings over time*");
    expect(result.sections.find((section) => section.heading === "What changed")?.text).toContain("**payment loop**");
    expect(result.media).toEqual([{ type: "image", url: "https://ada.substack.com/images/chart.png", alt: "Payment chart" }]);
  });

  it("reads the real title value from an open Substack editor", () => {
    const doc = new DOMParser().parseFromString(`
      <html><head><meta property="og:title" content="Drafts - Ada's Newsletter"></head><body>
        <input placeholder="Publication title" value="Ada's Newsletter">
        <textarea placeholder="Title">The article title in the editor</textarea>
        <textarea placeholder="Subtitle">A useful subtitle</textarea>
        <div data-testid="editor"><div class="ProseMirror" contenteditable="true"><p>Draft body.</p></div></div>
      </body></html>
    `, "text/html");
    const result = extractSubstack(doc, "https://ada.substack.com/publish/post/123");
    expect(result.title).toBe("The article title in the editor");
    expect(result.subtitle).toBe("A useful subtitle");
  });

  it("uses the structured article headline instead of a publication heading", () => {
    const doc = new DOMParser().parseFromString(`
      <html><head>
        <meta property="og:site_name" content="Ada's Newsletter">
        <meta property="og:title" content="The correct article title — Ada's Newsletter">
        <script type="application/ld+json">{"@graph":[{"@type":"NewsArticle","headline":"The correct article title"}]}</script>
      </head><body><main><h1>Ada's Newsletter</h1><article><div class="body markup"><p>Article body.</p></div></article></main></body></html>
    `, "text/html");
    const result = extractSubstack(doc, "https://ada.substack.com/p/correct-title");
    expect(result.title).toBe("The correct article title");
  });

  it("removes an exact publication suffix from metadata titles", () => {
    const doc = new DOMParser().parseFromString(`
      <html><head>
        <meta property="og:site_name" content="Ada's Newsletter">
        <meta property="og:title" content="An essay about agents | Ada's Newsletter">
      </head><body><article><div class="body markup"><p>Article body.</p></div></article></body></html>
    `, "text/html");
    const result = extractSubstack(doc, "https://ada.substack.com/p/agents");
    expect(result.title).toBe("An essay about agents");
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

  it("recovers the CDN image url from data-attrs when the editor shows a blob src", () => {
    const doc = new DOMParser().parseFromString(`
      <html><head><link rel="canonical" href="https://ada.substack.com/p/post"></head><body>
        <div data-testid="editor"><div class="ProseMirror" contenteditable="true">
          <p>Intro line.</p>
          <div class="image2-inset" data-attrs='{"src":"https://substackcdn.com/image/fetch/abc/banner.png","fullscreen":"https://substackcdn.com/full/banner.png"}'>
            <a class="image-link" href="#">
              <picture>
                <source srcset="https://substackcdn.com/image/fetch/w_1456/banner.png 1456w">
                <img src="blob:https://substack.com/9f-uuid" alt="Banner">
              </picture>
            </a>
          </div>
        </div></div>
      </body></html>
    `, "text/html");
    const result = extractSubstack(doc, "https://ada.substack.com/publish/post/1");
    expect(result.body).toContain("![Banner](https://substackcdn.com/image/fetch/w_1456/banner.png)");
    expect(result.media).toContainEqual({
      type: "image",
      url: "https://substackcdn.com/image/fetch/w_1456/banner.png",
      alt: "Banner",
    });
  });
});
