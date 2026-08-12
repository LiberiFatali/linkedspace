/**
 * LinkedSpace – content.js
 *
 * Expands LinkedIn's messaging interface to full-width on both sides.
 *
 * Two CSS classes are applied to <html>:
 *   lcs-active    → any LinkedIn page that contains a messaging element
 *                   (e.g. overlay chat bubble on non-messaging pages)
 *   lcs-messaging → only on /messaging dedicated page
 *                   (safe to collapse the right aside here)
 *
 * Layout expansion uses both:
 *   • CSS (styles.css)   — scaffold-level overrides
 *   • JS inline styles   — inner panel expansion, resilient to LinkedIn's
 *                          rotating class names and React inline style overrides
 */

'use strict';

const LCS_CLASS       = 'lcs-active';
const LCS_MSG_CLASS   = 'lcs-messaging';
const LCS_STORAGE_KEY = 'lcsEnabled';

/** Selectors indicating a messaging element exists on any LinkedIn page. */
const OVERLAY_SELECTORS = [
  '.msg-overlay-list-bubble',
  '.msg-overlay-bubble-header',
  '[data-view-name*="messaging"]',
  '[id*="msg-overlay"]',
];

/** Top-level outer wrapper selectors for the messaging panel. */
const OUTER_MSG_SELECTORS = [
  '.msg-conversations-container',
  '.msg-s-page-layout',
  '[class*="msg-conversations-container"]',
  '[class*="msg-s-page-layout"]',
];

/** Inner thread/chat panel selectors. */
const THREAD_SELECTORS = [
  '.msg-convo-wrapper',
  '.msg-thread',
  '.msg-s-page-layout__conversation-container',
  '.msg-s-message-list-content',
  '.msg-s-message-list',
  '[class*="msg-thread"]',
  '[class*="msg-convo-wrapper"]',
  '[class*="msg-s-message-list"]',
];

/* ─── helpers ─────────────────────────────────────────────── */

function isMessagingPage() {
  return window.location.pathname.startsWith('/messaging');
}

function hasMessagingElement() {
  if (isMessagingPage()) return true;
  return OVERLAY_SELECTORS.some(sel => document.querySelector(sel) !== null);
}

/**
 * Apply an inline style with !important priority.
 * No-op if the element is null.
 */
function forceStyle(el, prop, value) {
  el?.style.setProperty(prop, value, 'important');
}

/* ─── scaffold expansion ──────────────────────────────────── */

function expandScaffold() {
  // Outer scaffold containers
  [
    '.scaffold-layout',
    '.scaffold-layout-container',
    '.scaffold-layout-container--reflow',
    '.scaffold-layout__content-container',
  ].forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      forceStyle(el, 'max-width', '100%');
      forceStyle(el, 'width', '100%');
      forceStyle(el, 'padding-left', '0');
      forceStyle(el, 'padding-right', '0');
      forceStyle(el, 'box-sizing', 'border-box');
    });
  });

  // Main content column — grows to fill space freed by collapsing the aside
  const main = document.querySelector('.scaffold-layout__main');
  forceStyle(main, 'max-width', '100%');
  forceStyle(main, 'width', '100%');
  forceStyle(main, 'flex', '1 1 auto');
  forceStyle(main, 'min-width', '0');
  forceStyle(main, 'padding-left', '0');
  forceStyle(main, 'padding-right', '0');

  // Right aside (ads/recommendations) — collapse to reclaim horizontal space
  const aside = document.querySelector('.scaffold-layout__aside');
  forceStyle(aside, 'width', '0');
  forceStyle(aside, 'min-width', '0');
  forceStyle(aside, 'max-width', '0');
  forceStyle(aside, 'flex', '0 0 0px');
  forceStyle(aside, 'overflow', 'hidden');
  forceStyle(aside, 'padding', '0');
  forceStyle(aside, 'margin', '0');
  forceStyle(aside, 'border', 'none');

  // The messaging row is a CSS Grid that reserves a fixed track for the right
  // aside. Zeroing the aside's width can't collapse a fixed grid track, so
  // rewrite the row's grid-template-columns to a single full-width column.
  document.querySelectorAll('.scaffold-layout__row[class*="--list-detail-aside"]').forEach(el => {
    forceStyle(el, 'grid-template-columns', 'minmax(0, 1fr)');
    forceStyle(el, 'column-gap', '0');
  });
}

