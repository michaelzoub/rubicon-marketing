import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RubiconBrand } from "./rubicon-brand";

describe("RubiconBrand", () => {
  it("uses the canonical logo asset", () => {
    const markup = renderToStaticMarkup(createElement(RubiconBrand));
    expect(markup).toContain('href="/rubicon-new.png"');
    expect(markup).toContain('aria-label="Rubicon"');
  });

  it("adds a dark backing on light surfaces", () => {
    const markup = renderToStaticMarkup(createElement(RubiconBrand, { onLight: true }));
    expect(markup).toContain("bg-[#0d0e11]");
  });
});
