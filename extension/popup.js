const DEFAULT_ORIGIN = "https://www.rubiconpay.xyz";
const SETTINGS_URL = "https://www.rubiconpay.xyz/dashboard/settings#extension-token";
const platformEl = document.querySelector("#platform");
const titleEl = document.querySelector("#title");
const authorEl = document.querySelector("#author");
const statusEl = document.querySelector("#status");
const sendButton = document.querySelector("#send");
const sendButtonLabel = sendButton.querySelector(".button-label");
const connectEl = document.querySelector("#connect");
const tokenInput = document.querySelector("#token");
const originInput = document.querySelector("#origin");
const changeToken = document.querySelector("#change-token");
const connPill = document.querySelector("#conn-pill");
const connText = document.querySelector("#conn-text");
let activeTab;
let preview;
let settings;

function setStatus(message = "", kind = "error") {
  statusEl.textContent = message;
  if (message) statusEl.dataset.kind = kind;
  else delete statusEl.dataset.kind;
}

function normalizedOrigin(value) {
  const url = new URL(value.trim());
  const origin = url.origin;
  if (origin !== DEFAULT_ORIGIN && origin !== "http://localhost:3000") {
    throw new Error("Use rubiconpay.xyz or http://localhost:3000.");
  }
  return origin;
}

function supportedPlatform(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    if (host === "substack.com" || host.endsWith(".substack.com")) return "Substack";
    if (host === "x.com" || host === "twitter.com") return "X";
    if (parsed.pathname.startsWith("/p/")) return "Substack";
  } catch {}
  return null;
}

function updateConnectionPill() {
  const connected = Boolean(settings?.token);
  connPill.dataset.state = connected ? "on" : "off";
  connText.textContent = connected ? "Connected" : "Not connected";
}

function showConnection(show) {
  connectEl.classList.toggle("hidden", !show);
  changeToken.classList.toggle("hidden", show || !settings?.token);
  sendButton.classList.toggle("hidden", show);
  updateConnectionPill();
}

async function requestExtraction() {
  let result;
  try {
    result = await chrome.tabs.sendMessage(activeTab.id, { type: "RUBICON_EXTRACT" });
  } catch {
    await chrome.scripting.executeScript({ target: { tabId: activeTab.id }, files: ["contentScript.js"] });
    result = await chrome.tabs.sendMessage(activeTab.id, { type: "RUBICON_EXTRACT" });
  }
  if (result?.error) throw new Error(result.error);
  return result;
}

async function init() {
  [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  settings = await chrome.storage.local.get(["token", "origin"]);
  try { settings.origin = normalizedOrigin(settings.origin || DEFAULT_ORIGIN); }
  catch { settings.origin = DEFAULT_ORIGIN; }
  originInput.value = settings.origin;
  updateConnectionPill();
  const platform = supportedPlatform(activeTab?.url || "");
  if (!platform) {
    platformEl.textContent = "Unsupported page";
    titleEl.textContent = "Open a Substack or X post";
    setStatus("This extension imports published Substack and X posts, including Substack custom domains.");
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
    setStatus("The extension could not read the current tab yet.");
  }
  showConnection(!settings.token);
}

document.querySelector("#save").addEventListener("click", async () => {
  const token = tokenInput.value.trim();
  let origin;
  try { origin = normalizedOrigin(originInput.value); } catch (error) { setStatus(error instanceof Error ? error.message : "Enter a valid Rubicon app URL."); return; }
  if (!token.startsWith("rbx_") || token.length < 12) { setStatus("Paste a valid Rubicon extension token."); return; }
  await chrome.storage.local.set({ token, origin });
  settings = { token, origin };
  setStatus("Connection saved.", "success");
  showConnection(false);
});

document.querySelector("#open-settings").addEventListener("click", () => {
  chrome.tabs.create({ url: SETTINGS_URL });
});
changeToken.addEventListener("click", () => {
  setStatus();
  tokenInput.value = "";
  showConnection(true);
  tokenInput.focus();
});

sendButton.addEventListener("click", async () => {
  sendButton.disabled = true;
  sendButton.classList.add("is-loading");
  sendButtonLabel.textContent = "Creating draft...";
  setStatus("Extracting this post and preparing your draft.", "progress");
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
    const reviewUrl = new URL(result.reviewUrl || "", settings.origin);
    if (reviewUrl.origin !== settings.origin || !reviewUrl.pathname.startsWith("/dashboard/imports/")) {
      throw new Error("Rubicon created the draft but returned an invalid review link.");
    }
    setStatus("Draft created. Opening review...", "success");
    await chrome.tabs.create({ url: reviewUrl.href });
    window.close();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Import failed. Try again.");
    sendButton.disabled = false;
    sendButton.classList.remove("is-loading");
    sendButtonLabel.textContent = "Try again";
  }
});

init();
