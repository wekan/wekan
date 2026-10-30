'use strict';

// Response headers every WeKan response carries (server/securityHeaders.js).
//
// Strict-Transport-Security tells a browser to reach this site over HTTPS only,
// so a network attacker cannot strip TLS from the next visit (a link typed
// as plain HTTP, a downgrade on public Wi-Fi). It is sent only when ROOT_URL is
// https: over plain HTTP a browser ignores it, and on a site that is not on
// HTTPS it would make the site unreachable for as long as the max-age. The
// defaults are 180 days, this host only, no preload: includeSubDomains forces
// HTTPS on every other name under the domain and preload is a request to be
// built into browsers, so both are an administrator's decision
// (HSTS_INCLUDE_SUBDOMAINS, HSTS_PRELOAD; Admin Panel / People / Login).
//
// X-Content-Type-Options and Referrer-Policy are the baseline for every other
// response: the file routes already set the first, and the second keeps board
// and card URLs out of the Referer sent to other sites.
//
// Pure: no Meteor. `get` is env-shaped (authEnv, or process.env in a test).

const DEFAULT_MAX_AGE = 15552000; // 180 days
const MAX_MAX_AGE = 63072000;      // 2 years, what the preload list asks for

function isHttps(rootUrl) {
  return /^https:\/\/[^/\s]/i.test(String(rootUrl || '').trim());
}

function hstsConfig(get) {
  const raw = get('HSTS_MAX_AGE');
  let maxAge = DEFAULT_MAX_AGE;
  if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
    const n = Number(String(raw).trim());
    if (!Number.isInteger(n) || n < 0) return { maxAge: DEFAULT_MAX_AGE, invalid: String(raw) };
    maxAge = Math.min(n, MAX_MAX_AGE);
  }
  return {
    maxAge,
    includeSubDomains: String(get('HSTS_INCLUDE_SUBDOMAINS') || '').trim() === 'true',
    preload: String(get('HSTS_PRELOAD') || '').trim() === 'true',
  };
}

// The Strict-Transport-Security value, or null when none is to be sent.
function hstsHeader(get, rootUrl) {
  if (!isHttps(rootUrl)) return null;
  const { maxAge, includeSubDomains, preload } = hstsConfig(get);
  if (!maxAge) return null;
  let value = `max-age=${maxAge}`;
  if (includeSubDomains) value += '; includeSubDomains';
  // Browsers' preload lists accept a site only with both of these, and a
  // preload token without them is a mistake rather than a request.
  if (preload && includeSubDomains && maxAge >= 31536000) value += '; preload';
  return value;
}

// [name, value] pairs for one response.
function securityHeaders(get, rootUrl) {
  const headers = [
    ['X-Content-Type-Options', 'nosniff'],
    ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ];
  const hsts = hstsHeader(get, rootUrl);
  if (hsts) headers.push(['Strict-Transport-Security', hsts]);
  return headers;
}

module.exports = { hstsConfig, hstsHeader, securityHeaders, isHttps, DEFAULT_MAX_AGE, MAX_MAX_AGE };
