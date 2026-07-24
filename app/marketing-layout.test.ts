import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("marketing landing layout", () => {
  it("keeps desktop content relative to the viewport at different zoom levels", () => {
    const css = readFileSync(resolve(process.cwd(), "app/marketing.css"), "utf8");

    expect(css).toContain("--landing-content-width: min(1320px, 80vw);");
    expect(css).toContain("--landing-content-width: calc(100% - 2 * 24px);");
    expect(css).not.toContain("--landing-content-width: min(1320px, calc(100% - 2 * clamp");
  });
});
