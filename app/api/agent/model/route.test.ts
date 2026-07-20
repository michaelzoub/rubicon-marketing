import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const fetchMock = vi.fn();

describe("POST /api/agent/model", () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-key";
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OPENROUTER_API_KEY;
  });

  it("rejects unknown tasks before contacting the provider", async () => {
    const response = await POST(new Request("https://rubiconpay.xyz/api/agent/model", {
      method: "POST",
      body: JSON.stringify({ task: "anything", input: "Find AI articles" }),
    }));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses the fixed instruct model and server-owned JSON prompt", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: '{"goal":"AI","keywords":["ai"]}' } }] })));

    const response = await POST(new Request("https://rubiconpay.xyz/api/agent/model", {
      method: "POST",
      body: JSON.stringify({ task: "plan", input: "Find AI articles" }),
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ content: '{"goal":"AI","keywords":["ai"]}' });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"model":"qwen/qwen3-30b-a3b-instruct-2507"'),
      }),
    );
    const upstreamBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(upstreamBody).toMatchObject({
      max_tokens: 250,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });
    expect(upstreamBody.messages).toEqual([
      expect.objectContaining({ role: "system" }),
      { role: "user", content: "Find AI articles" },
    ]);
  });
});
