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

module.exports = { trustedOrigins, framingHeaders };
