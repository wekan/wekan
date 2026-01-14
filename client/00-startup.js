// PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/pwa-service-worker.js');
  });
}

// Import board converter for on-demand conversion
import '/client/lib/boardConverter';
import '/client/components/boardConversionProgress';

// Import migration manager and progress UI
import '/client/lib/attachmentMigrationManager';
import '/client/components/settings/migrationProgress';

// Import cron settings
import '/client/components/settings/cronSettings';

// Mirror Meteor login token into a cookie for server-side file route auth
// This enables cookie-based auth for /cdn/storage/* without leaking ROOT_URL
// Token already lives in localStorage; cookie adds same-origin send-on-request semantics
Meteor.startup(() => {
  const COOKIE_NAME = 'meteor_login_token';
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
