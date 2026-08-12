/**
 * LinkedSpace – content.js
 *
 * Expands LinkedIn's dedicated /messaging page to full-width on both sides.
 * The floating chat overlay bubble is intentionally left untouched.
 *
 * One CSS class is applied to <html>:
 *   lcs-messaging → only on /messaging once the real messaging UI has mounted
 *                   (never during the SPA "Navigating to Messaging" splash —
 *                   styling the splash shell stalls LinkedIn's microapp boot)
 *
 * Layout expansion uses both:
 *   • CSS (styles.css)   — scaffold-level overrides
 *   • JS inline styles   — inner panel expansion, resilient to LinkedIn's
 *                          rotating class names and React inline style overrides
 */

'use strict';

const LCS_MSG_CLASS   = 'lcs-messaging';
const LCS_STORAGE_KEY = 'lcsEnabled';

/** Set true to enable one-shot console diagnostics (silenced in production). */
const LCS_DEBUG = false;

/** Conversation list width — "just a bit wider" than LinkedIn's original,
 *  adaptive to the viewport between 1/6 and 1/3, capped at 400px. */
const SIDEBAR_MAX_PX     = 400; // cap on wide screens
const SIDEBAR_ADAPTIVE   = 3;   // adaptive fraction: 1/3 of viewport
const SIDEBAR_FLOOR      = 6;   // hard floor:       1/6 of viewport

/** Re-apply cadence while enabled on /messaging. Runs continuously as a
 *  safety net: LinkedIn's React re-renders reset inline styles on reborn nodes,
 *  and the MutationObserver's debounce can miss the final silent resets, so we
 *  re-assert the layout on a light interval. */
const WATCHDOG_INTERVAL = 1000; // ms between re-applies

function sidebarWidth() {
  return Math.min(
    SIDEBAR_MAX_PX,
    Math.max(
      Math.round(window.innerWidth / SIDEBAR_ADAPTIVE),
      Math.round(window.innerWidth / SIDEBAR_FLOOR),
    ),
  );
}

/** Top-level outer wrapper selectors for the messaging panel. */
const OUTER_MSG_SELECTORS = [
  '.scaffold-layout__list-detail-inner',
  '.scaffold-layout__list-detail',
  '.msg__list-detail',
  '.scaffold-layout__main',
  '.msg-s-page-layout',
  '[class*="msg-s-page-layout"]',
].join(', ');

/** Conversation-list column selectors. */
const LIST_COL_SELECTORS = [
  '.scaffold-layout__list',
  '.msg-s-page-layout__list',
  '.msg-conversations-container',
].join(', ');

/** Thread/detail column selectors. */
const DETAIL_COL_SELECTORS = [
  '.scaffold-layout__detail',
  '.msg-s-page-layout__conversation-container',
].join(', ');

/** Inner thread/chat panel selectors — width only. Heights stay LinkedIn's. */
const THREAD_SELECTORS = [
  '.msg-convo-wrapper',
  '.msg-thread',
  '.msg-s-page-layout__conversation-container',
  '.msg-s-message-list-content',
  '.msg-s-message-list',
  '[class*="msg-thread"]',
  '[class*="msg-convo-wrapper"]',
  '[class*="msg-s-message-list"]',
].join(', ');

/* ─── helpers ─────────────────────────────────────────────── */

function isMessagingPage() {
  return window.location.pathname.startsWith('/messaging');
}

/** True once the real messaging UI has mounted — NOT the SPA "Navigating to
 *  Messaging" splash. All selectors here are absent on the splash and present
 *  after the microapp boots (verified against the live page). Styling must be
 *  gated on this: applying our layout to the splash shell breaks the boot. */
function isMessagingDomMounted() {
  return !!document.querySelector(
    '#message-scroll-container, .msg-s-bucket, .msg-s-page-layout, ' +
    '.scaffold-layout__list-detail-inner, .scaffold-layout__detail',
  );
}

/** Apply a batch of inline styles with !important priority. No-op if null. */
function applyStyles(el, styles) {
  if (!el) return;
  for (const [prop, value] of Object.entries(styles)) {
    el.style.setProperty(prop, value, 'important');
  }
}

