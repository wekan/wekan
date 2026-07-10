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

// Import cron settings - COMMENTED OUT
// import '/client/components/settings/cronSettings';
// Custom head tags

// Mirror Meteor login token into a cookie for server-side file route auth
// This enables cookie-based auth for /cdn/storage/* without leaking ROOT_URL
// Token already lives in localStorage; cookie adds same-origin send-on-request semantics
Meteor.startup(() => {
  const COOKIE_NAME = 'meteor_login_token';
  const USER_ID_COOKIE = 'meteor_user_id';
  const TOKEN_EXPIRES_COOKIE = 'meteor_login_token_expires';

  const getCookie = (name) => {
    try {
      const parts = document.cookie ? document.cookie.split(';') : [];
      for (const part of parts) {
        const [k, ...rest] = part.trim().split('=');
        if (decodeURIComponent(k) === name) {
          return decodeURIComponent(rest.join('='));
        }
      }
    } catch (_) {}
    return '';
  };

  const cookieAttrs = () => {
    const attrs = ['Path=/', 'SameSite=Lax'];
    try {
      if (window.location && window.location.protocol === 'https:') {
        attrs.push('Secure');
      }
    } catch (_) {}
    return attrs.join('; ');
  };

  const setCookie = (name, value) => {
    if (!value) return;
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${cookieAttrs()}`;
  };
  const clearCookie = (name) => {
    document.cookie = `${encodeURIComponent(name)}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${cookieAttrs()}`;
  };

  const syncCookie = () => {
    try {
      const token = Accounts && typeof Accounts._storedLoginToken === 'function' ? Accounts._storedLoginToken() : null;
      if (token) setCookie(COOKIE_NAME, token); else clearCookie(COOKIE_NAME);
    } catch (e) {
      // ignore
    }
  };

  const bootstrapTokenFromCookie = () => {
    try {
      const currentToken = Accounts && typeof Accounts._storedLoginToken === 'function'
        ? Accounts._storedLoginToken()
        : null;
      if (currentToken) {
        return;
      }

      const token = getCookie(COOKIE_NAME);
      const userId = getCookie(USER_ID_COOKIE);
      const tokenExpiresRaw = getCookie(TOKEN_EXPIRES_COOKIE);
      const tokenExpires = tokenExpiresRaw ? new Date(tokenExpiresRaw) : null;

      if (!token || !userId || !tokenExpires || Number.isNaN(tokenExpires.getTime())) {
        return;
      }

      if (Accounts && typeof Accounts._storeLoginToken === 'function') {
        Accounts._storeLoginToken(userId, token, tokenExpires);
        if (Meteor.status && !Meteor.status().connected && typeof Meteor.reconnect === 'function') {
          Meteor.reconnect();
        }
      }
    } catch (_) {
      // ignore
    }
  };

  bootstrapTokenFromCookie();

  // Initial sync on startup
  syncCookie();

  // Keep cookie in sync on login/logout
  if (Accounts && typeof Accounts.onLogin === 'function') Accounts.onLogin(syncCookie);
  if (Accounts && typeof Accounts.onLogout === 'function') Accounts.onLogout(syncCookie);

  // Sync across tabs/windows when localStorage changes
  window.addEventListener('storage', (ev) => {
    if (ev && typeof ev.key === 'string' && ev.key.indexOf('Meteor.loginToken') !== -1) {
      syncCookie();
    }
  });

});

// Subscribe to per-user small publications
Meteor.startup(() => {
  Tracker.autorun(() => {
    if (Meteor.userId()) {
      Meteor.subscribe('userGreyIcons');
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
