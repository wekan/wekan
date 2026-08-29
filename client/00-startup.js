// Fix dynamic-import chunk loading when Wekan runs under a sub-path (ROOT_URL includes a pathname,
// e.g. https://example.com/wekan). Rspack's runtime builds every chunk URL as
// __webpack_public_path__ + chunkName, and the chunk name ALREADY includes the "build-chunks/"
// prefix (its runtime does `u = e => "build-chunks/" + e + "." + hash + ".js"`). The default
// public path is "/", so at the site root chunks correctly resolve to "/build-chunks/<chunk>".
// Under a sub-path we must prefix that sub-path — but must NOT re-add "build-chunks/" ourselves,
// or the URL becomes "/wekan/build-chunks/build-chunks/<chunk>" and 404s (issue #6445, which broke
// the lazy-loaded language chunks). So set the public path to "<sub-path>/" and let rspack append
// "build-chunks/" itself. Done here at module evaluation time, before any import() expression runs
// (those are deferred to Meteor.startup callbacks).
/* global __webpack_public_path__:writable */
try {
  const _cfg = typeof window !== 'undefined' && window.__meteor_runtime_config__;
  const _rootUrl = _cfg && _cfg.ROOT_URL;
  if (_rootUrl) {
    const _rootPath = new URL(_rootUrl).pathname.replace(/\/+$/, '');
    if (_rootPath && _rootPath !== '/') {
      __webpack_public_path__ = _rootPath + '/';
    }
  }
} catch (_) {}

// Expose Meteor on window. Under the Meteor 3.5 + rspack build, bare `Meteor`
// references in app code are rewritten by rspack's ProvidePlugin into per-module
// imports, so `Meteor` is NOT placed on the browser `window` the way the classic
// Meteor linker did. Re-expose it so the browser console and the Playwright e2e
// tests (which call Meteor.loginWithToken / Meteor.userId / Meteor.subscribe etc.
// via page.evaluate in window scope) can reach it. This matches the long-standing
// classic-Meteor behaviour where `Meteor` is a global.
if (typeof window !== 'undefined') {
  window.Meteor = Meteor;
}

// Fix bug in jam:offline 0.4.1: s?.message.includes() crashes when s.message is
// undefined (e.g. during WebSocket reconnect errors that don't carry a .message).
// Wrap _debug so the optional chain is complete: s?.message?.includes().
(function patchJamOfflineDebug() {
  const patched = Meteor._debug;
  Meteor._debug = function (m, s) {
    try {
      return patched.call(this, m, s);
    } catch (e) {
      // jam:offline's override threw — fall back to the bare console log.
      if (typeof console !== 'undefined') {
        console.log(m, s);
      }
    }
  };
})();

// PWA — use Meteor.absoluteUrl so the path is correct under sub-URL deployments
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    const swPath = new URL('pwa-service-worker.js', Meteor.absoluteUrl()).pathname;
    navigator.serviceWorker.register(swPath);
  });
}

// Import Blaze helpers (replaces removed raix:handlebar-helpers package)
import '/client/config/blazeHelpers';

// Import board converter for on-demand conversion
import '/client/lib/boardConverter';
import '/client/features/boardConversion';
import { Utils } from '/client/lib/utils';

// Import migration manager and progress UI - COMMENTED OUT
// import '/client/lib/attachmentMigrationManager';
// import '/client/components/settings/migrationProgress';

// Custom head tags

// Meteor 3's native session flow keeps the persistent resume token in an
// HttpOnly cookie and only the active tab's credential in memory. Configure it
// before Accounts startup; the server has the same options in accounts-common.
Accounts.config({ clientStorage: 'none', useHttpOnlyCookies: true });

// Subscribe to per-user small publications
Meteor.startup(() => {
  Tracker.autorun(() => {
    if (Meteor.userId()) {
      Meteor.subscribe('userDesktopDragHandles');
    }
  });

  // Initialize mobile mode on startup for iOS devices
  // This ensures mobile mode is applied correctly on page load
  Tracker.afterFlush(() => {
    if (typeof Utils !== 'undefined' && Utils.initializeUserSettings) {
      Utils.initializeUserSettings();
    }
  });
});