/** First element matching the comma-separated `selectors`, or null. */
function firstMatching(selectors) {
  return document.querySelector(selectors);
}

/** Resolve the conversation-list | thread-detail split container. */
function findMessagingLayout() {
  const listCol = firstMatching(LIST_COL_SELECTORS);
  const detailCol = firstMatching(DETAIL_COL_SELECTORS);
  let split = null;
  if (listCol && detailCol && listCol.parentElement === detailCol.parentElement) {
    split = listCol.parentElement;
  } else if (listCol) {
    split = listCol.parentElement;
  }
  return { listCol, detailCol, split };
}

/* ─── scaffold expansion ──────────────────────────────────── */

function expandScaffold() {
  // Outer scaffold containers
  document.querySelectorAll(
    '.scaffold-layout, .scaffold-layout-container, ' +
    '.scaffold-layout-container--reflow, .scaffold-layout__content-container',
  ).forEach(el => applyStyles(el, {
    'max-width': '100%',
    width: '100%',
    'padding-left': '0',
    'padding-right': '0',
    'box-sizing': 'border-box',
  }));

  // Main content column — grows to fill space freed by collapsing the aside.
  const main = firstMatching(
    '.scaffold-layout__list-detail, .scaffold-layout__list-detail-inner, ' +
    '.scaffold-layout__main, .msg__list-detail',
  );
  applyStyles(main, {
    'max-width': '100%',
    width: '100%',
    flex: '1 1 auto',
    'min-width': '0',
    'padding-left': '0',
    'padding-right': '0',
  });

  // Right aside (ads/recommendations) — collapse to reclaim horizontal space
  const aside = document.querySelector('.scaffold-layout__aside');
  applyStyles(aside, {
    width: '0',
    'min-width': '0',
    'max-width': '0',
    flex: '0 0 0px',
    overflow: 'hidden',
    padding: '0',
    margin: '0',
    border: 'none',
  });

  // The messaging row is a CSS Grid that reserves a fixed track for the right
  // aside. Zeroing the aside's width can't collapse a fixed grid track, so
  // force the row to a single full-width column whenever the aside shares a
  // grid parent with the messaging main column. Never change the parent's
  // display — reflowing it breaks the composer's pinned height.
  if (main && aside && main.parentElement === aside.parentElement) {
    const display = getComputedStyle(main.parentElement).display;
    if (display === 'grid' || display === 'inline-grid') {
      applyStyles(main.parentElement, {
        'grid-template-columns': 'minmax(0, 1fr)',
        'column-gap': '0',
      });
    }
  }

  // Legacy layout: the messaging row carries a --list-detail-aside modifier
  document.querySelectorAll('.scaffold-layout__row[class*="--list-detail-aside"]').forEach(el =>
    applyStyles(el, { 'grid-template-columns': 'minmax(0, 1fr)', 'column-gap': '0' }));
}

/* ─── messaging panel expansion ──────────────────────────── */

/**
 * Expand the messaging panel using direct DOM traversal.
 * The conversation list (left sidebar) is pinned to a viewport-adaptive width
 * (see sidebarWidth) and the thread panel grows to fill the remaining space.
 *
 * Only width-related tracks are forced. LinkedIn's own row sizing keeps the
 * thread column viewport-constrained — that is what pins the composer — so we
 * deliberately never touch display, grid-template-rows, height or overflow.
 */
