'use strict';

// Two things an OpenID Connect provider may need that a plain OAuth2 one does
// not, decided once from the settings (server/authentication.js reconfigureOidc)
// and carried to the OIDC package in its service configuration:
//
//   responseMode  the authorization request's response_mode. Sign in with
//                 Apple requires `form_post` whenever the name or email scope is
//                 asked for, and answers a request without it with an error
//                 page; Meteor's OAuth handler reads a POSTed answer as it reads
//                 a query. Empty = the provider's default (query).
//   claimsSource  where the user's claims are read: the userinfo endpoint (the
//                 OIDC default), the access token (on-premise ADFS and Azure AD
//                 B2C put custom claims there - the old OAUTH2_ADFS_ENABLED /
//                 OAUTH2_B2C_ENABLED hack), or the ID token. Apple has no userinfo
//                 endpoint at all and its access_token is opaque: the claims are
//                 in the id_token. The ID token comes straight from the token
//                 endpoint over TLS, which OpenID Connect Core 3.1.3.7 accepts in
//                 place of checking its signature.
//
// Pure: no Meteor. tests/oidcProviderMode.test.cjs.

const RESPONSE_MODES = ['query', 'fragment', 'form_post'];

function hostOf(url) {
  try {
    return new URL(String(url || '')).hostname.toLowerCase();
  } catch (e) {
    return '';
  }
}

function isApple(serverUrl) {
  return hostOf(serverUrl) === 'appleid.apple.com';
}

function responseMode({ serverUrl, env = {} } = {}) {
  const set = String(env.OAUTH2_RESPONSE_MODE || '').trim().toLowerCase();
  if (RESPONSE_MODES.includes(set)) return set;
  return isApple(serverUrl) ? 'form_post' : '';
}

function claimsSource({ serverUrl, userinfoEndpoint, env = {} } = {}) {
  // Apple first: its docs page used to say OAUTH2_ADFS_ENABLED=true, which
  // would read the opaque access token, so a setup that followed it still works.
  if (isApple(serverUrl) && !String(userinfoEndpoint || '').trim()) return 'id_token';
  if (env.OAUTH2_CLAIMS_IN_ID_TOKEN === 'true') return 'id_token';
  if (env.OAUTH2_ADFS_ENABLED === 'true' || env.OAUTH2_B2C_ENABLED === 'true') return 'access_token';
  return 'userinfo';
}

// The token whose claims are read, from the token endpoint's answer: the ID
// token when that is where the claims are (an opaque access token cannot be
// parsed), else the access token; and the bearer token for the userinfo call.
function claimsToken(token, source) {
  if (!token) return null;
  if (source === 'id_token') return token.id_token || null;
  return token.access_token || token.id_token || null;
}

module.exports = { RESPONSE_MODES, isApple, responseMode, claimsSource, claimsToken };
