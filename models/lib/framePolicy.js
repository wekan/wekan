'use strict';
// FrameBleed, regressed (2022-04-08 to 2026-10-02). With BROWSER_POLICY_ENABLED
// (the Docker and Snap default) WeKan is meant to refuse being framed by any
// page except its own and TRUSTED_URL, so another site cannot load it in an
// invisible frame and trick a signed-in user into clicking through it. The
// browser-policy package that did that was removed and every line of
// server/policy.js commented out, so the app's pages carried no framing header
// at all. This decides the headers again. Pure: tests/frameBleed.test.cjs.

// The origins TRUSTED_URL names (space or comma separated); anything that is
// not an http(s) origin is ignored rather than widening the policy.
function trustedOrigins(value) {
  return String(value || '').split(/[\s,]+/).filter(Boolean).map(entry => {
    try {
      const url = new URL(entry);
      return ['http:', 'https:'].includes(url.protocol) ? url.origin : null;
    } catch (e) { return null; }
  }).filter(Boolean);
}

// Headers for an app response, or {} when framing is not restricted.
function framingHeaders({ enabled, trustedUrl, sandstorm } = {}) {
  // Sandstorm always shows WeKan inside its own frame, from another origin.
  if (!enabled || sandstorm) return {};
  const trusted = [...new Set(trustedOrigins(trustedUrl))];
  const headers = { 'Content-Security-Policy': `frame-ancestors 'self'${trusted.map(origin => ` ${origin}`).join('')}` };
  // X-Frame-Options cannot name another origin; without one it backs up the
  // CSP directive for older browsers.
  if (!trusted.length) headers['X-Frame-Options'] = 'SAMEORIGIN';
  return headers;
}

// The framing headers to take back off a 304 Not Modified before it is sent.
//
// A 304 is not a response of its own: the browser keeps the 200 it stored and
// UPDATES that stored response's headers with the ones the 304 carries (RFC
// 9111 section 4.3.4), Chromium and Firefox included, Content-Security-Policy
// among them. Every stored file - an attachment, an avatar, a thumbnail - is
// served `private, no-cache` (CacheBleed), so every later view revalidates and
// gets a 304. The app-wide `frame-ancestors 'self'` set on every response by
// server/policy.js then REPLACED the file's own policy - an SVG's
// `default-src 'none'; ... sandbox`, a download's `sandbox` - and from the
// second view on the file was shown with no script restriction at all.
// Leaving them off the 304 keeps whatever policy the stored 200 had, which is
// the policy the route chose for that file. A header a route set on the 304
// itself (its value is not the app-wide one) is kept.
// `getHeader(name)` reads the response's current header.
function framingHeadersToDropOnNotModified(framing, getHeader) {
  return Object.entries(framing || {})
    .filter(([name, value]) => getHeader(name) === value)
    .map(([name]) => name);
}

module.exports = { trustedOrigins, framingHeaders, framingHeadersToDropOnNotModified };
