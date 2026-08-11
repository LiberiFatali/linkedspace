/**
 * LinkedSpace – popup.js
 * Manages the master toggle state and communicates with content.js.
 */

'use strict';

const LCS_STORAGE_KEY = 'lcsEnabled';

const masterToggle = document.getElementById('masterToggle');
const statusCard   = document.getElementById('statusCard');
const statusText   = document.getElementById('statusText');

/** Update the status badge based on current page and enabled state. */
function updateStatus(isMessaging, enabled) {
  if (!enabled) {
    statusCard.className  = 'status-card inactive';
    statusText.textContent = 'Extension paused';
    return;
  }
  if (isMessaging) {
    statusCard.className  = 'status-card active';
    statusText.textContent = 'Active on this tab ✓';
  } else {
    statusCard.className  = 'status-card inactive';
    statusText.textContent = 'Navigate to LinkedIn Messaging';
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
    if (!tab?.id || !tab.url?.includes('linkedin.com')) return null;
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch {
    return null; // Content script not ready – silently ignore
  }
}

/** Initialize popup: load persisted state then sync with the active tab. */
async function init() {
  const { [LCS_STORAGE_KEY]: enabled } = await chrome.storage.sync.get({ [LCS_STORAGE_KEY]: true });
  masterToggle.checked = enabled;

  // Ask the content script for the live page state (single tabs.query)
  const response = await sendToContentScript({ action: 'getState' });
  const isMessaging = response?.isMessaging
    ?? window.location.href.includes('linkedin.com/messaging'); // fallback

  updateStatus(isMessaging, enabled);
}

/** Toggle handler — persist state and propagate to content script immediately. */
masterToggle.addEventListener('change', async () => {
  const enabled = masterToggle.checked;
  await chrome.storage.sync.set({ [LCS_STORAGE_KEY]: enabled });

  const response = await sendToContentScript({ action: enabled ? 'enable' : 'disable' });
  updateStatus(response?.isMessaging ?? false, enabled);
});

init();
