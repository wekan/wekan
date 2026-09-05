'use strict';

// GHSA-rf3w-rj48-jxcc — cross-IP account lockout denial of service (CWE-307).
// Run: node tests/lockoutPerSourceAddress.test.cjs
//
// THE REPORT (daniais). wekan-accounts-lockout kept ONE counter per user,
// `services.accounts-lockout.failedAttempts`, with no notion of where the
// attempts came from. Any unauthenticated attacker who knew a username could
// spend three wrong passwords and lock that account out FROM EVERY ADDRESS for
// the lockout period - repeatably, so effectively for as long as they cared to
// keep going. Usernames are public in normal WeKan use (board and card members
// are listed), so choosing a target was trivial, and an administrator was as
// easy to lock out as anyone else. Reproduced on v10.91:
//
//   attacker, address A : Incorrect / Incorrect / Too many attempts
//   victim,   address B : (correct password) Too many attempts
//
// Affected from v10.59, and not before, for a reason worth keeping in view: the
// flat counter is much older, but until the LockoutBleed fix
// (GHSA-2g94-9x3m-hv37) the hooks gated on English error strings that Meteor's
// ambiguousErrorMessages had already rewritten, so the counter never moved and
// no account ever locked. Making the lockout WORK is what made this reachable -
// a fix that turns on a mechanism inherits whatever that mechanism gets wrong.
//
// TWO FAULTS, and the second is the one that hurts:
//
//   1. the counter was global, so an attacker's failures were charged to the
//      victim's account rather than to the attacker's address;
//   2. a CORRECT password was refused while locked - and counted as a further
//      failure on the way. The old code allowed an attempt only when there was
//      no error AND no lock, so the owner typing the right password fell through
//      to the same throw as the attacker.
//
// These tests drive the decision directly, so the attack is reproduced as
// arithmetic rather than as a running server: the state, the settings and the
// clock go in, and what the server would do comes out.

