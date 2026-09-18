/**
 * LinkedSpace – content.js
 * Expands LinkedIn's main pages to full width:
 *   • /messaging      (dedicated messaging page)
 *   • /feed or /      (Home feed — right rail kept, feed widens)
 *   • /mynetwork      (right rail collapsed)
 *   • /notifications  (right rail collapsed)
 *   • /jobs           (two-pane job search & details expansion)
 */

'use strict';

const LCS_STORAGE_KEY = 'lcsEnabled';
const LCS_CLASSES = {
  messaging: 'lcs-messaging',
  home: 'lcs-home',
  network: 'lcs-network',
  jobs: 'lcs-jobs',
  notifications: 'lcs-notifications',
};

const JOBS_LIST_WIDTH_PX = 350;
const MSG_SIDEBAR_MAX_PX = 400;

function getMessagingSidebarWidth() {
  return Math.min(MSG_SIDEBAR_MAX_PX, Math.round(window.innerWidth / 3));
}

function pageKind() {
  const p = window.location.pathname;
  if (p.startsWith('/messaging')) return 'messaging';
  if (p === '/' || p.startsWith('/feed')) return 'home';
  if (p.startsWith('/mynetwork')) return 'network';
  if (p.startsWith('/jobs')) return 'jobs';
  if (p.startsWith('/notifications')) return 'notifications';
  return 'other';
}

function pageDomMounted(kind) {
  if (kind === 'messaging') {
    return !!document.querySelector('#message-scroll-container, .msg-s-page-layout, .scaffold-layout__detail, .scaffold-layout__list-detail, .msg__list-detail');
  }
  return !!document.querySelector('.scaffold-layout, main#workspace, main');
}

function applyStyles(elements, styles) {
  if (!elements) return;
  const list = elements instanceof NodeList || Array.isArray(elements) ? elements : [elements];
  for (const el of list) {
    if (!el || !el.style) continue;
    for (const [k, v] of Object.entries(styles)) {
      el.style.setProperty(k, v, 'important');
    }
  }
}

/* ── Scaffold Expansion ──────────────────────────────────── */

function expandScaffold(collapseAside) {
  const fullWidth = {
    'max-width': '100%',
    width: '100%',
    'padding-left': '0',
    'padding-right': '0',
    'margin-left': '0',
    'margin-right': '0',
    'box-sizing': 'border-box',
  };

  applyStyles(document.querySelector('main'), fullWidth);
  applyStyles(
    document.querySelectorAll(
      '.scaffold-layout, .scaffold-layout-container, .scaffold-layout-container--reflow, ' +
      '.scaffold-layout__content, .scaffold-layout__content--is-centered, .scaffold-layout__content-container, ' +
      '.jobs-search-two-pane__container, .jobs-search-results-list__container, .jobs-search-box-container',
    ),
    fullWidth,
  );

  applyStyles(
    document.querySelectorAll('.scaffold-layout__main, .scaffold-layout__list-detail, .scaffold-layout__list-detail-inner'),
    { 'max-width': '100%', width: '100%', flex: '1 1 auto', 'min-width': '0', 'padding-left': '0', 'padding-right': '0' },
  );

  if (collapseAside) {
    applyStyles(document.querySelectorAll('.scaffold-layout__aside'), {
      width: '0',
      'min-width': '0',
      'max-width': '0',
      flex: '0 0 0px',
      overflow: 'hidden',
      padding: '0',
      margin: '0',
      border: 'none',
    });

    document.querySelectorAll('.scaffold-layout__row').forEach(row => {
      const display = getComputedStyle(row).display;
      if (display === 'grid' || display === 'inline-grid') {
        const hasSidebar = !!row.querySelector('.scaffold-layout__sidebar');
        // NOTE: current LinkedIn renders the rail as .scaffold-layout__aside
        // (e.g. messaging rows carry --list-detail-aside --has-aside), so
        // check for it too — otherwise the row collapses to a single track
        // with content + aside crammed into it.
        const hasAside = !!row.querySelector('.scaffold-layout__aside');
        if (hasSidebar) {
          applyStyles(row, { 'grid-template-columns': '225px minmax(0, 1fr) 0px', 'column-gap': '16px' });
        } else if (hasAside) {
          applyStyles(row, { 'grid-template-columns': 'minmax(0, 1fr) 0px', 'column-gap': '0' });
        } else {
          applyStyles(row, { 'grid-template-columns': 'minmax(0, 1fr)', 'column-gap': '0' });
        }
      }
    });
  }
}

/* ── Messaging Expansion ─────────────────────────────────── */

