'use strict';

// Pure helper for building the OIDC RP-Initiated Logout URL (issue #2905,
// already implemented for #6158 - see server/models/settings.js'
// getOauthLogoutUrl()). Extracted so the URL-building logic is unit-testable
// in plain Node without Meteor (mirrors server/lib/ldapPasswordLoginGuard.js).
//
// OpenID Connect RP-Initiated Logout 1.0
// (https://openid.net/specs/openid-connect-rpinitiated-1_0.html) defines an
// end_session_endpoint that a relying party redirects the browser to on
// logout, optionally passing post_logout_redirect_uri (and client_id) so the
// provider sends the browser back afterwards. Without this, WeKan's own
// Meteor.logout() only ends the local WeKan session - with an IdP that keeps
// its own SSO session (Keycloak, for example) the user is immediately signed
// back in on the next visit, or an autologin flow bounces them straight back
// to the provider. When OAUTH2_LOGOUT_ENDPOINT is unset (the default), this
// is never called and logout behaves exactly as before.
//
// buildOauthLogoutUrl({ endpoint, serverUrl, clientId, redirectUri }):
//   - endpoint: OAUTH2_LOGOUT_ENDPOINT - either an absolute URL, or a path
//     (e.g. Keycloak's "/realms/<realm>/protocol/openid-connect/logout")
//     that is resolved against serverUrl (OAUTH2_SERVER_URL);
//   - serverUrl: OAUTH2_SERVER_URL, used only when endpoint is a path;
//   - clientId: OAUTH2_CLIENT_ID, appended as client_id when present (some
//     providers, Keycloak included, use it to validate the redirect URI);
//   - redirectUri: where the provider should send the browser back to -
//     WeKan's own root URL.
// Returns '' when endpoint is not set (the "do nothing, unchanged behavior"
// case), otherwise the full end_session URL.
function buildOauthLogoutUrl({ endpoint, serverUrl, clientId, redirectUri } = {}) {
  if (!endpoint) {
    return '';
  }

  const isAbsolute = /^https?:\/\//.test(endpoint);
  const base = isAbsolute
    ? endpoint
    : String(serverUrl || '').replace(/\/$/, '') + endpoint;

  const params = [];
  if (redirectUri) {
    params.push('post_logout_redirect_uri=' + encodeURIComponent(redirectUri));
  }
  if (clientId) {
    params.push('client_id=' + encodeURIComponent(clientId));
  }

  if (params.length === 0) {
    return base;
  }
  return base + (base.includes('?') ? '&' : '?') + params.join('&');
}

module.exports = {
  buildOauthLogoutUrl,
};