const assert = require('assert');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PKG = path.join(ROOT, 'packages', 'wekan-accounts-lockout', 'src');
const {
  decideKnownUserAttempt, delayAfterFailures,
} = require(path.join(PKG, 'lockoutDecision'));
const {
  clientAddressOf, scopeKeyFor, scopeFieldFor, scopeStateOf,
} = require(path.join(PKG, 'lockoutScope'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// WeKan's defaults: three failures, sixty seconds, counted over a minute.
// Delays are switched off here (loginDelayBase 0) so these tests describe the
// LOCKOUT on its own, the way they did before delays existed. The delay has its
// own tests at the end, with its own settings.
const SETTINGS = {
  failuresBeforeLockout: 3, lockoutPeriod: 60, failureWindow: 60, loginDelayBase: 0,
};
const EMPTY = {
  failedAttempts: 0, firstFailedAttempt: 0, lastFailedAttempt: 0, unlockTime: 0,
  // The increasing delay's "may try again at", 0 when there is none.
  nextAttemptAt: 0,
};

// A user document, as Mongo would hold it after `n` failures from `address`.
function userAfterFailures(address, n, now, unlockTime = 0) {
  const key = scopeKeyFor(address);
  return {
    _id: 'u1',
    services: {
      'accounts-lockout': {
        byAddress: {
          [key]: {
            failedAttempts: n,
            firstFailedAttempt: now,
            lastFailedAttempt: now,
            unlockTime,
          },
        },
      },
    },
  };
}

test('THE ATTACK: an attacker locking their own address does not lock the victim\'s', () => {
  const now = 1_000_000;
  const A = '203.0.113.9';    // attacker
  const B = '198.51.100.4';   // victim
  let user = { _id: 'u1', services: {} };

  // Three wrong passwords from A.
  let last;
  for (let i = 0; i < 3; i += 1) {
    last = decideKnownUserAttempt({
      hadError: true, now: now + i, settings: SETTINGS, scope: scopeStateOf(user, A),
    });
    user = userAfterFailures(A, last.failedAttempts, now + i,
      last.action === 'lock' ? last.unlockTime : 0);
  }
  assert.strictEqual(last.action, 'lock', 'the third failure locks - that part was always right');

  // The victim, at B, with the RIGHT password. This is the line that used to
  // read "Too many attempts".
  const victim = decideKnownUserAttempt({
    hadError: false, now: now + 10, settings: SETTINGS, scope: scopeStateOf(user, B),
  });
  assert.strictEqual(victim.action, 'allow',
    'the victim must be able to log in from their own address while the attacker is locked');

  // And even a WRONG password from B starts from zero: A's failures are A's.
  const victimTypo = decideKnownUserAttempt({
    hadError: true, now: now + 11, settings: SETTINGS, scope: scopeStateOf(user, B),
  });
  assert.strictEqual(victimTypo.action, 'count',
    'a first mistake from another address is a first mistake, not a fourth');
  assert.strictEqual(victimTypo.failedAttempts, 1);
  assert.strictEqual(victimTypo.attemptsRemaining, 2);
});

test('FAULT 2: a correct password is allowed even from the locked address', () => {
  // The owner whose own address got locked - a typo three times over - types
  // the right password. The lock exists to stop guessing; they did not guess.
  const now = 2_000_000;
  const user = userAfterFailures('203.0.113.9', 3, now, now + 60_000);
  const decision = decideKnownUserAttempt({
    hadError: false, now: now + 5_000, settings: SETTINGS,
    scope: scopeStateOf(user, '203.0.113.9'),
  });
  assert.strictEqual(decision.action, 'allow', 'a proven login is never refused');
  assert.strictEqual(decision.clearScope, true, 'and it clears the lock behind it');
});

test('a correct password never counts as a failure (negative)', () => {
  const now = 3_000_000;
  const user = userAfterFailures('203.0.113.9', 2, now);
  const decision = decideKnownUserAttempt({
    hadError: false, now: now + 1, settings: SETTINGS,
    scope: scopeStateOf(user, '203.0.113.9'),
  });
  assert.ok(!('failedAttempts' in decision),
    'the old code incremented the counter on the way to refusing a correct password');
});

test('hammering during a lock does not extend it', () => {
  // Otherwise the denial of service comes straight back inside the mechanism
  // meant to stop it: keep failing, keep pushing the unlock time out.
  const now = 4_000_000;
  const unlockAt = now + 60_000;
  const user = userAfterFailures('203.0.113.9', 3, now, unlockAt);
  const first = decideKnownUserAttempt({
    hadError: true, now: now + 1_000, settings: SETTINGS,
    scope: scopeStateOf(user, '203.0.113.9'),
  });
  const later = decideKnownUserAttempt({
    hadError: true, now: now + 50_000, settings: SETTINGS,
    scope: scopeStateOf(user, '203.0.113.9'),
  });
  assert.strictEqual(first.action, 'locked');
  assert.strictEqual(later.action, 'locked');
  assert.ok(!('unlockTime' in first) && !('unlockTime' in later),
    'a locked attempt must not write a new unlock time');
  assert.ok(later.secondsRemaining < first.secondsRemaining,
    'the remaining time counts DOWN while an attacker keeps trying');
});

test('the lock still fires, and still expires (negative)', () => {
  // The point is not to weaken brute-force protection - it still has to work.
  const now = 5_000_000;
  let scope = EMPTY;
  const seen = [];
  for (let i = 0; i < 3; i += 1) {
    const d = decideKnownUserAttempt({ hadError: true, now: now + i, settings: SETTINGS, scope });
    seen.push(d.action);
    scope = {
      failedAttempts: d.failedAttempts,
      firstFailedAttempt: scope.firstFailedAttempt || now,
      lastFailedAttempt: now + i,
      unlockTime: d.action === 'lock' ? d.unlockTime : 0,
    };
  }
  assert.deepStrictEqual(seen, ['count', 'count', 'lock'],
    'three failures from one address still lock that address');

  // After the period, a wrong password is a first failure again.
  const after = decideKnownUserAttempt({
    hadError: true, now: now + 61_000, settings: SETTINGS, scope,
  });
  assert.strictEqual(after.action, 'count', 'the lock expires on its own');
});

test('the failure window still resets a stale run of failures', () => {
  const now = 6_000_000;
  const scope = {
    failedAttempts: 2, firstFailedAttempt: now, lastFailedAttempt: now, unlockTime: 0,
  };
  const d = decideKnownUserAttempt({
    hadError: true, now: now + 61_000, settings: SETTINGS, scope,
  });
  assert.strictEqual(d.failedAttempts, 1, 'two failures a minute ago do not count towards a lock now');
  assert.strictEqual(d.startsWindow, true, 'and this attempt starts the new window');
});

// ── Which address an attempt is charged to ──────────────────────────────────

test('behind a proxy, the counter follows X-Forwarded-For, not the proxy', () => {
  // Without this every attempt arrives from the proxy and they all share one
  // counter - which is the reported bug again, with extra steps.
  //
  // A proxy APPENDS the address it received from, so the chain reads
  // client-first and the rightmost entry is the nearest hop. With N trusted
  // proxies the client sits N from the right, which is what `parts.length - hops`
  // picks out.
  const oneProxy = {
    clientAddress: '10.0.0.1',                              // the proxy's socket
    httpHeaders: { 'x-forwarded-for': '203.0.113.9' },      // appended by it
  };
  assert.strictEqual(clientAddressOf(oneProxy, '1'), '203.0.113.9',
    'one trusted proxy: the client is the last entry');

  const twoProxies = {
    clientAddress: '10.0.0.2',
    httpHeaders: { 'x-forwarded-for': '203.0.113.9, 10.0.0.1' },
  };
  assert.strictEqual(clientAddressOf(twoProxies, '2'), '203.0.113.9',
    'two trusted proxies: the client is two from the right');

  assert.strictEqual(clientAddressOf(oneProxy, undefined), '10.0.0.1',
    'and with HTTP_FORWARDED_COUNT unset the header is not trusted at all');
});

test('a forged X-Forwarded-For cannot pick its own bucket (negative)', () => {
  // An attacker who could choose their bucket would get a fresh counter for
  // every attempt and never lock at all. They control what they SEND; the
  // trusted proxy appends where it actually came from, and only that position
  // is read.
  const conn = {
    clientAddress: '10.0.0.1',
    httpHeaders: { 'x-forwarded-for': 'fake-1, fake-2, 203.0.113.9' },
  };
  assert.strictEqual(clientAddressOf(conn, '1'), '203.0.113.9',
    'the entries to the left are attacker-supplied and are ignored');
});

test('no headers, or no connection at all, still yields a bucket (negative)', () => {
  // A hook that threw here would break login rather than protect it.
  assert.strictEqual(clientAddressOf({ clientAddress: '203.0.113.9' }, '1'), '203.0.113.9');
  assert.strictEqual(clientAddressOf({}, '1'), 'unknown');
  assert.strictEqual(clientAddressOf(null, '1'), 'unknown');
});

test('the same rule as the REST login throttle uses', () => {
  // server/lib/loginAttemptThrottle.js resolves the client address for the REST
  // login throttle the same way. Two rules would mean two answers to "who is
  // this", and a lockout that disagreed with a throttle about that would be a
  // hole in whichever was more generous.
  const fs = require('fs');
  const throttle = fs.readFileSync(path.join(ROOT, 'server/lib/loginAttemptThrottle.js'), 'utf8');
  const scope = fs.readFileSync(path.join(PKG, 'lockoutScope.js'), 'utf8');
  for (const shared of ['x-forwarded-for', 'parts.length - hops']) {
    assert.ok(throttle.includes(shared) && scope.includes(shared),
      `both must resolve the address by ${shared}`);
  }
  assert.ok(/HTTP_FORWARDED_COUNT/.test(scope),
    'and the package must read the same env var the app does');
});

test('the counter key is Mongo-safe, and is not a record of who attacked', () => {
  // A field name may not contain a dot, and an IPv4 address is all dots - so the
  // raw address cannot be a key. Hashing also means a locked account does not
  // carry a list of the addresses that attacked it, which WeKan has no reason
  // to keep.
  const key = scopeKeyFor('203.0.113.9');
  assert.ok(/^[0-9a-f]{32}$/.test(key), `expected a hex key, got ${key}`);
  assert.ok(!key.includes('.') && !key.startsWith('$'), 'and one Mongo will accept');
  assert.ok(!scopeFieldFor('203.0.113.9').includes('203.0.113.9'),
    'the address itself must not appear in the document');
  assert.notStrictEqual(scopeKeyFor('203.0.113.9'), scopeKeyFor('198.51.100.4'),
    'different addresses must not share a counter');
  assert.strictEqual(scopeKeyFor('203.0.113.9'), scopeKeyFor('203.0.113.9'),
    'and the same address must find its own');
});

test('missing or malformed state reads as "nothing yet" (negative)', () => {
  // A lockout that threw on a document it did not expect would lock everybody
  // out of a database that had one.
  for (const user of [
    {}, { services: {} }, { services: { 'accounts-lockout': {} } },
    { services: { 'accounts-lockout': { byAddress: { x: 'nonsense' } } } },
    { services: { 'accounts-lockout': { byAddress: null } } },
  ]) {
    assert.deepStrictEqual(scopeStateOf(user, '203.0.113.9'), EMPTY,
      `unexpected state should read as empty: ${JSON.stringify(user)}`);
  }
});

// ── The shape of the fix in the file that ships ─────────────────────────────

test('the success path is decided BEFORE anything reads the lock', () => {
  const fs = require('fs');
  const src = fs.readFileSync(path.join(PKG, 'knownUser.js'), 'utf8');
  const fn = src.slice(src.indexOf('async validateLoginAttempt('));
  const body = fn.slice(0, fn.indexOf('\n  }\n'));
  const success = body.indexOf('if (!hadError)');
  assert.ok(success !== -1, 'the correct-password path must be explicit');
  assert.ok(success < body.indexOf('scopeStateOf'),
    'it has to come before the lock state is even read, or some later branch can refuse it');
  assert.ok(!/loginInfo\.error === undefined && unlockTime === 0/.test(body),
    'the old "no error AND no lock" condition is what refused a correct password while locked');
});

test('no global counter is written any more (negative)', () => {
  const fs = require('fs');
  const src = fs.readFileSync(path.join(PKG, 'knownUser.js'), 'utf8');
  const code = src.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
  // The METHOD only. clearLockout below it names the flat fields on purpose, to
  // $unset them for accounts the old global counter left locked - reading past
  // the method would confuse clearing the counter with writing it.
  const fn = code.slice(code.indexOf('async validateLoginAttempt('));
  const writes = fn.slice(0, fn.indexOf('\n  }\n'));
  assert.ok(!/'services\.accounts-lockout\.failedAttempts'/.test(writes),
    'a flat failedAttempts write is the global counter coming back');
  assert.ok(!/'services\.accounts-lockout\.unlockTime'/.test(writes),
    'and a flat unlockTime write locks the account everywhere at once');
  assert.ok(/scopeFieldFor\(address\)/.test(writes),
    'every counter write has to be scoped to the address it belongs to');
});

test('a correct password clears the OLD flat state too', () => {
  // Somebody upgrading arrives with whatever the global counter last left on
  // their account. If that were not cleared they would stay locked by a counter
  // nothing writes any more.
  const fs = require('fs');
  const src = fs.readFileSync(path.join(PKG, 'knownUser.js'), 'utf8');
  const clear = src.slice(src.indexOf('static async clearLockout('));
  assert.ok(/'services\.accounts-lockout\.unlockTime'/.test(clear)
    && /'services\.accounts-lockout\.failedAttempts'/.test(clear),
    'clearLockout must unset the pre-fix flat fields as well as the new subtree');
});

// ── An attempt has to be VISIBLE ────────────────────────────────────────────
// CLAUDE.md: where a security fix DENIES an operation and the denial can be
// attributed, an administrator must be able to see that somebody tried.

test('a lockout is reported, and the report cannot break the lockout', () => {
  const fs = require('fs');
  const src = fs.readFileSync(path.join(PKG, 'knownUser.js'), 'utf8');
  const fn = src.slice(src.indexOf('async validateLoginAttempt('));
  const body = fn.slice(0, fn.indexOf('\n  }\n'));
  assert.ok(/this\.onLockout\(/.test(body), 'a lock firing must call the reporter');
  assert.ok(/catch \(e\) \{ \/\* reporting must never break the lockout \*\/ \}/.test(body),
    'and it must be wrapped: the lock matters, the record of it does not');
  // Only when it FIRES. Logging every refused attempt during a lock would let an
  // attacker fill Admin Panel -> Problems by holding down a key.
  const lockBranch = body.slice(body.indexOf("decision.action === 'lock'"));
  assert.ok(lockBranch.includes('this.onLockout'),
    'the report belongs on the lock branch, not on every blocked attempt');
  for (const field of ['username', 'ip', 'headers']) {
    assert.match(lockBranch, new RegExp(`${field}:`),
      `the lockout reporter must receive available ${field} attribution`);
  }
});

test('the catalog names it, so the log and the hall of fame cannot drift', () => {
  const fs = require('fs');
  const cat = fs.readFileSync(path.join(ROOT, 'models/lib/securityCategories.js'), 'utf8');
  assert.ok(/'brute\.lockout':\s*\{[^}]*bleed: 'JamBleed'/.test(cat),
    'brute.lockout must resolve to JamBleed');
  assert.ok(/'brute\.lockout':\s*\{[^}]*cwe: 'CWE-307'/.test(cat), 'CWE-307');
});

test('EVERY construction of AccountsLockout passes the reporter (negative)', () => {
  // The "and nowhere else" half. There are two construction sites - startup and
  // the Admin Panel settings reload - and a reload that dropped the reporter
  // would silently stop recording attempts on a running server, which is the
  // worst version of this: the guard still works and nobody can see it working.
  const fs = require('fs');
  const walk = (dir, out = []) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) { if (name !== 'node_modules') walk(full, out); }
      else if (name.endsWith('.js')) out.push(full);
    }
    return out;
  };
  const sites = [];
  for (const f of walk(path.join(ROOT, 'server'))) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/new AccountsLockout\(\{[\s\S]*?\}\)/g)) {
      sites.push([path.relative(ROOT, f), m[0]]);
    }
  }
  assert.ok(sites.length >= 2, `expected the construction sites, found ${sites.length}`);
  for (const [file, call] of sites) {
    assert.ok(/onLockout:/.test(call),
      `${file} constructs AccountsLockout without onLockout, so lockouts there are `
      + 'invisible in Admin Panel -> Problems');
  }
});