function expandMessagingPanel() {
  const outerWrapper = document.querySelector(
    '.msg__list-detail, .scaffold-layout__list-detail-inner, .scaffold-layout__list-detail, .msg-s-page-layout, .scaffold-layout__main',
  );
  if (!outerWrapper) return;

  applyStyles(outerWrapper, { 'max-width': '100%', width: '100%', 'min-width': '0' });

  const sidebar = getMessagingSidebarWidth();
  const listCol = document.querySelector('.scaffold-layout__list, .msg-s-page-layout__list, .msg-conversations-container, [class*="msg__list"]:not(main):not([class*="list-detail"])');
  const detailCol = document.querySelector('.scaffold-layout__detail, .msg-s-page-layout__conversation-container, [class*="msg__detail"]');
  const split = listCol?.parentElement || outerWrapper;

  if (split) {
    applyStyles(split, { width: '100%', 'max-width': '100%', 'min-width': '0', 'column-gap': '0', 'row-gap': '0' });
    const display = getComputedStyle(split).display;
    if (display === 'grid' || display === 'inline-grid') {
      applyStyles(split, { 'grid-template-columns': `minmax(0, ${sidebar}px) minmax(0, 1fr)` });
      if (listCol) applyStyles(listCol, { 'max-width': `${sidebar}px`, 'min-width': '0' });
      if (detailCol) applyStyles(detailCol, { 'min-width': '0' });
    } else if (display === 'flex' || display === 'inline-flex') {
      if (listCol) applyStyles(listCol, { flex: `0 0 ${sidebar}px`, width: `${sidebar}px`, 'max-width': `${sidebar}px`, 'min-width': '0' });
      if (detailCol) applyStyles(detailCol, { flex: '1 1 0', width: 'auto', 'max-width': '100%', 'min-width': '0' });
    }
  }

  outerWrapper.querySelectorAll(
    '.msg-convo-wrapper, .msg-thread, .msg-s-message-list-content, .msg-s-message-list',
  ).forEach(el => {
    if (!el.closest('[class*="msg-overlay"]')) {
      applyStyles(el, { 'max-width': '100%', width: '100%', 'min-width': '0' });
    }
  });

  outerWrapper.querySelectorAll('.msg-s-message-list-container, .msg-convo-wrapper, .msg-thread').forEach(el => {
    applyStyles(el, { 'min-height': '0', 'min-width': '0' });
  });
}

/* ── Jobs Expansion ──────────────────────────────────────── */

function expandJobsLayout() {
  applyStyles(
    document.querySelectorAll(
      'main, main > div, .scaffold-layout__content, .scaffold-layout__content--is-centered, ' +
      '.scaffold-layout__row, .jobs-search-box, .jobs-search-box-container, #jobs-search-box, ' +
      '.jobs-search-results, #jobs-search-results, .jobs-search-two-pane__container, .jobs-search-two-pane__wrapper, ' +
      '.jobs-search-results-list__container, .scaffold-layout__list-detail, .scaffold-layout__list-detail-inner',
    ),
    { 'max-width': '100%', width: '100%', 'min-width': '0' },
  );

  const listCol = document.querySelector('.scaffold-layout__list, .jobs-search-results-list, .jobs-search-two-pane__left-rail');
  const detailCol = document.querySelector('.scaffold-layout__detail, .jobs-search__job-details, .jobs-search-results__detail, .job-view-layout');
  const split = listCol?.parentElement || document.querySelector('.scaffold-layout__list-detail-inner, .jobs-search-two-pane__wrapper');

  if (split) {
    applyStyles(split, { width: '100%', 'max-width': '100%', 'min-width': '0', gap: '16px' });
    const display = getComputedStyle(split).display;
    if (display === 'grid' || display === 'inline-grid') {
      applyStyles(split, { 'grid-template-columns': `minmax(0, ${JOBS_LIST_WIDTH_PX}px) minmax(0, 1fr)` });
    } else if (display === 'flex' || display === 'inline-flex') {
      applyStyles(split, { 'flex-direction': 'row' });
    }
  }

  // Left list column
  applyStyles(
    document.querySelectorAll('.scaffold-layout__list, .jobs-search-two-pane__left-rail, .jobs-search-results-list:not([class*="__"])'),
    { width: `${JOBS_LIST_WIDTH_PX}px`, 'max-width': `${JOBS_LIST_WIDTH_PX}px`, 'min-width': '0', flex: `0 0 ${JOBS_LIST_WIDTH_PX}px` },
  );

  // List header
  applyStyles(
    document.querySelectorAll('.scaffold-layout__list-header, .jobs-search-results-list__header, [class*="collection-header"]'),
    { flex: '0 0 auto', height: 'auto', 'min-height': '0', 'max-height': 'none', width: '100%' },
  );

  // Cards list
  applyStyles(
    document.querySelectorAll('.scaffold-layout__list-container, .jobs-search-results-list__list'),
    { flex: '1 1 auto', height: 'auto', 'min-height': '0', width: '100%' },
  );

  // Detail column
  applyStyles(
    document.querySelectorAll('.scaffold-layout__detail, .jobs-search__job-details, .jobs-search-results__detail, .jobs-search-results__body, .job-view-layout'),
    { flex: '1 1 0', 'max-width': '100%', width: 'auto', 'min-width': '0' },
  );

  // Inner job detail contents
  applyStyles(
    document.querySelectorAll('.jobs-details__main-content, .job-view-layout, .jobs-description__content, .jobs-box__html-content, .job-details-jobs-unified-top-card'),
    { 'max-width': '100%', width: '100%', 'min-width': '0' },
  );
}

