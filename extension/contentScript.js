chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "RUBICON_EXTRACT") return false;
  (async () => {
    const host = location.hostname;
    if (host === "x.com" || host === "twitter.com") {
      const { extractX } = await import(chrome.runtime.getURL("platformExtractors/xExtractor.js"));
      return extractX(document, location.href);
    }
    if (host === "substack.com" || host.endsWith(".substack.com")) {
      const { extractSubstack } = await import(chrome.runtime.getURL("platformExtractors/substackExtractor.js"));
      return extractSubstack(document, location.href);
    }
    throw new Error("Unsupported page.");
  })().then(sendResponse, (error) => sendResponse({ error: error instanceof Error ? error.message : "Extraction failed." }));
  return true;
});
