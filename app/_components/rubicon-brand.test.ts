import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RubiconBrand } from "./rubicon-brand";

describe("RubiconBrand", () => {
  it("uses the canonical logo asset", () => {
    const markup = renderToStaticMarkup(createElement(RubiconBrand));
    expect(markup).toContain('src="/RUBICONLOGO.svg"');
    expect(markup).toContain('aria-label="Rubicon"');
  });

  it("marks light-surface usage for styling", () => {
    const markup = renderToStaticMarkup(createElement(RubiconBrand, { onLight: true }));
    expect(markup).toContain('src="/RUBICONLOGO.svg"');
    expect(markup).toContain("rubicon-brand--on-light");
  });
});
