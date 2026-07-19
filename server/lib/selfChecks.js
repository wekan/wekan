// ============================================================================
// Runtime self-checks  (docs/Security/Remediation/WeKan.md §9b)
// ----------------------------------------------------------------------------
// Cheap invariants — the kind an existing WeKan UNIT test asserts — that can be
// checked at runtime WITHOUT a browser and WITHOUT Playwright. Any failure is
// recorded to the Tests stream (Admin Panel → Problems → Tests) via testLog.
//
// WeKan does NOT require Playwright to be installed: browser-only end-to-end
// (Playwright) failures are deliberately NOT detected here — only issues
// detectable without it. Passing checks are not logged (only failures).
//
// Best-effort and never throws into startup. Server-only.
// ============================================================================

import { Meteor } from 'meteor/meteor';
import fs from 'fs';
import path from 'path';
import { recordFailure } from '/server/lib/testLog';

function filesRoot() {
  const base = process.env.WRITABLE_PATH || process.cwd();
  return (base.endsWith('/files') || base.endsWith('\\files')) ? base : path.join(base, 'files');
}

// A trivial round-trip proves the database (FerretDB or MongoDB) is reachable
// and queryable — a failure here would break every WeKan test that touches data.
async function checkDatabaseRoundtrip() {
  await Meteor.users.find({}, { limit: 1 }).countAsync();
}

// WRITABLE_PATH/files must be writable (attachments, avatars, backups depend on
// it) — a WeKan startup/upload test asserts this.
async function checkWritablePath() {
  const dir = filesRoot();
  fs.mkdirSync(dir, { recursive: true });
  const probe = path.join(dir, '.wekan-selfcheck-' + process.pid);
  fs.writeFileSync(probe, 'ok');
  fs.unlinkSync(probe);
}

const CHECKS = [
  { name: 'database-roundtrip', fn: checkDatabaseRoundtrip },
  { name: 'writable-path', fn: checkWritablePath },
];

// Run all self-checks; record each failure to the Tests stream. Returns a small
// summary. Never throws.
export async function runSelfChecks() {
  let failures = 0;
  for (const c of CHECKS) {
    try {
      await c.fn();
    } catch (e) {
      failures += 1;
      try {
        recordFailure({
          suite: 'unit',
          test: 'self-check:' + c.name,
          message: (e && e.message) || String(e),
        });
      } catch (_) { /* logging must never break a self-check */ }
    }
  }
  return { checks: CHECKS.length, failures };
}

Meteor.startup(() => {
  // Give the DB/connection a moment, then run once. Best-effort.
  Meteor.setTimeout(() => {
    runSelfChecks().catch(() => {});
  }, 15000);
});

Meteor.methods({
  // Admin-only: re-run the runtime self-checks on demand (no Playwright needed).
  async runSelfChecks() {
    const uid = this.userId;
    const user = uid && (await Meteor.users.findOneAsync(uid));
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin only');
    }
    return runSelfChecks();
  },
});
