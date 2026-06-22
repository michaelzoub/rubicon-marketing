const DEFAULT_ORIGIN = "https://www.rubiconpay.xyz";
const platformEl = document.querySelector("#platform");
const titleEl = document.querySelector("#title");
const authorEl = document.querySelector("#author");
const statusEl = document.querySelector("#status");
const sendButton = document.querySelector("#send");
const connectEl = document.querySelector("#connect");
const tokenInput = document.querySelector("#token");
const originInput = document.querySelector("#origin");
const changeToken = document.querySelector("#change-token");
let activeTab;
let preview;
let settings;

function supportedPlatform(url) {
  try {
    const host = new URL(url).hostname;
    if (host === "substack.com" || host.endsWith(".substack.com")) return "Substack";
    if (host === "x.com" || host === "twitter.com") return "X";
  } catch {}
  return null;
}

function showConnection(show) {
  connectEl.classList.toggle("hidden", !show);
  changeToken.classList.toggle("hidden", show || !settings?.token);
  sendButton.classList.toggle("hidden", show);
}

async function requestExtraction() {
  const result = await chrome.tabs.sendMessage(activeTab.id, { type: "RUBICON_EXTRACT" });
  if (result?.error) throw new Error(result.error);
  return result;
}

async function init() {
  [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  settings = await chrome.storage.local.get(["token", "origin"]);
  settings.origin = settings.origin || DEFAULT_ORIGIN;
  originInput.value = settings.origin;
  const platform = supportedPlatform(activeTab?.url || "");
  if (!platform) {
    platformEl.textContent = "Unsupported page";
    titleEl.textContent = "Open a Substack or X post";
    statusEl.textContent = "This extension only imports supported post pages.";
    return;
  }

  platformEl.textContent = `${platform} detected`;
  try {
    preview = await requestExtraction();
    titleEl.textContent = preview?.title || (platform === "X" ? "X post" : "Substack draft");
    authorEl.textContent = preview?.authorName || preview?.authorHandle || "Author not detected";
    sendButton.disabled = false;
  } catch {
    titleEl.textContent = "Reload this page to import it";
    statusEl.textContent = "The extension could not read the current tab yet.";
  }
  showConnection(!settings.token);
}

document.querySelector("#save").addEventListener("click", async () => {
  const token = tokenInput.value.trim();
  let origin;
  try { origin = new URL(originInput.value.trim()).origin; } catch { statusEl.textContent = "Enter a valid Rubicon app URL."; return; }
  if (!token.startsWith("rbx_")) { statusEl.textContent = "Paste a valid Rubicon extension token."; return; }
  await chrome.storage.local.set({ token, origin });
  settings = { token, origin };
  statusEl.textContent = "Connection saved.";
  showConnection(false);
});

document.querySelector("#open-settings").addEventListener("click", () => {
  const origin = originInput.value.trim() || DEFAULT_ORIGIN;
  chrome.tabs.create({ url: `${origin.replace(/\/$/, "")}/dashboard/settings` });
});
changeToken.addEventListener("click", () => showConnection(true));

sendButton.addEventListener("click", async () => {
  sendButton.disabled = true;
  sendButton.textContent = "Creating draft...";
  statusEl.textContent = "";
  try {
    const payload = await requestExtraction();
    const endpoint = `${settings.origin}/api/import/extension`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${settings.token}` },
      body: JSON.stringify(payload),
    });
    const responseText = await response.text();
    let result = {};
    try { result = responseText ? JSON.parse(responseText) : {}; } catch {}
    if (!response.ok) {
      const detail = result.error?.message || `HTTP ${response.status} from ${endpoint}`;
      throw new Error(detail);
    }
    await chrome.tabs.create({ url: result.reviewUrl });
    window.close();
  } catch (error) {
    statusEl.textContent = error instanceof Error ? error.message : "Import failed. Try again.";
    sendButton.disabled = false;
    sendButton.textContent = "Send to Rubicon";
  }
});

init();