/* ── Other Layouts ───────────────────────────────────────── */

function expandHomeLayout() {
  applyStyles(
    document.querySelectorAll('main, main > div, .scaffold-layout__main, [class*="feed-layout"], .feed-shared-update-v2'),
    { 'max-width': '100%', width: '100%', 'min-width': '0' },
  );
}

function expandNetworkLayout() {
  applyStyles(
    document.querySelectorAll('main, main > div, .scaffold-layout__main, .mynetwork-content-list, [class*="mynetwork-content"]'),
    { 'max-width': '100%', width: '100%', 'min-width': '0' },
  );
}

function expandNotificationsLayout() {
  applyStyles(
    document.querySelectorAll('main, main > div, .scaffold-layout__main, .notifications-list, [class*="notifications-list"]'),
    { 'max-width': '100%', width: '100%', 'min-width': '0' },
  );
}

/* ── State Orchestrator ──────────────────────────────────── */

function applyState(enabled) {
  const html = document.documentElement;
  const kind = pageKind();

  for (const cls of Object.values(LCS_CLASSES)) html.classList.remove(cls);
  if (!enabled) return;

  // Apply the scoping class immediately, before the DOM-mount gate below,
  // so the CSS fallback takes effect the moment React mounts the nodes.
  if (LCS_CLASSES[kind]) {
    html.classList.add(LCS_CLASSES[kind]);
  }
  if (!pageDomMounted(kind)) return;

  switch (kind) {
    case 'messaging':
      expandScaffold(true);
      expandMessagingPanel();
      break;
    case 'home':
      expandScaffold(false);
      expandHomeLayout();
      break;
    case 'network':
      expandScaffold(true);
      expandNetworkLayout();
      break;
    case 'notifications':
      expandScaffold(true);
      expandNotificationsLayout();
      break;
    case 'jobs':
      expandScaffold(true);
      expandJobsLayout();
      break;
  }
}

/* ── Boot & Listeners ────────────────────────────────────── */

let currentEnabled = true;

chrome.storage.sync.get({ [LCS_STORAGE_KEY]: true }, ({ [LCS_STORAGE_KEY]: enabled }) => {
  currentEnabled = enabled;
  applyState(currentEnabled);
});

settleRefresh();
maybeAutoReload();

let debounceTimer = null;
let lastUrl = location.href;
const scheduleApply = () => {
  // Same-document SPA navigation changes the URL without re-running this
  // script — restart the settle loop and the auto-reload check so the new
  // page gets refreshed too.
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    settleRefresh();
    maybeAutoReload();
  }
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => applyState(currentEnabled), 60);
};

// Automatic refresh: if /messaging is still narrow shortly after arrival,
// do once what a manual refresh does — reload the page. Guarded so it can
// never loop (once per URL per tab session) and never interrupts typing.
function maybeAutoReload() {
  if (pageKind() !== 'messaging' || !currentEnabled) return;
  const key = 'lcsReloaded:' + location.href;
  if (sessionStorage.getItem(key)) return;
  setTimeout(() => {
    if (pageKind() !== 'messaging' || !currentEnabled) return;
    if (document.hidden) return;
    const ae = document.activeElement;
    if (ae && ae.closest('[contenteditable], input, textarea')) return;
    const main = document.querySelector('main');
    const w = main ? main.getBoundingClientRect().width : 0;
    if (!main || w < window.innerWidth - 200) {
      sessionStorage.setItem(key, '1');
      location.reload();
    }
  }, 1500);
}

// Simple refresh: re-apply until the page DOM is mounted (max ~5s),
// then stop. Covers cold loads, SPA transitions, and bfcache restores
// without perpetual timers — the MutationObserver handles everything
// after the layout has settled.
function settleRefresh() {
  clearInterval(settleRefresh.timer);
  let tries = 0;
  applyState(currentEnabled);
  settleRefresh.timer = setInterval(() => {
    if (pageDomMounted(pageKind()) || ++tries > 20) {
      clearInterval(settleRefresh.timer);
      settleRefresh.timer = null;
      return;
    }
    applyState(currentEnabled);
  }, 250);
}

const observer = new MutationObserver(scheduleApply);
observer.observe(document.body, { childList: true, subtree: true });

window.addEventListener('resize', scheduleApply);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'enable') {
    currentEnabled = true;
    applyState(true);
    sendResponse({ success: true, enabled: true });
  } else if (message.action === 'disable') {
    currentEnabled = false;
    applyState(false);
    sendResponse({ success: true, enabled: false });
  } else if (message.action === 'getState') {
    sendResponse({ enabled: currentEnabled, page: pageKind() });
  }
  return true;
});