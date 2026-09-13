// Meteor's native cookie client currently uses origin-root paths. Keep its
// protocol and server validation, but include ROOT_URL's path for deployments
// behind a proxy. https://github.com/meteor/meteor/blob/devel/packages/accounts-base/accounts_client.js
function installAccountsCookiePaths(accounts, rootUrl, request) {
  const prefix = new URL(rootUrl).pathname.replace(/\/+$/, '');
  if (!prefix) return;
  const endpoint = `${prefix}/_accounts/cookie`;
  accounts.loginWithCookie = async function () {
    try {
      const response = await request(`${endpoint}/refresh`, {
        method: 'GET', credentials: 'include', headers: { Accept: 'application/json' },
      });
      if (!response.ok) return;
      const body = await response.json();
      if (body?.token) {
        this.loginWithToken(body.token, async error => {
          if (error) await this.makeClientLoggedOut();
        });
      }
    } catch (_) { /* Native resume silently ignores unavailable cookies. */ }
  };
  accounts._setHttpOnlyCookie = async function (token, tokenExpires) {
    try {
      await request(`${endpoint}/set`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, tokenExpires }),
      });
    } catch (_) { /* Match the native best-effort cookie synchronization. */ }
  };
  accounts._clearHttpOnlyCookie = async function () {
    try {
      await request(`${endpoint}/clear`, { method: 'POST', credentials: 'include' });
    } catch (_) { /* Match the native best-effort cookie synchronization. */ }
  };
}
module.exports = { installAccountsCookiePaths };
