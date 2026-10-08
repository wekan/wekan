'use strict';

// "Sign in with Google" sent the user straight back to the sign-in page, every
// time, with no error. Meteor's OAuth (Google, GitHub, ... and OIDC alike)
// builds the provider's redirect_uri from ROOT_URL, so the provider sends the
// browser back to ROOT_URL's origin, and the callback page hands the login
// secret to the sign-in page through THAT origin's browser storage. When the
// sign-in page was opened at another origin - http where ROOT_URL says https,
// www.example.com where it says example.com, an IP address, another port, or
// the snap's 127.0.0.1 default (#6752) - the page never sees the secret, the
// login never completes, and the user is on the sign-in page again.
//
// That is a configuration mismatch, which code cannot repair: the provider only
// accepts the redirect URI it was registered with. What code can do is say so,
// on the sign-in page, with both addresses, instead of looping silently.
//
// Pure: compares the configured ROOT_URL with the page's address. Returns null
// when they share an origin (scheme, host and port), or when either cannot be
// read; otherwise the two origins to show.

function originOf(href) {
  try {
    const url = new URL(href);
    if (!/^https?:$/.test(url.protocol)) return null;
    return url.origin;
  } catch (e) {
    return null;
  }
}

function loginOriginMismatch(rootUrl, pageHref) {
  const expected = originOf(rootUrl);
  const actual = originOf(pageHref);
  if (!expected || !actual || expected === actual) return null;
  return { expected, actual };
}

// Only worth showing when the page offers a sign-in that goes through a
// provider and comes back: the OAuth2/OIDC button, SAML, CAS, or one of Meteor's
// accounts-* providers. Password, LDAP and e-mailed codes stay on this page and
// are unaffected. `enabled` is getAuthenticationsEnabled()'s result.
const SAME_PAGE_METHODS = new Set(['password', 'ldap', 'passwordless']);

function offersProviderLogin(enabled) {
  if (!enabled || typeof enabled !== 'object') return false;
  return Object.keys(enabled).some(key => enabled[key] === true && !SAME_PAGE_METHODS.has(key));
}

module.exports = { loginOriginMismatch, offersProviderLogin };
