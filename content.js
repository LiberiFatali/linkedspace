/**
 * LinkedSpace – content.js
 *
 * Expands LinkedIn's dedicated /messaging page to full-width on both sides.
 * The floating chat overlay bubble is intentionally left untouched.
 *
 * One CSS class class is applied to <html>:
 *   lcs-messaging → only on /messaging dedicated page
 *                   (safe to collapse the right aside here)
 *
 * Layout expansion uses both:
 *   • CSS (styles.css)   — scaffold-level overrides
 *   • JS inline styles   — inner panel expansion, resilient to LinkedIn's
 *                          rotating class names and React inline style overrides
 */

'use strict';

const LCS_MSG_CLASS   = 'lcs-messaging';
const LCS_STORAGE_KEY = 'lcsEnabled';

/** Conversation list width — "just a bit wider" than LinkedIn's original,
 *  adaptive to the viewport between 1/6 and 1/3, capped at 400px. */
const SIDEBAR_MAX_PX       = 400; // cap on wide screens
const SIDEBAR_ADAPTIVE_N   = 1;   // adaptive fraction (1/3 of viewport)
const SIDEBAR_ADAPTIVE_D   = 3;
const SIDEBAR_FLOOR_N      = 1;   // hard floor (1/6 of viewport)
const SIDEBAR_FLOOR_D      = 6;

function sidebarWidth() {
  return Math.min(SIDEBAR_MAX_PX,
    Math.max(Math.round(window.innerWidth * SIDEBAR_ADAPTIVE_N / SIDEBAR_ADAPTIVE_D),
             Math.round(window.innerWidth * SIDEBAR_FLOOR_N / SIDEBAR_FLOOR_D)));
}

/** Top-level outer wrapper selectors for the messaging panel. */
const OUTER_MSG_SELECTORS = [
  '.scaffold-layout__list-detail',
  '.msg__list-detail',
  '.scaffold-layout__main',
  '.msg-s-page-layout',
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

  // Main content column — grows to fill space freed by collapsing the aside.
  // On the current UI the <main> element itself is the list-detail container.
  const main = document.querySelector('.scaffold-layout__list-detail, .msg__list-detail, .scaffold-layout__main');
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
  // force the row to a single full-width column whenever the aside shares a
  // grid parent with the messaging main column.
  if (main && aside && main.parentElement === aside.parentElement) {
    const parent = main.parentElement;
    const display = getComputedStyle(parent).display;
    if (display === 'grid' || display === 'inline-grid') {
      forceStyle(parent, 'grid-template-columns', 'minmax(0, 1fr)');
      forceStyle(parent, 'column-gap', '0');
    } else {
      forceStyle(parent, 'display', 'flex');
    }
  }

  // Legacy layout: the messaging row carries a --list-detail-aside modifier
  document.querySelectorAll('.scaffold-layout__row[class*="--list-detail-aside"]').forEach(el => {
    forceStyle(el, 'grid-template-columns', 'minmax(0, 1fr)');
    forceStyle(el, 'column-gap', '0');
  });
}

/* ─── messaging panel expansion ──────────────────────────── */

/**
 * Expand the messaging panel using direct DOM traversal.
 * The conversation list (left sidebar) is pinned to a viewport-adaptive width
 * (see sidebarWidth) and the thread panel grows to fill the remaining space.
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
    const main = document.querySelector('.scaffold-layout__main, .scaffold-layout__list-detail');
    outerWrapper = main?.firstElementChild ?? null;
  }

  if (!outerWrapper) {
    if (attempt < MAX_RETRIES) {
      setTimeout(() => expandMessagingPanel(attempt + 1), RETRY_DELAY);
    }
    return;
  }

  // Outer wrapper fills the full width
  forceStyle(outerWrapper, 'max-width', '100%');
  forceStyle(outerWrapper, 'width', '100%');
  forceStyle(outerWrapper, 'min-width', '0');

  const sidebar = sidebarWidth();

  // The list|detail split: locate the container that actually holds both
  // columns (on the current UI <main> itself is that container).
  const listCol = document.querySelector('.scaffold-layout__list');
  const detailCol = document.querySelector('.scaffold-layout__detail');
  let split = null;
  if (listCol && detailCol && listCol.parentElement === detailCol.parentElement) {
    split = listCol.parentElement;
  } else if (listCol) {
    split = listCol.parentElement;
  }

  if (split) {
    forceStyle(split, 'width', '100%');
    forceStyle(split, 'max-width', '100%');
    forceStyle(split, 'min-width', '0');
    forceStyle(split, 'column-gap', '0');
    forceStyle(split, 'row-gap', '0');

    const display = getComputedStyle(split).display;
    const extraChildren = Array.from(split.children).filter(c => c !== listCol && c !== detailCol);
    const pureSplit = extraChildren.length === 0;

    if (pureSplit && (display === 'grid' || display === 'inline-grid')) {
      forceStyle(split, 'grid-template-columns', `minmax(0, ${sidebar}px) minmax(0, 1fr)`);
      forceStyle(split, 'grid-template-rows', 'minmax(0, 1fr)');
    } else {
      forceStyle(split, 'display', 'flex');
      if (listCol) {
        forceStyle(listCol, 'flex', `0 0 ${sidebar}px`);
        forceStyle(listCol, 'width', `${sidebar}px`);
        forceStyle(listCol, 'max-width', `${sidebar}px`);
        forceStyle(listCol, 'min-width', '0');
      }
      if (detailCol) {
        forceStyle(detailCol, 'flex', '1 1 0');
        forceStyle(detailCol, 'width', 'auto');
        forceStyle(detailCol, 'max-width', '100%');
        forceStyle(detailCol, 'min-width', '0');
      }
    }
  }

  // Inner conversation list fills the list column. Never pinned directly here:
  // its header and list rows share a `msg-conversations-container*` prefix, so
  // a substring pin would conflict with itself.
  // Styling is scoped to the dedicated panel (outerWrapper): the floating
  // chat-bubble popup shares the same `msg-*` class names, and forcing
  // width:100% on it is what widened the bubble's popup.
  outerWrapper.querySelectorAll('.msg-conversations-container, .msg-s-page-layout__conversations-container').forEach(el => {
    if (el.closest('[class*="msg-overlay"]')) return;
    forceStyle(el, 'width', '100%');
    forceStyle(el, 'max-width', '100%');
    forceStyle(el, 'min-width', '0');
  });

  // Drill into any inner thread containers that carry their own width constraints
  THREAD_SELECTORS.forEach(sel => {
    outerWrapper.querySelectorAll(sel).forEach(el => {
      if (el.closest('[class*="msg-overlay"]')) return;
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
    html.classList.remove(LCS_MSG_CLASS);
    return;
  }

  if (isMessagingPage()) {
    html.classList.add(LCS_MSG_CLASS);
    expandScaffold();
    expandMessagingPanel(); // retries internally until DOM is ready
  } else {
    html.classList.remove(LCS_MSG_CLASS);
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

// Re-adapt the conversation-list width when the window is resized
window.addEventListener('resize', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => applyState(currentEnabled), 200);
});

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