test('the reporter logs an attempt, not ordinary use (negative)', () => {
  // A log that fills with normal traffic hides the one line that mattered. A
  // lock fires only after N wrong passwords in a row from ONE address, so it is
  // an attempt by construction - but the record must say `blocked`, since the
  // fix refused something, rather than `detected`.
  const fs = require('fs');
  for (const f of ['server/accounts-lockout-config.js', 'server/methods/lockoutSettings.js']) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const fn = src.slice(src.indexOf('function reportLockout('));
    const body = fn.slice(0, fn.indexOf('\n}\n'));
    assert.ok(/key: 'brute\.lockout'/.test(body), `${f}: the catalog key`);
    assert.ok(/action: 'blocked'/.test(body), `${f}: blocked, not detected`);
    assert.ok(/userId,/.test(body) && /username,/.test(body) && /ip,/.test(body),
      `${f}: account and address attribution`);
    assert.ok(/locationFromHeaders\(headers\)/.test(body),
      `${f}: available proxy location attribution`);
    assert.ok(/catch \(e\) \{ \/\* logging must never break the guard \*\/ \}/.test(body),
      `${f}: logging must never break the guard`);
  }
});

// ── Admin Panel → People still shows who is locked ──────────────────────────
// Moving the counter broke three readers that were still looking at the flat
// field, so every account showed as unlocked and could not be unlocked. This is
// the "and nowhere else" half of the rule, applied to the fix itself.