/* ─── messaging panel expansion ──────────────────────────── */

/**
 * Expand the messaging containers using direct DOM traversal.
 * Does NOT force a width on the sidebar — it keeps its natural size.
 * The thread panel is given flex: 1 1 auto so it fills remaining space.
 *
 * Retries up to `maxRetries` times if the panel hasn't rendered yet.
 */
function expandMessagingPanel(attempt = 0) {
  const MAX_RETRIES  = 5;
  const RETRY_DELAY  = 400; // ms between retries

  // Find the outer messaging wrapper
  let outerWrapper = null;
  for (const sel of OUTER_MSG_SELECTORS) {
    outerWrapper = document.querySelector(sel);
    if (outerWrapper) break;
  }

  // Fallback: first child of scaffold main
  if (!outerWrapper) {
    const main = document.querySelector('.scaffold-layout__main');
    outerWrapper = main?.firstElementChild ?? null;
  }

  if (!outerWrapper) {
    if (attempt < MAX_RETRIES) {
      setTimeout(() => expandMessagingPanel(attempt + 1), RETRY_DELAY);
    }
    return;
  }

  // Expand the outer wrapper
  forceStyle(outerWrapper, 'max-width', '100%');
  forceStyle(outerWrapper, 'width', '100%');
  forceStyle(outerWrapper, 'flex', '1 1 auto');
  forceStyle(outerWrapper, 'min-width', '0');
  forceStyle(outerWrapper, 'display', 'flex');

  // Distribute space among direct children:
  //   First child (narrow, < 400px) → sidebar, keep its natural width
  //   Remaining children            → thread panel(s), grow to fill
  Array.from(outerWrapper.children).forEach((child, i) => {
    const rect = child.getBoundingClientRect();
    const isSidebar = i === 0 && rect.width > 0 && rect.width < 400;

    if (isSidebar) {
      forceStyle(child, 'flex', '0 0 auto');
      forceStyle(child, 'min-width', '0');
    } else {
      forceStyle(child, 'flex', '1 1 auto');
      forceStyle(child, 'max-width', '100%');
      forceStyle(child, 'min-width', '0');
      forceStyle(child, 'width', '100%');
    }
  });

  // Drill into any inner thread containers that carry their own width constraints
  THREAD_SELECTORS.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      forceStyle(el, 'max-width', '100%');
      forceStyle(el, 'width', '100%');
      forceStyle(el, 'flex', '1 1 auto');
      forceStyle(el, 'min-width', '0');
    });
  });
}

/* ─── state management ────────────────────────────────────── */

function applyState(enabled) {
  const html = document.documentElement;

  if (!enabled) {
    html.classList.remove(LCS_CLASS, LCS_MSG_CLASS);
    return;
  }

  if (isMessagingPage()) {
    html.classList.add(LCS_MSG_CLASS);
    expandScaffold();
    expandMessagingPanel(); // retries internally until DOM is ready
  } else {
    html.classList.remove(LCS_MSG_CLASS);
  }

  if (hasMessagingElement()) {
    html.classList.add(LCS_CLASS);
  } else {
    html.classList.remove(LCS_CLASS);
  }
}

/* ─── init ────────────────────────────────────────────────── */

let currentEnabled = true;

chrome.storage.sync.get({ [LCS_STORAGE_KEY]: true }, ({ [LCS_STORAGE_KEY]: enabled }) => {
  currentEnabled = enabled;
  applyState(currentEnabled);
});

/* ─── MutationObserver: survive SPA navigation & re-renders ── */

let debounceTimer = null;

const observer = new MutationObserver(() => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => applyState(currentEnabled), 200);
});

observer.observe(document.body, { childList: true, subtree: true });

/* ─── popup message handler ───────────────────────────────── */

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.action) {
    case 'enable':
      currentEnabled = true;
      applyState(true);
      sendResponse({ success: true, enabled: true });
      break;
    case 'disable':
      currentEnabled = false;
      applyState(false);
      sendResponse({ success: true, enabled: false });
      break;
    case 'getState':
      sendResponse({
        enabled: currentEnabled,
        isMessaging: isMessagingPage(),
      });
      break;
  }
  return true; // keep channel open for async sendResponse
});
