function canonicalStatusUrl(pageUrl) {
  const url = new URL(pageUrl);
  const match = url.pathname.match(/^\/([^/]+)\/status\/(\d+)/);
  return match ? `https://x.com/${match[1]}/status/${match[2]}` : pageUrl;
}

export function extractX(doc, pageUrl) {
  const path = new URL(pageUrl).pathname;
  const statusMatch = path.match(/^\/([^/]+)\/status\/(\d+)/);
  const articles = [...doc.querySelectorAll('article[data-testid="tweet"], article')];
  const target = articles.find((article) => {
    const link = article.querySelector('a[href*="/status/"]')?.getAttribute("href") || "";
    return statusMatch ? link.includes(`/status/${statusMatch[2]}`) : false;
  }) || articles[0];
  if (!target) throw new Error("No post was found on this page.");

  const tweetText = target.querySelector('[data-testid="tweetText"]')?.textContent?.trim() || null;
  const userBlock = target.querySelector('[data-testid="User-Name"]');
  const userText = (userBlock?.textContent || "").trim();
  const handleMatch = userText.match(/@[A-Za-z0-9_]{1,15}/);
  const handle = handleMatch?.[0] || (statusMatch ? `@${statusMatch[1]}` : null);
  const name = (handle ? userText.replace(handle, "") : userText).replace(/\s*[·•]\s*$/, "").trim() || null;
  const publishedAt = target.querySelector("time[datetime]")?.getAttribute("datetime") || null;
  const media = [...target.querySelectorAll('[data-testid="tweetPhoto"] img, video')].map((node) => ({
    type: node.tagName === "VIDEO" ? "video" : "image",
    url: node.tagName === "VIDEO" ? node.getAttribute("poster") : node.getAttribute("src"),
    alt: node.getAttribute("alt"),
  }));
  const warnings = ["Thread import is experimental. This draft contains the selected post; review it before publishing."];
  return { sourcePlatform: "x", sourceUrl: canonicalStatusUrl(pageUrl), title: null, subtitle: null, authorName: name, authorHandle: handle?.replace(/^@/, "") || null, publishedAt, body: tweetText, sections: tweetText ? [{ heading: null, text: tweetText }] : [], media, rawExtractedText: tweetText, warnings, isPartial: false };
}