test('nothing reads the flat lockout field any more (negative)', () => {
  const fs = require('fs');
  const files = [
    'client/components/settings/peopleBody.js',
    'server/methods/lockedUsers.js',
  ];
  for (const f of files) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const code = src.split('\n').filter(l => !/^\s*(\/\/|\*)/.test(l)).join('\n');
    assert.ok(!/accounts-lockout'\]\.unlockTime/.test(code)
      && !/accounts-lockout\.unlockTime/.test(code),
      `${f} still reads the flat unlockTime, which the per-address fix removed - `
      + 'it will report every account as unlocked');
  }
});

test('the display field is never read by the DECISION (negative)', () => {
  // lockedUntil exists so an admin screen can ask "which accounts are locked".
  // A field that says "this ACCOUNT is locked" is exactly the vulnerability that
  // was fixed, so the decision must never consult it.
  const fs = require('fs');
  const decision = fs.readFileSync(path.join(PKG, 'lockoutDecision.js'), 'utf8');
  assert.ok(!/lockedUntil/.test(decision),
    'the per-address decision must not read an account-wide lock field');
  const scope = fs.readFileSync(path.join(PKG, 'lockoutScope.js'), 'utf8');
  assert.ok(!/lockedUntil/.test(scope), 'nor may the scope that reads the counter');
});