function expandMessagingPanel() {
  // Find the outer messaging wrapper
  let outerWrapper = firstMatching(OUTER_MSG_SELECTORS);

  // Fallback: first child of scaffold main
  if (!outerWrapper) {
    const main = firstMatching(
      '.scaffold-layout__main, .scaffold-layout__list-detail, .scaffold-layout__list-detail-inner',
    );
    outerWrapper = main?.firstElementChild ?? null;
  }

  if (!outerWrapper) return; // ticker re-runs us until the panel mounts

  applyStyles(outerWrapper, { 'max-width': '100%', width: '100%', 'min-width': '0' });

  const sidebar = sidebarWidth();
  const { listCol, detailCol, split } = findMessagingLayout();

  if (split) {
    applyStyles(split, {
      width: '100%',
      'max-width': '100%',
      'min-width': '0',
      'column-gap': '0',
      'row-gap': '0',
    });

    const display = getComputedStyle(split).display;

    if (display === 'grid' || display === 'inline-grid') {
      // Preserve LinkedIn's grid-template-rows (it pins the composer height)
      // and only redistribute the columns.
      applyStyles(split, { 'grid-template-columns': `minmax(0, ${sidebar}px) minmax(0, 1fr)` });
      if (listCol) applyStyles(listCol, { 'max-width': `${sidebar}px`, 'min-width': '0' });
      if (detailCol) applyStyles(detailCol, { 'min-width': '0' });
    } else if (display === 'flex' || display === 'inline-flex') {
      if (listCol) applyStyles(listCol, {
        flex: `0 0 ${sidebar}px`, width: `${sidebar}px`, 'max-width': `${sidebar}px`, 'min-width': '0',
      });
      if (detailCol) applyStyles(detailCol, {
        flex: '1 1 0', width: 'auto', 'max-width': '100%', 'min-width': '0',
      });
    }
  }

  // Inner conversation list fills the list column. Never pinned directly here:
  // its header and list rows share a `msg-conversations-container*` prefix, so
  // a substring pin would conflict with itself.
  outerWrapper.querySelectorAll('.msg-conversations-container, .msg-s-page-layout__conversations-container').forEach(el => {
    if (el.closest('[class*="msg-overlay"]')) return;
    applyStyles(el, { width: '100%', 'max-width': '100%', 'min-width': '0' });
  });

  // Drill into any inner thread containers that carry their own width constraints
  outerWrapper.querySelectorAll(THREAD_SELECTORS).forEach(el => {
    if (el.closest('[class*="msg-overlay"]')) return;
    applyStyles(el, { 'max-width': '100%', width: '100%', 'min-width': '0' });
  });

  // Outer thread wrappers also fill the detail column when its parent is a
  // flex container (LinkedIn variant-dependent).
  outerWrapper.querySelectorAll('.msg-convo-wrapper, .msg-thread').forEach(el =>
    applyStyles(el, { flex: '1 1 auto' }));

  ensureComposerVisible(outerWrapper);
}

/* ─── composer visibility ────────────────────────────────── */

/**
 * The composer stays visible only while the thread column keeps a
 * viewport-constrained height and the message list scrolls internally.
 * We never force heights/overflow (LinkedIn owns those); we only lift
 * min-size blockers that could let the column grow beyond the viewport.
 */
function ensureComposerVisible(scope) {
  if (!scope) return;
  scope.querySelectorAll(
    '.msg-s-message-list-container, [class*="msg-s-message-list-container"], ' +
    '.msg-convo-wrapper, .msg-thread',
  ).forEach(el => applyStyles(el, { 'min-height': '0', 'min-width': '0' }));
}

/* ─── state management ────────────────────────────────────── */

function applyState(enabled) {
  const html = document.documentElement;

  if (!enabled) {
    html.classList.remove(LCS_MSG_CLASS);
    return;
  }

  // Gate on the real messaging DOM being mounted: during the SPA "Navigating to
  // Messaging" splash the class must stay OFF so LinkedIn's microapp can boot
  // (styling the splash shell stalled it). The ticker retries until it mounts.
  if (isMessagingPage() && isMessagingDomMounted()) {
    html.classList.add(LCS_MSG_CLASS);
    expandScaffold();
    expandMessagingPanel();
  } else {
    html.classList.remove(LCS_MSG_CLASS);
  }
}

/* ─── SPA boot recovery ───────────────────────────────────── */

/** Reload once when the /messaging microapp boot visibly freezes. The stall is
 *  LinkedIn's own flaky cold-boot: the silent "Navigating to Messaging" splash
 *  never resolves (confirmed reproducible with the extension off). An actively
 *  booting microapp keeps mutating the DOM, so we trigger on DOM inactivity
 *  rather than a wall-clock guess — faster for real stalls, and it never
 *  interrupts a legitimate slow boot. */
const RECOVERY_IDLE_MS   = 1200;   // page unchanged this long ⇒ frozen
const RECOVERY_MIN_MS    = 800;    // min time on the route before judging
const RECOVERY_CEILING_MS = 20000; // absolute backstop regardless of activity
const RECOVERY_FLAG      = 'lcsRecoveryOnce';

