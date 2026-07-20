import { beforeEach, describe, expect, it, vi } from "vitest";
import { listPublicCreators } from "./public";

const supabaseState = vi.hoisted(() => ({
  selects: [] as Array<{ table: string; columns: string }>,
  tables: [] as string[],
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: (table: string) => {
      supabaseState.tables.push(table);
      const builder = {
        select: (columns: string) => {
          supabaseState.selects.push({ table, columns });
          return builder;
        },
        eq: () => builder,
        in: () => builder,
        order: () => builder,
        returns: async () => {
          if (table === "articles") {
            return {
              data: [
                {
                  id: "article_1",
                  creator_id: "creator_1",
                  title: "Public article",
                  state: "live",
                  price_per_word_atomic: "1000",
                  max_article_price_atomic: null,
                  total_words: 1000,
                  source_platform: "x",
                  source_url: "https://x.com/writer/status/1",
                  source_author_handle: "writer",
                  created_at: "2026-01-01T00:00:00Z",
                  updated_at: "2026-01-02T00:00:00Z",
                },
              ],
              error: null,
            };
          }
          if (table === "creators") {
            return {
              data: [{ id: "creator_1", username: "writer", created_at: "2026-01-01T00:00:00Z" }],
              error: null,
            };
          }
          if (table === "article_sections") {
            return { data: [{ article_id: "article_1", heading: "Intro", ordinal: 0 }], error: null };
          }
          if (table === "word_payments") {
            return { data: [], error: null };
          }
          return { data: [], error: null };
        },
      };
      return builder;
    },
  })),
}));

describe("listPublicCreators", () => {
  beforeEach(() => {
    supabaseState.selects = [];
    supabaseState.tables = [];
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("fetches only usernames for creator identity on the public explore page", async () => {
    const creators = await listPublicCreators();

    expect(creators).toHaveLength(1);
    expect(creators[0]).toMatchObject({ username: "writer" });
    expect(creators[0]).not.toHaveProperty("displayName");
    expect(creators[0]).not.toHaveProperty("bio");
    expect(creators[0]).not.toHaveProperty("avatarUrl");
    expect(creators[0].articles[0]).not.toHaveProperty("author");

    expect(supabaseState.tables).not.toContain("creator_profiles");
    expect(supabaseState.selects).toContainEqual({
      table: "creators",
      columns: "id, username, created_at",
    });

    const selectedColumns = supabaseState.selects.map((call) => call.columns).join(", ");
    expect(selectedColumns).not.toMatch(/\bemail\b/i);
    expect(selectedColumns).not.toMatch(/\bdisplay_name\b/i);
    expect(selectedColumns).not.toMatch(/\bauthor\b/i);
    expect(selectedColumns).not.toMatch(/\bbio\b/i);
    expect(selectedColumns).not.toMatch(/\bavatar_url\b/i);
  });
});