test('locking writes the display field and clearing removes it', () => {
  const fs = require('fs');
  const src = fs.readFileSync(path.join(PKG, 'knownUser.js'), 'utf8');
  assert.ok(/set\['services\.accounts-lockout\.lockedUntil'\] = decision\.unlockTime/.test(src),
    'a lock must be visible to Admin Panel -> People');
  const clear = src.slice(src.indexOf('static async clearLockout('));
  assert.ok(/'services\.accounts-lockout\.lockedUntil': ''/.test(clear),
    'and clearing the lockout must clear it, or the account looks locked for ever');
  assert.ok(/const stillLocked = \(\(\) => \{/.test(src) && /if \(user && !stillLocked\)/.test(src),
    'unlocking ONE address must only clear it when no address is still locked');
  // A Meteor package is compiled separately from the app and cannot import app
  // modules, so that check is inlined here rather than taken from
  // models/lib/accountLockout.js. No other package in this repository reaches
  // across that boundary, and this one must not either.
  assert.ok(!/require\('\/models\//.test(src) && !/from '\/models\//.test(src),
    'the package must not import app code - it does not compile with the app');
});

test('the summary answers WHY, not just whether', () => {
  const { lockSummary, isUserLocked } = require(path.join(ROOT, 'models/lib/accountLockout'));
  const now = 7_000_000;
  const user = {
    services: {
      'accounts-lockout': {
        byAddress: {
          a: { unlockTime: now + 30_000, failedAttempts: 3, lastFailedAttempt: now },
          b: { unlockTime: now + 60_000, failedAttempts: 5, lastFailedAttempt: now },
          c: { unlockTime: now - 1, failedAttempts: 3 },   // expired
        },
      },
    },
  };
  assert.strictEqual(isUserLocked(user, now), true);
  const summary = lockSummary(user, now);
  assert.strictEqual(summary.addresses, 2, 'the expired one is not a lock');
  assert.strictEqual(summary.failedAttempts, 8, 'across the addresses still locked');
  assert.strictEqual(summary.unlockTime, now + 60_000, 'free when the longest one ends');
  assert.strictEqual(summary.secondsRemaining, 60);
});

test('an account with no lockout state is not locked (negative)', () => {
  const { isUserLocked, lockSummary } = require(path.join(ROOT, 'models/lib/accountLockout'));
  for (const user of [null, {}, { services: {} }, { services: { 'accounts-lockout': {} } },
    { services: { 'accounts-lockout': { byAddress: 'nonsense' } } }]) {
    assert.strictEqual(isUserLocked(user), false, `should not be locked: ${JSON.stringify(user)}`);
  }
  assert.deepStrictEqual(lockSummary({}), { locked: false, addresses: 0 });
});

// ── The increasing delay after a wrong password ─────────────────────────────
// The lockout on its own is a step function: two failures cost nothing, the
// third costs sixty seconds. A delay that GROWS costs a guesser far more than
// somebody who mistyped, and it degrades instead of slamming shut.

const DELAYED = {
  failuresBeforeLockout: 5, lockoutPeriod: 60, failureWindow: 600,
  loginDelayBase: 1, loginDelayMax: 30,
};

test('each wrong password costs more than the one before it', () => {
  const now = 8_000_000;
  let scope = EMPTY;
  const waits = [];
  let clock = now;
  for (let i = 0; i < 4; i += 1) {
    const d = decideKnownUserAttempt({ hadError: true, now: clock, settings: DELAYED, scope });
    waits.push(d.delayMs / 1000);
    scope = {
      failedAttempts: d.failedAttempts,
      firstFailedAttempt: scope.firstFailedAttempt || clock,
      lastFailedAttempt: clock,
      unlockTime: 0,
      nextAttemptAt: d.nextAttemptAt,
    };
    clock = d.nextAttemptAt + 1;      // wait it out, then try again
  }
  assert.deepStrictEqual(waits, [1, 2, 4, 8], 'doubling from the base');
});

test('the delay is capped, so it cannot run away into hours', () => {
  assert.strictEqual(delayAfterFailures(20, DELAYED), 30_000,
    'the cap is what a support desk has to live with');
  assert.strictEqual(delayAfterFailures(1, DELAYED), 1_000);
});

test('trying again too soon is refused WITHOUT counting (negative)', () => {
  // Otherwise an attacker reaches the lockout faster by trying faster, which is
  // the wrong way round: impatience would become a weapon against the address.
  const now = 9_000_000;
  const scope = {
    failedAttempts: 2, firstFailedAttempt: now, lastFailedAttempt: now,
    unlockTime: 0, nextAttemptAt: now + 4_000,
  };
  const d = decideKnownUserAttempt({ hadError: true, now: now + 1_000, settings: DELAYED, scope });
  assert.strictEqual(d.action, 'too-soon');
  assert.strictEqual(d.secondsRemaining, 3);
  assert.ok(!('failedAttempts' in d), 'a refused-too-early attempt must not count');
  assert.ok(!('nextAttemptAt' in d), 'nor may it push the wait further out');
});

test('a CORRECT password ignores the delay entirely', () => {
  // The whole point: the delay slows a guesser down. Somebody who did not have
  // to guess has proved they are not who it is for.
  const now = 10_000_000;
  const scope = {
    failedAttempts: 3, firstFailedAttempt: now, lastFailedAttempt: now,
    unlockTime: 0, nextAttemptAt: now + 30_000,
  };
  const d = decideKnownUserAttempt({ hadError: false, now: now + 1, settings: DELAYED, scope });
  assert.strictEqual(d.action, 'allow', 'no wait for a password that is right');
  assert.strictEqual(d.clearScope, true, 'and the delay is cleared behind it');
});

test('the delay is per ADDRESS, so an attacker cannot slow the owner down', () => {
  // Same rule as the counter itself. The scope IS the per-address state, so this
  // is really a check that nothing account-wide leaks into the decision.
  const now = 11_000_000;
  const attackerScope = {
    failedAttempts: 4, firstFailedAttempt: now, lastFailedAttempt: now,
    unlockTime: 0, nextAttemptAt: now + 8_000,
  };
  const ownerScope = EMPTY;
  assert.strictEqual(
    decideKnownUserAttempt({ hadError: true, now, settings: DELAYED, scope: attackerScope }).action,
    'too-soon');
  assert.strictEqual(
    decideKnownUserAttempt({ hadError: true, now, settings: DELAYED, scope: ownerScope }).action,
    'count', 'the owner, elsewhere, waits for nothing');
});

test('delays can be switched off, and then nothing changes (negative)', () => {
  // loginDelayBase 0 leaves the lockout behaving exactly as it did before, so an
  // instance that does not want this is not forced into it.
  const off = { ...DELAYED, loginDelayBase: 0 };
  const d = decideKnownUserAttempt({ hadError: true, now: 12_000_000, settings: off, scope: EMPTY });
  assert.strictEqual(d.delayMs, 0);
  assert.strictEqual(d.nextAttemptAt, 0, 'and no wait is written at all');
});

test('the write path stores the wait, and the settings carry defaults', () => {
  const fs = require('fs');
  const src = fs.readFileSync(path.join(PKG, 'knownUser.js'), 'utf8');
  assert.ok(/decision\.action === 'too-soon'/.test(src), 'the refusal must be handled');
  assert.ok(/nextAttemptAt`\] = decision\.nextAttemptAt/.test(src), 'and the wait recorded');
  const settings = fs.readFileSync(path.join(ROOT, 'models/lockoutSettings.js'), 'utf8');
  for (const key of ['known-loginDelayBase', 'known-loginDelayMax']) {
    assert.ok(settings.includes(key), `${key} must be a setting, not a constant`);
  }
});

console.log(`\nlockoutPerSourceAddress: ${passed} tests passed`);
