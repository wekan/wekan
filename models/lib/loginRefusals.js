'use strict';

// Why a sign-in was refused, for the administrator (#6942). The person signing
// in keeps seeing the same generic message whatever the reason - telling a
// signed-out visitor "no such user" from "wrong password" would let anybody
// list the accounts - but every refusal is recorded in Admin Panel / Problems
// with its precise reason (server/lib/loginRefusals.js), and Problems /
// Summary groups them: one row per reason, how many times, the latest account
// and address, and how to fix it.
//
// Pure: tests/loginRefusals.test.cjs.

// The reasons, each with the words the Summary shows, the fix, and the pane
// where it is fixed (models/lib/adminUrls.js).
const REASONS = Object.freeze({
  'bad-password': { pane: ['people', 'people'] },
  'unknown-user': { pane: ['people', 'people'] },
  'account-disabled': { pane: ['people', 'people'] },
  braked: { pane: ['people', 'locked-users'] },
  'malformed-credentials': { pane: ['people', 'login'] },
  'ldap-bad-credentials': { pane: ['people', 'ldap'] },
  'ldap-not-in-allowed-group': { pane: ['people', 'ldap'] },
  'ldap-account-not-linked': { pane: ['people', 'ldap'] },
  'ldap-bound-to-another-entry': { pane: ['people', 'people'] },
});

const SOURCE_PREFIX = 'login:';

function sourceFor(reason) {
  return `${SOURCE_PREFIX}${Object.prototype.hasOwnProperty.call(REASONS, reason) ? reason : 'unknown'}`;
}

function reasonOfSource(source) {
  const s = String(source || '');
  return s.startsWith(SOURCE_PREFIX) ? s.slice(SOURCE_PREFIX.length) : null;
}

// A failed password sign-in (Accounts.onLoginFailure), as one of the reasons.
// An LDAP refusal is recorded by the LDAP handler itself, with its own reason.
function reasonOfPasswordFailure(error, user) {
  if (!error) return null;
  if (error.error === 'LDAP-login-error') return null;
  if (error.error === 'too-many-requests') return 'braked';
  if (user && user.loginDisabled) return 'account-disabled';
  const reason = String(error.reason || error.message || '');
  if (/user not found/i.test(reason)) return 'unknown-user';
  if (/incorrect password/i.test(reason)) return 'bad-password';
  if (/match failed|must be a string|invalid/i.test(reason)) return 'malformed-credentials';
  return null;
}

// The Summary's rows: one per reason that happened, the most frequent first.
// rows are folded eventlog rows (models/lib/eventLogSummary.js).
function summarize(rows) {
  const byReason = new Map();
  for (const row of rows || []) {
    const reason = reasonOfSource(row.source);
    if (!reason || !REASONS[reason]) continue;
    const prev = byReason.get(reason) || { reason, count: 0, firstAt: null, at: null, username: '', ip: '' };
    prev.count += Number(row.count) || 1;
    const first = row.firstAt || row.at;
    if (first && (!prev.firstAt || new Date(first) < new Date(prev.firstAt))) prev.firstAt = first;
    if (row.at && (!prev.at || new Date(row.at) > new Date(prev.at))) {
      prev.at = row.at;
      prev.username = row.username || '';
      prev.ip = row.ip || '';
    }
    byReason.set(reason, prev);
  }
  return [...byReason.values()]
    .sort((a, b) => b.count - a.count)
    .map(r => ({ ...r, labelKey: `login-refused-${r.reason}`, fixKey: `login-refused-${r.reason}-fix`, pane: REASONS[r.reason].pane }));
}

module.exports = { REASONS, SOURCE_PREFIX, sourceFor, reasonOfSource, reasonOfPasswordFailure, summarize };
