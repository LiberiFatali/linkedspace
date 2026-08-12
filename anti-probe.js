/**
 * LinkedSpace – anti-probe.js
 *
 * Silences LinkedIn's extension-fingerprinting flood. LinkedIn's bundle
 * (~chunk.585) repeatedly fetches `chrome-extension://invalid/` to enumerate
 * installed extensions, and Chrome logs every attempt as net::ERR_FAILED —
 * flooding the DevTools console on every pageview.
 *
 * Runs in the MAIN world at document_start so it wraps the page's own
 * `window.fetch`/XMLHttpRequest/Image (an isolated-world content script cannot
 * intercept those). Probe URLs are rejected/rerouted without touching the
 * network, so Chrome never logs the failure.
 */

'use strict';

(function () {
  const isProbe = (url) =>
    typeof url === 'string' && url.toLowerCase().startsWith('chrome-extension://');

  const nativeFetch = window.fetch;
  if (nativeFetch) {
    window.fetch = function (input, init) {
      const url = typeof input === 'string' ? input : input && input.url;
      if (isProbe(url)) return Promise.reject(new TypeError('Failed to fetch'));
      return nativeFetch.call(this, input, init);
    };
  }

  const XHR = window.XMLHttpRequest;
  if (XHR && XHR.prototype) {
    const nativeOpen = XHR.prototype.open;
    XHR.prototype.open = function (method, url) {
      if (isProbe(url)) url = 'about:blank';
      return nativeOpen.call(
        this,
        method,
        url,
        arguments.length > 2 ? arguments[2] : true,
        arguments[3],
        arguments[4]
      );
    };
  }

  const Img = window.Image;
  if (Img) {
    const desc = Object.getOwnPropertyDescriptor(Img.prototype, 'src');
    if (desc && desc.set) {
      Object.defineProperty(Img.prototype, 'src', {
        set(v) {
          desc.set.call(this, isProbe(v) ? 'about:blank' : v);
        },
        get() {
          return desc.get.call(this);
        },
        configurable: true,
      });
    }
  }
})();
