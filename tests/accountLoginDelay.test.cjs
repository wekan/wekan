'use strict';

// Guard: BruteBleed hardening (maintainer decision 2026-10-02). The login
// lockouts count per address and per (account, address), so a guesser spread
// over many addresses was never slowed. A per-account brake now limits an
// account under attack to one attempt per slot, from any number of addresses
// and connections, while the owner's known addresses are not slowed - unlike
// a per-account lockout, which a stranger could use to lock the owner out
// (JamBleed).
// Run: node tests/accountLoginDelay.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const { AccountLoginDelay } = require('../server/lib/accountLoginDelay');

test('the reported shape: a thousand addresses get one guess per slot, not a thousand', () => {
  const brake = new AccountLoginDelay();
  let now = 1_000_000;
  for (let i = 0; i < 5; i += 1) {
    assert.equal(brake.decide('victim', `10.0.0.${i}`, now).allowed, true);
    brake.recordFailure('victim', `10.0.0.${i}`, now);
  }
  // A burst from many addresses at the same instant: one is let through.
  const burst = Array.from({ length: 1000 }, (_, i) => brake.decide('victim', `172.16.${i >> 8}.${i & 255}`, now));
  assert.equal(burst.filter(d => d.allowed).length, 1);
  assert.ok(burst.filter(d => !d.allowed).every(d => d.retryAfterMs > 0));
  // The slots grow with failures and stop at the ceiling.
  let allowed = 0;
  for (let t = 0; t < 10 * 60 * 1000; t += 250) {
    const d = brake.decide('victim', '192.0.2.9', now + t);
    if (d.allowed) { allowed += 1; brake.recordFailure('victim', '192.0.2.9', now + t); }
  }
  assert.ok(allowed > 10 && allowed < 40, `${allowed} guesses in 10 minutes`);
});

test('the owner is not slowed, and nobody is locked out (negative)', () => {
  const brake = new AccountLoginDelay();
  const now = 5_000_000;
  brake.recordSuccess('victim', 'home', now - 1000);
  for (let i = 0; i < 50; i += 1) brake.recordFailure('victim', `attacker${i}`, now);
  // From the owner's known address: always allowed, at full speed.
  for (let i = 0; i < 20; i += 1) assert.equal(brake.decide('victim', 'home', now + i).allowed, true);
  // From a new address the owner still gets a slot: delayed, never refused for good.
  const later = now + 31 * 1000;
  assert.equal(brake.decide('victim', 'new-laptop', later).allowed, true);
  // Below the free failures nothing changes for anybody.
  const fresh = new AccountLoginDelay();
  for (let i = 0; i < 4; i += 1) fresh.recordFailure('u', 'x', now);
  assert.equal(fresh.decide('u', 'x', now).allowed, true);
  assert.equal(fresh.decide('u', 'x', now).allowed, true);
  // The window ends the brake.
  assert.equal(brake.decide('victim', 'elsewhere', now + 16 * 60 * 1000).allowed, true);
});

test('memory is bounded however many accounts are named', () => {
  const brake = new AccountLoginDelay({ maxAccounts: 100 });
  for (let i = 0; i < 1000; i += 1) brake.recordFailure(`acct${i}`, 'x', i);
  assert.ok(brake._failures.size <= 100);
  for (let i = 0; i < 20; i += 1) brake.recordSuccess('one', `addr${i}`, i);
  assert.equal(brake._known.get('one').size, 5);
});

test('both login paths consult the brake before answering, and record the target, never the actor', () => {
  const rest = read('server/apiAuthRoutes.js');
  const gateAt = rest.indexOf('accountLoginDelay.decide(user && user._id, clientKey, now)');
  const passwordAt = rest.indexOf('Accounts._checkPasswordAsync(user, options.password)');
  assert.ok(gateAt > 0 && gateAt < passwordAt, 'REST: the brake comes before the password check');
  assert.equal((rest.match(/failAccount\(\);/g) || []).length, 2);
  assert.match(rest, /accountLoginDelay\.recordSuccess\(result\.userId, clientKey, now\);/);
  const ddp = read('server/authentication.js');
  assert.match(ddp, /if \(options\.type !== 'password' \|\| !options\.user\) return true;[\s\S]{0,700}accountLoginDelay\.decide\(options\.user\._id, address, now\)/);
  const lib = read('server/lib/accountLoginDelay.js');
  const call = lib.slice(lib.indexOf('record({'), lib.indexOf('});', lib.indexOf('record({')));
  assert.match(call, /key: 'brute\.login'/);
  assert.match(call, /targetUserId: accountId/);
  assert.doesNotMatch(call, /^\s*userId:/m, 'the guessed account is not the actor');
});
