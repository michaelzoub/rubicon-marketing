function text(root, selectors) {
  for (const selector of selectors) {
    const value = root.querySelector(selector)?.textContent?.trim();
    if (value) return value;
  }
  return null;
}

function meta(doc, selectors) {
  for (const selector of selectors) {
    const value = doc.querySelector(selector)?.getAttribute("content")?.trim();
    if (value) return value;
  }
  return null;
}

function markdownFrom(root) {
  const blocks = [...root.querySelectorAll("h1,h2,h3,h4,p,li,blockquote,pre")];
  return blocks.map((node) => {
    const value = node.textContent?.trim();
    if (!value) return "";
    if (/^H[1-4]$/.test(node.tagName)) return `${"#".repeat(Number(node.tagName[1]))} ${value}`;
    if (node.tagName === "LI") return `- ${value}`;
    if (node.tagName === "BLOCKQUOTE") return `> ${value}`;
    return value;
  }).filter(Boolean).join("\n\n");
}

function sectionsFrom(root) {
  const sections = [];
  let current = { heading: null, text: [] };
  for (const node of root.querySelectorAll("h1,h2,h3,h4,p,li,blockquote,pre")) {
    const value = node.textContent?.trim();
    if (!value) continue;
    if (/^H[1-4]$/.test(node.tagName)) {
      if (current.heading || current.text.length) sections.push({ heading: current.heading, text: current.text.join("\n\n") });
      current = { heading: value, text: [] };
    } else current.text.push(value);
  }
  if (current.heading || current.text.length) sections.push({ heading: current.heading, text: current.text.join("\n\n") });
  return sections;
}

export function extractSubstack(doc, pageUrl) {
  // Substack uses ProseMirror/Tiptap in the editor and several article class
  // names on published posts. Semantic fallbacks keep this useful across DOM changes.
  const editor = doc.querySelector('[contenteditable="true"].ProseMirror, .ProseMirror[contenteditable="true"], [data-testid="editor"] [contenteditable="true"]');
  const article = editor || doc.querySelector(".body.markup, .available-content, article .post-content, article, main");
  const title = text(doc, ['input[placeholder*="title" i]', 'textarea[placeholder*="title" i]', "h1.post-title", "article h1", "h1"]) || meta(doc, ['meta[property="og:title"]']);
  const subtitle = text(doc, ['input[placeholder*="subtitle" i]', '.subtitle', '.post-subtitle']) || meta(doc, ['meta[name="description"]']);
  const authorName = meta(doc, ['meta[name="author"]']) || text(doc, ['[rel="author"]', '.byline a', '.author-name']);
  const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute("href") || pageUrl;
  const publishedAt = doc.querySelector("time[datetime]")?.getAttribute("datetime") || meta(doc, ['meta[property="article:published_time"]']);
  const body = article ? markdownFrom(article) : null;
  const gated = Boolean(doc.querySelector('.paywall, [data-testid*="paywall"], .subscription-widget-wrap'));
  const media = article ? [...article.querySelectorAll("img[src]")].map((img) => ({ type: "image", url: img.currentSrc || img.getAttribute("src"), alt: img.getAttribute("alt") })) : [];
  const warnings = [];
  if (gated) warnings.push("Only the visible preview was imported. Review and add any gated content before publishing.");
  if (editor) warnings.push("Imported from the open Substack editor. Review formatting before publishing.");
  return { sourcePlatform: "substack", sourceUrl: canonical, title, subtitle, authorName, authorHandle: null, publishedAt, body, sections: article ? sectionsFrom(article) : [], media, rawExtractedText: article?.textContent?.trim() || null, warnings, isPartial: gated };
}
