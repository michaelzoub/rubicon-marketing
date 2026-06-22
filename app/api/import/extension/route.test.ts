import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  createDraft: vi.fn(),
  serviceClient: vi.fn(),
}));

vi.mock("@/lib/rubicon/import", async () => import("../../../../lib/rubicon/import"));
vi.mock("@/lib/rubicon/extension-tokens", async () => import("../../../../lib/rubicon/extension-tokens"));

vi.mock("@/lib/rubicon/import-server", async () => {
  const actual = await import("../../../../lib/rubicon/import-server");
  return {
    ...actual,
    authenticateExtensionToken: mocks.authenticate,
    createImportDraft: mocks.createDraft,
    serviceClient: mocks.serviceClient,
  };
});

import { POST } from "./route";

const payload = {
  sourcePlatform: "substack",
  sourceUrl: "https://writer.substack.com/p/test",
  title: "<b>Imported title</b>",
  subtitle: null,
  authorName: "Writer",
  authorHandle: null,
  publishedAt: null,
  body: "Readable body<script>alert(1)</script>",
  sections: [],
  media: [],
  rawExtractedText: "Readable body",
  warnings: [],
};

describe("POST /api/import/extension", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.serviceClient.mockReturnValue({ kind: "supabase" });
    mocks.authenticate.mockResolvedValue("creator_1");
    mocks.createDraft.mockResolvedValue({ draftId: "article_1", reviewUrl: "https://www.rubiconpay.xyz/dashboard/imports/article_1" });
  });

  it("authenticates, sanitizes, and creates a reviewable draft", async () => {
    const response = await POST(new Request("https://www.rubiconpay.xyz/api/import/extension", {
      method: "POST",
      headers: { authorization: "Bearer rbx_test-token", "content-type": "application/json" },
      body: JSON.stringify(payload),
    }));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ draftId: "article_1", reviewUrl: "https://www.rubiconpay.xyz/dashboard/imports/article_1" });
    expect(mocks.authenticate).toHaveBeenCalledWith({ kind: "supabase" }, "rbx_test-token");
    expect(mocks.createDraft).toHaveBeenCalledWith(
      { kind: "supabase" },
      "creator_1",
      expect.objectContaining({ title: "Imported title", body: "Readable body" }),
      "https://www.rubiconpay.xyz",
    );
  });

  it("requires an extension token", async () => {
    const response = await POST(new Request("https://www.rubiconpay.xyz/api/import/extension", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }));
    expect(response.status).toBe(401);
    expect(mocks.createDraft).not.toHaveBeenCalled();
  });
});
