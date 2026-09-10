// #6684: Meteor's native HttpOnly-cookie resume flow (accounts-base's own
// server_http_cookies.js, enabled by useHttpOnlyCookies) only attaches
// Expires/Max-Age to the `meteor_login_token` cookie when it can match the
// freshly issued resume token back to a stored token on the user document at
// the exact moment the cookie is written. When that lookup misses, the
// cookie is written with no expiry at all, so the browser treats it as a
// plain session cookie and drops it the moment the browser closes -- quietly
// downgrading WeKan's configured loginExpirationInDays into a
// same-session-only login. This pure helper decides whether a raw
// `Set-Cookie` header value needs a fallback expiry appended, so the
// decision itself is testable without a running server (server/accounts-common.js
// applies it by wrapping http.ServerResponse.prototype.setHeader, since
// accounts-base writes the header directly and never passes through
// app-level Connect middleware).

'use strict';

const COOKIE_NAME = 'meteor_login_token';
const COOKIE_PREFIX = `${COOKIE_NAME}=`;
const HAS_EXPIRY = /;\s*(Expires|Max-Age)=/i;

// Returns headerValue unchanged unless it is a Set-Cookie value for
// meteor_login_token that carries neither Expires nor Max-Age, in which case
// it appends a Max-Age computed from maxAgeSeconds.
function ensureLoginCookieExpiry(headerValue, maxAgeSeconds) {
  if (typeof headerValue !== 'string') return headerValue;
  if (!headerValue.startsWith(COOKIE_PREFIX)) return headerValue;
  if (HAS_EXPIRY.test(headerValue)) return headerValue;
  const maxAge = Math.round(Number(maxAgeSeconds));
  if (!Number.isFinite(maxAge) || maxAge <= 0) return headerValue;
  return `${headerValue}; Max-Age=${maxAge}`;
}

module.exports = {
  COOKIE_NAME,
  COOKIE_PREFIX,
  HAS_EXPIRY,
  ensureLoginCookieExpiry,
};