let lastDomActivity = Date.now();
let recoverySince = null;

function markDomActivity() {
  lastDomActivity = Date.now();
}

function maybeRecoverStuckBoot() {
  const now = Date.now();

  if (!currentEnabled || !isMessagingPage() || isMessagingDomMounted()) {
    recoverySince = null;
    sessionStorage.removeItem(RECOVERY_FLAG);
    return;
  }

  // Already auto-recovered on this page load — never reload twice.
  if (sessionStorage.getItem(RECOVERY_FLAG)) return;

  if (recoverySince === null) recoverySince = now;
  if (now - recoverySince < RECOVERY_MIN_MS) return;

  const frozen  = now - lastDomActivity >= RECOVERY_IDLE_MS;
  const ceiling = now - recoverySince >= RECOVERY_CEILING_MS;
  if (!frozen && !ceiling) return;

  // The splash has frozen with no messaging DOM → boot stalled. Reload once;
  // the flag is cleared by the ticker once the messaging DOM mounts (so a
  // healthy load never loops).
  sessionStorage.setItem(RECOVERY_FLAG, '1');
  if (LCS_DEBUG) {
    console.log('[LinkedSpace] boot stalled — auto-reloading once', {
      pathname: window.location.pathname,
      idleMs: now - lastDomActivity,
      sinceMs: now - recoverySince,
    });
  }
  location.reload();
}

/* ─── one-shot diagnostic (debugging aid) ─────────────────── */

let lcsDebugLoggedNav = null;

/** Log once per navigation into /messaging so a failure can be diagnosed from
 *  the console instead of by guessing. */
function logMessagingDiagnostic() {
  if (!LCS_DEBUG) return;
  if (lcsDebugLoggedNav === window.location.pathname) return;
  if (!isMessagingPage()) return;
  lcsDebugLoggedNav = window.location.pathname;

  const outer = firstMatching(OUTER_MSG_SELECTORS);
  const { listCol, detailCol, split } = findMessagingLayout();

  console.log('[LinkedSpace] messaging diagnostic', {
    pathname: window.location.pathname,
    classApplied: document.documentElement.classList.contains(LCS_MSG_CLASS),
    domMounted: isMessagingDomMounted(),
    outerWrapper: outer ? outer.className : null,
    split: split ? `${split.className} [${getComputedStyle(split).display}]` : null,
    listWidth: listCol ? Math.round(listCol.getBoundingClientRect().width) : null,
    detailWidth: detailCol ? Math.round(detailCol.getBoundingClientRect().width) : null,
    targetSidebar: sidebarWidth(),
  });
}

/* ─── init ────────────────────────────────────────────────── */

let currentEnabled = true;

chrome.storage.sync.get({ [LCS_STORAGE_KEY]: true }, ({ [LCS_STORAGE_KEY]: enabled }) => {
  currentEnabled = enabled;
  applyState(currentEnabled);
});

// Unconditional safety net. Guarantees the layout is applied within
// WATCHDOG_INTERVAL of the messaging DOM mounting, independent of how
// LinkedIn's SPA orders URL updates vs. DOM changes. `currentEnabled` is only
// read inside the callback (≥1s after load), so the `let` above is safe.
setInterval(() => {
  applyState(currentEnabled);
  maybeRecoverStuckBoot();
  logMessagingDiagnostic();
}, WATCHDOG_INTERVAL);

/* ─── MutationObserver: survive SPA navigation & re-renders ── */

let debounceTimer = null;

const scheduleApply = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => applyState(currentEnabled), 200);
};

const observer = new MutationObserver(() => {
  markDomActivity();
  scheduleApply();
});
observer.observe(document.body, { childList: true, subtree: true });

window.addEventListener('resize', scheduleApply);
window.addEventListener('popstate', scheduleApply);

// NOTE: deliberately NO history.pushState/replaceState monkey-patch here. It
// can leak into LinkedIn's own SPA router and stall the messaging microapp boot
// (the "Navigating to Messaging" splash that previously needed a manual
// refresh), and it is redundant: the unconditional ticker and the
// MutationObserver already re-apply the layout on any route change, because the
// splash itself produces DOM mutations that trigger the observer.

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