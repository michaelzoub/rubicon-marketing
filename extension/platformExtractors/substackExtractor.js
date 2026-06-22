function text(root, selectors) {
  for (const selector of selectors) {
    const node = root.querySelector(selector);
    const value = ("value" in (node || {}) ? node.value : node?.textContent)?.trim();
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

function jsonLdHeadline(doc) {
  const findHeadline = (value) => {
    if (!value || typeof value !== "object") return null;
    if (typeof value.headline === "string" && value.headline.trim()) return value.headline.trim();
    const children = Array.isArray(value) ? value : Object.values(value);
    for (const child of children) {
      const headline = findHeadline(child);
      if (headline) return headline;
    }
    return null;
  };

  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const headline = findHeadline(JSON.parse(script.textContent || ""));
      if (headline) return headline;
    } catch {
      // Malformed structured data should not block DOM/meta fallbacks.
    }
  }
  return null;
}

function cleanTitle(value, siteName) {
  if (!value) return null;
  let title = value.replace(/\s+/g, " ").trim();
  if (siteName) {
    const escaped = siteName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    title = title.replace(new RegExp(`\\s+(?:[|–—-])\\s+${escaped}$`, "i"), "").trim();
  }
  return title || null;
}

function markdownText(value) {
  return value.replace(/\s+/g, " ").replace(/([\\`*_[\]])/g, "\\$1");
}

function safeUrl(value, pageUrl) {
  if (!value) return null;
  try {
    const url = new URL(value, pageUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href.replace(/\(/g, "%28").replace(/\)/g, "%29");
  } catch {
    return null;
  }
}

// Substack stores the real CDN url in a JSON `data-attrs` blob (on the <img> or
// a wrapping element). In the editor the visible <img> is often a `blob:` object
// URL, so the http(s) source only lives here. Returns the best url it can find.
function dataAttrsSrc(el) {
  const raw = el?.getAttribute?.("data-attrs");
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    return data?.src || data?.fullscreen || data?.url || null;
  } catch {
    return null;
  }
}

function imageUrl(img, pageUrl) {
  const candidates = [
    img.currentSrc,
    img.getAttribute("src"),
    img.getAttribute("data-src"),
    img.getAttribute("data-original-src"),
    dataAttrsSrc(img),
    dataAttrsSrc(img.closest?.("[data-attrs]")),
  ];
  // Pull the largest entry from every relevant srcset, including sibling
  // <source> elements when the image sits inside a <picture>.
  const srcsets = [img.getAttribute("srcset"), img.getAttribute("data-srcset")];
  for (const source of img.closest?.("picture")?.querySelectorAll("source") || []) {
    srcsets.push(source.getAttribute("srcset"));
  }
  for (const srcset of srcsets) {
    if (!srcset) continue;
    const largest = srcset.split(",").map((part) => part.trim().split(/\s+/)[0]).filter(Boolean).pop();
    if (largest) candidates.unshift(largest);
  }
  for (const candidate of candidates) {
    const url = safeUrl(candidate, pageUrl);
    if (url) return url;
  }
  return null;
}

function imageMarkdown(img, pageUrl) {
  const url = imageUrl(img, pageUrl);
  if (!url) return "";
  const alt = markdownText(img.getAttribute("alt")?.trim() || "").replace(/\n/g, " ");
  return `![${alt}](${url})`;
}

function inlineMarkdown(node, pageUrl) {
  if (node.nodeType === 3) return markdownText(node.nodeValue || "");
  if (node.nodeType !== 1) return "";

  const tag = node.tagName;
  if (tag === "BR") return "\n";
  if (tag === "IMG") return imageMarkdown(node, pageUrl);

  const content = [...node.childNodes].map((child) => inlineMarkdown(child, pageUrl)).join("");
  if (!content.trim()) return content;
  if (tag === "STRONG" || tag === "B") return `**${content.trim()}**`;
  if (tag === "EM" || tag === "I") return `*${content.trim()}*`;
  if (tag === "S" || tag === "DEL" || tag === "STRIKE") return `~~${content.trim()}~~`;
  if (tag === "CODE") return `\`${content.trim().replace(/`/g, "\\`")}\``;
  if (tag === "A") {
    const href = safeUrl(node.getAttribute("href"), pageUrl);
    return href ? `[${content.trim()}](${href})` : content;
  }
  return content;
}

function listMarkdown(list, pageUrl, depth = 0) {
  const ordered = list.tagName === "OL";
  const start = Number(list.getAttribute("start")) || 1;
  const items = [...list.children].filter((child) => child.tagName === "LI");
  return items.map((item, index) => {
    const nestedLists = [...item.children].filter((child) => child.tagName === "UL" || child.tagName === "OL");
    const contentNodes = [...item.childNodes].filter((child) => child.nodeType !== 1 || (child.tagName !== "UL" && child.tagName !== "OL"));
    const content = contentNodes.map((child) => {
      if (child.nodeType === 1 && ["P", "DIV"].includes(child.tagName)) return inlineMarkdown(child, pageUrl).trim();
      return inlineMarkdown(child, pageUrl);
    }).join("").trim();
    const prefix = ordered ? `${start + index}. ` : "- ";
    const indent = "  ".repeat(depth);
    const main = `${indent}${prefix}${content}`.trimEnd();
    const nested = nestedLists.map((child) => listMarkdown(child, pageUrl, depth + 1)).filter(Boolean);
    return [main, ...nested].join("\n");
  }).join("\n");
}

function blockMarkdown(node, pageUrl) {
  if (node.nodeType === 3) return markdownText(node.nodeValue || "").trim();
  if (node.nodeType !== 1) return "";
  const tag = node.tagName;

  if (/^H[1-6]$/.test(tag)) {
    const level = Math.min(Number(tag[1]), 3);
    return `${"#".repeat(level)} ${inlineMarkdown(node, pageUrl).trim()}`;
  }
  if (tag === "P") return inlineMarkdown(node, pageUrl).trim();
  if (tag === "UL" || tag === "OL") return listMarkdown(node, pageUrl);
  if (tag === "BLOCKQUOTE") {
    const value = [...node.childNodes].map((child) => blockMarkdown(child, pageUrl)).filter(Boolean).join("\n\n");
    return value.split("\n").map((line) => `> ${line}`.trimEnd()).join("\n");
  }
  if (tag === "PRE") {
    const code = node.textContent?.replace(/^\n|\n$/g, "") || "";
    return code ? `\`\`\`\n${code}\n\`\`\`` : "";
  }
  if (tag === "HR") return "---";
  if (tag === "IMG") return imageMarkdown(node, pageUrl);
  if (tag === "FIGURE") {
    const images = [...node.querySelectorAll("img")].map((img) => imageMarkdown(img, pageUrl)).filter(Boolean);
    const caption = node.querySelector("figcaption")?.textContent?.trim();
    return [...new Set(images), caption ? `*${markdownText(caption)}*` : ""].filter(Boolean).join("\n\n");
  }
  if (tag === "FIGCAPTION") return "";

  return [...node.childNodes].map((child) => blockMarkdown(child, pageUrl)).filter(Boolean).join("\n\n");
}

function markdownFrom(root, pageUrl) {
  return [...root.childNodes]
    .map((node) => blockMarkdown(node, pageUrl))
    .filter(Boolean)
    .join("\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sectionsFrom(markdown) {
  const sections = [];
  let current = { heading: null, text: [] };
  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^#{1,3}\s+(.+)$/);
    if (heading) {
      if (current.heading || current.text.length) sections.push({ heading: current.heading, text: current.text.join("\n\n") });
      current = { heading: heading[1].trim(), text: [] };
    } else current.text.push(line);
  }
  if (current.heading || current.text.some((line) => line.trim())) sections.push({ heading: current.heading, text: current.text.join("\n").trim() });
  return sections;
}

export function extractSubstack(doc, pageUrl) {
  // Substack uses ProseMirror/Tiptap in the editor and several article class
  // names on published posts. Semantic fallbacks keep this useful across DOM changes.
  const editor = doc.querySelector('[contenteditable="true"].ProseMirror, .ProseMirror[contenteditable="true"], [data-testid="editor"] [contenteditable="true"]');
  const article = editor || doc.querySelector(".body.markup, .available-content, article .post-content, article, main");
  const siteName = meta(doc, ['meta[property="og:site_name"]']);
  const editorTitle = editor ? text(doc, [
    '[data-testid="post-title"] input',
    '[data-testid="post-title"] textarea',
    'input[placeholder="Title" i]',
    'textarea[placeholder="Title" i]',
    'input[aria-label="Title" i]',
    'textarea[aria-label="Title" i]',
    'input[placeholder*="post title" i]',
    'textarea[placeholder*="post title" i]',
  ]) : null;
  const title = cleanTitle(
    editorTitle ||
      text(doc, ['[data-testid="post-title"]', "h1.post-title", ".post-title"]) ||
      jsonLdHeadline(doc) ||
      meta(doc, ['meta[property="og:title"]', 'meta[name="twitter:title"]']) ||
      text(doc, ["article header h1", "article h1"]),
    siteName,
  );
  const subtitle = text(doc, ['input[placeholder="Subtitle" i]', 'textarea[placeholder="Subtitle" i]', '.subtitle', '.post-subtitle']) || meta(doc, ['meta[name="description"]']);
  const authorName = meta(doc, ['meta[name="author"]']) || text(doc, ['[rel="author"]', '.byline a', '.author-name']);
  const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute("href") || pageUrl;
  const publishedAt = doc.querySelector("time[datetime]")?.getAttribute("datetime") || meta(doc, ['meta[property="article:published_time"]']);
  const body = article ? markdownFrom(article, canonical) : null;
  const gated = Boolean(doc.querySelector('.paywall, [data-testid*="paywall"], .subscription-widget-wrap'));
  const media = article ? [...article.querySelectorAll("img")].map((img) => ({ type: "image", url: imageUrl(img, canonical), alt: img.getAttribute("alt") })).filter((item) => item.url).filter((item, index, all) => all.findIndex((other) => other.url === item.url) === index) : [];
  const warnings = [];
  if (gated) warnings.push("Only the visible preview was imported. Review and add any gated content before publishing.");
  if (editor) warnings.push("Imported from the open Substack editor. Review formatting before publishing.");
  return { sourcePlatform: "substack", sourceUrl: canonical, title, subtitle, authorName, authorHandle: null, publishedAt, body, sections: body ? sectionsFrom(body) : [], media, rawExtractedText: article?.textContent?.trim() || null, warnings, isPartial: gated };
}
