/**
 * LinkedSpace – popup.js
 * Manages the master toggle state and communicates with content.js.
 */

'use strict';

const LCS_STORAGE_KEY = 'lcsEnabled';

const SUPPORTED_PAGES = ['messaging', 'home', 'network', 'jobs', 'notifications'];

const masterToggle = document.getElementById('masterToggle');
const statusCard   = document.getElementById('statusCard');
const statusText   = document.getElementById('statusText');

/** Check that a tab URL belongs to LinkedIn (exact host or subdomain). */
function isLinkedInUrl(url) {
  if (typeof url !== 'string' || url.length === 0) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === 'linkedin.com' || host.endsWith('.linkedin.com');
  } catch {
    return false;
  }
}

/** Derive the page kind from a tab URL (fallback when no content script). */
function pageFromUrl(url) {
  let p;
  try {
    p = new URL(url).pathname;
  } catch {
    return null;
  }
  if (p.startsWith('/messaging')) return 'messaging';
  if (p === '/' || p.startsWith('/feed')) return 'home';
  if (p.startsWith('/mynetwork')) return 'network';
  if (p.startsWith('/jobs')) return 'jobs';
  if (p.startsWith('/notifications')) return 'notifications';
  return null;
}

/** Update the status badge based on current page and enabled state. */
function updateStatus(page, enabled) {
  if (!enabled) {
    statusCard.className  = 'status-card inactive';
    statusText.textContent = 'Extension paused';
    return;
  }
  if (SUPPORTED_PAGES.includes(page)) {
    statusCard.className  = 'status-card active';
    statusText.textContent = 'Active on this tab ✓';
  } else {
    statusCard.className  = 'status-card inactive';
    statusText.textContent = 'Open a supported LinkedIn tab';
  }
}

/**
 * Send a message to the active tab's content script.
 * Returns the response object, or null if the tab is not LinkedIn
 * or the content script is not yet ready.
 */
async function sendToContentScript(message) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !isLinkedInUrl(tab.url)) return null;
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch {
    return null; // Content script not ready – silently ignore
  }
}

/**
 * Resolve the active tab's page kind. Prefers the live content script answer,
 * falling back to URL parsing when the script hasn't injected yet.
 */
async function currentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !isLinkedInUrl(tab.url)) return null;
    const response = await sendToContentScript({ action: 'getState' });
    return response?.page ?? pageFromUrl(tab.url);
  } catch {
    return null;
  }
}

/** Initialize popup: load persisted state then sync with the active tab. */
async function init() {
  const { [LCS_STORAGE_KEY]: enabled } = await chrome.storage.sync.get({ [LCS_STORAGE_KEY]: true });
  masterToggle.checked = enabled;
  updateStatus(await currentPage(), enabled);
}

/** Toggle handler — persist state and propagate to content script immediately. */
masterToggle.addEventListener('change', async () => {
  const enabled = masterToggle.checked;
  await chrome.storage.sync.set({ [LCS_STORAGE_KEY]: enabled });

  await sendToContentScript({ action: enabled ? 'enable' : 'disable' });
  updateStatus(await currentPage(), enabled);
});

init();
