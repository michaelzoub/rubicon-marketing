/**
 * Dependency-free HTML metadata extraction and HTML→Markdown conversion.
 *
 * We deliberately avoid a DOM library: a focused, well-tested set of regexes
 * keeps the import path light and, crucially, *sanitizing by construction* —
 * everything is reduced to plain Markdown text, so no untrusted HTML is ever
 * stored or rendered. This is an MVP-grade extractor: good enough for the
 * `og:`/JSON-LD metadata and readable article bodies publishers expose.
 */
import { ImportSection } from "./types";

/** Decode the handful of HTML entities that survive tag stripping. */
export function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "…")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => safeFromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => safeFromCodePoint(parseInt(dec, 10)));
}

function safeFromCodePoint(code: number): string {
  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}

/** Read a `<meta>` value by `property=` or `name=`, attribute order-agnostic. */
export function readMeta(html: string, key: string): string | null {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // property="og:title" ... content="..."  OR  content="..." ... property="og:title"
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*\\scontent=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${escaped}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return decodeEntities(m[1]).trim();
  }
  return null;
}

/** Read `<link rel="canonical" href="...">`. */
export function readCanonical(html: string): string | null {
  const m =
    html.match(/<link[^>]+rel=["']canonical["'][^>]*\shref=["']([^"']+)["']/i) ||
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
  return m ? decodeEntities(m[1]).trim() : null;
}

/** Parse every JSON-LD `<script>` block, tolerating malformed ones. */
export function readJsonLd(html: string): Record<string, unknown>[] {
  const blocks: Record<string, unknown>[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const parsed = JSON.parse(m[1].trim());
      if (Array.isArray(parsed)) blocks.push(...parsed.filter((x) => x && typeof x === "object"));
      else if (parsed && typeof parsed === "object") blocks.push(parsed);
    } catch {
      // Ignore malformed JSON-LD — metadata extraction is best-effort.
    }
  }
  return blocks;
}

/** Strip `<script>`/`<style>`/comments — content we never want in the body. */
function stripNonContent(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
}

/**
 * Convert a fragment of article HTML to clean Markdown. Headings become `#`
 * markers (so the existing section parser can split on them), lists become
 * `-`/`1.` items, and all other tags are dropped. The result is plain text
 * with Markdown structure — safe to store and render.
 */
export function htmlToMarkdown(html: string): string {
  let s = stripNonContent(html);

  // Headings → Markdown first (#, ##, ###; h4-6 collapse to ###), before the
  // generic block-close rule below can swallow their closing tags.
  s = s.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, t) => `\n\n# ${inline(t)}\n\n`);
  s = s.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, t) => `\n\n## ${inline(t)}\n\n`);
  s = s.replace(/<h([3-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, _l, t) => `\n\n### ${inline(t)}\n\n`);

  // List items.
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, t) => `- ${inline(t)}\n`);

  // Remaining block-level breaks.
  s = s.replace(/<\/(p|div|section|article|figure|blockquote|ul|ol|table|tr)>/gi, "\n\n");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<hr\s*\/?>/gi, "\n\n---\n\n");

  // Strip every remaining tag, then decode entities and tidy whitespace.
  s = s.replace(/<[^>]+>/g, "");
  s = decodeEntities(s);
  s = s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ");
  return s.trim();
}

/** Collapse inline markup inside a heading/list item to its text. */
function inline(fragment: string): string {
  return decodeEntities(fragment.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

/**
 * Split a Markdown body into heading-delimited sections. Mirrors the editor's
 * own heading convention so imported sections line up with what the gateway
 * will later parse. Leading content before the first heading becomes an
 * untitled (`heading: null`) section.
 */
export function splitSections(markdown: string): ImportSection[] {
  const lines = markdown.split(/\r?\n/);
  const sections: ImportSection[] = [];
  let heading: string | null = null;
  let buf: string[] = [];

  const flush = () => {
    const text = buf.join("\n").trim();
    if (text || heading) sections.push({ heading, text });
    buf = [];
  };

  for (const line of lines) {
    const m = line.match(/^#{1,3}\s+(.+)$/);
    if (m) {
      flush();
      heading = m[1].trim();
    } else {
      buf.push(line);
    }
  }
  flush();
  return sections;
}

/** Coerce a date-ish string to an ISO timestamp, or null if unparseable. */
export function toIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}
