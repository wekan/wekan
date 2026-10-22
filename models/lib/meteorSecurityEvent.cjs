'use strict';

// What a forked Meteor package (packages/allow-deny, ddp-server,
// dynamic-import, google-oauth, facebook-oauth) may report to Admin Panel /
// Problems through globalThis.__wekanSecurityRecord (server/lib/
// meteorSecurityHook.js). Only these keys, only these actions, and never an
// account block: each of these fires before, or without, a trusted user.
const METEOR_SECURITY_KEYS = Object.freeze([
  'dos.ddp-protocol-handler',
  'authz.allow-deny-proto-field',
  'dos.dynamic-import-request',
  'authn.oauth-token-audience',
]);

const ACTIONS = new Set(['blocked', 'detected']);

function str(value, max) {
  return value === undefined || value === null ? undefined : String(value).slice(0, max);
}

// The event to record, or null when it is not one a package may send.
function meteorSecurityEvent(evt) {
  if (!evt || typeof evt !== 'object') return null;
  if (!METEOR_SECURITY_KEYS.includes(evt.key)) return null;
  const out = {
    key: evt.key,
    action: ACTIONS.has(evt.action) ? evt.action : 'detected',
    source: str(evt.source, 80) || 'meteor',
    detail: str(evt.detail, 200) || '',
    blocksAccount: false,
  };
  const userId = str(evt.userId, 64);
  if (userId) out.userId = userId;
  const ip = str(evt.ip, 64);
  if (ip) out.ip = ip;
  if (evt.req && typeof evt.req === 'object') out.req = evt.req;
  return out;
}

module.exports = { METEOR_SECURITY_KEYS, meteorSecurityEvent };
