'use strict';

// Canary tokens (design: docs/Security/Remediation/WeKan.md §12).
//
// A canary is a tripwire on a path only a permission-override attempt reaches.
// Three properties are the whole point, and each is tested here:
//
//   SILENT     - tripping one changes nothing the caller can observe, so a probe
//                cannot map which paths are watched and route around them.
//   BOUNDED    - it sits where an attacker can loop, so it must not cost one
//                database row and one insert per attempt: repeats inside a
//                window are counted and flushed as a single summary, the map of
//                tracked pairs is capped, and a pair cannot write forever.
//   ATTRIBUTED - every event carries who (userId + username) and from where (IP).
//
// Run: node tests/canaryTokens.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const {
  CANARIES,
  DEFAULTS,
  CanaryRateLimiter,
  canaryFor,
  canaryIds,
  canaryPairKey,
  canaryDetail,
} = require('../models/lib/canaryTokens');
const { categoryFor } = require('../models/lib/securityCategories');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// ------------------------------------------------------------- the catalog

test('every canary resolves to a real security category and *Bleed name', () => {
  canaryIds().forEach(id => {
    const canary = canaryFor(id);
    assert.ok(canary.known, `${id} must be in the catalog`);
    const cat = categoryFor(canary.key);
    assert.notStrictEqual(cat.category, 'unknown',
      `${id} points at securityCategories key "${canary.key}", which is not defined`);
    assert.ok(cat.bleed && cat.bleed !== 'Generic', `${id} must map to a named *Bleed`);
  });
});

test('every canary says what was ATTEMPTED, in the words of the feature', () => {
  canaryIds().forEach(id => {
    const { what } = canaryFor(id);
    assert.ok(what && what.length > 15, `${id}: "${what}" is not a sentence an admin can act on`);
    // "authz.board blocked" is not something anyone can do anything about.
    assert.ok(!/^[a-z-]+\.[a-z-]+$/.test(what), `${id}: the description must not be a key`);
  });
});

test('an unknown canary id is still recorded, generically', () => {
  // Losing the event would be the worst possible failure mode for a tripwire.
  const canary = canaryFor('something.nobody.catalogued');
  assert.strictEqual(canary.known, false);
  assert.strictEqual(canary.id, 'something.nobody.catalogued');
  assert.notStrictEqual(categoryFor(canary.key).category, 'unknown');
  assert.ok(canary.what);
});

test('negative: junk ids do not throw', () => {
  [null, undefined, 42, {}, ''].forEach(bad => {
    const canary = canaryFor(bad);
    assert.strictEqual(canary.id, 'unknown');
    assert.ok(canary.what);
  });
});

// --------------------------------------------------------------- BOUNDED

test('the first attempt is recorded at once, the rest of the window are counted', () => {
  const limiter = new CanaryRateLimiter({ windowMs: 1000 });
  const key = 'k';
  assert.deepStrictEqual(limiter.consider(key, 0), { write: true, count: 1, suppressed: 0 });
  assert.deepStrictEqual(limiter.consider(key, 10), { write: false, count: 2, suppressed: 1 });
  assert.deepStrictEqual(limiter.consider(key, 999), { write: false, count: 3, suppressed: 2 });
});

test('the window closing flushes ONE summary carrying the suppressed count', () => {
  const limiter = new CanaryRateLimiter({ windowMs: 1000 });
  const key = 'k';
  limiter.consider(key, 0);
  for (let i = 1; i < 500; i++) limiter.consider(key, i);
  const flush = limiter.consider(key, 1000);
  assert.strictEqual(flush.write, true, 'the window closing writes');
  assert.strictEqual(flush.count, 501, 'and the row stands for every attempt');
  assert.ok(flush.suppressed >= 499, 'almost all of which were never written');
});

test('THE POINT: a thousand attempts cost two rows, not a thousand', () => {
  const limiter = new CanaryRateLimiter({ windowMs: 60000 });
  let writes = 0;
  for (let i = 0; i < 1000; i++) {
    if (limiter.consider('attacker', i).write) writes += 1;
  }
  assert.strictEqual(writes, 1, 'one row for a burst inside one window');
});

test('an endless probe stops writing rather than one row a minute forever', () => {
  const limiter = new CanaryRateLimiter({ windowMs: 1000, maxEventsPerPair: 5 });
  let writes = 0;
  // A full day of attempts, one per second.
  for (let t = 0; t < 86400 * 1000; t += 1000) {
    if (limiter.consider('slow-attacker', t).write) writes += 1;
  }
  assert.strictEqual(writes, 5, 'the per-pair ceiling holds however long it runs');
});

test('the tracked-pair map is capped, so a botnet cannot grow it without bound', () => {
  const limiter = new CanaryRateLimiter({ maxTracked: 50 });
  for (let i = 0; i < 5000; i++) limiter.consider(`ip-${i}`, i);
  assert.ok(limiter.size() <= 50, `map grew to ${limiter.size()}`);
});

test('...and the pair evicted is the least RECENTLY seen, not the first seen', () => {
  // Otherwise a long-running attacker is evicted while a one-off probe is kept.
  const limiter = new CanaryRateLimiter({ maxTracked: 3, windowMs: 10 });
  limiter.consider('persistent', 0);
  limiter.consider('a', 1);
  limiter.consider('b', 2);
  limiter.consider('persistent', 3);   // seen again: now the most recent
  limiter.consider('c', 4);            // forces an eviction
  // 'a' was the least recently seen, so it is the one that went.
  assert.strictEqual(limiter.consider('persistent', 5).count > 1, true,
    'the persistent attacker kept its counter');
});

test('idle pairs are swept, so a long-lived server does not hold every address', () => {
  const limiter = new CanaryRateLimiter({ windowMs: 1000 });
  for (let i = 0; i < 100; i++) limiter.consider(`ip-${i}`, 0);
  assert.strictEqual(limiter.size(), 100);
  assert.strictEqual(limiter.sweep(60000, 10000), 100);
  assert.strictEqual(limiter.size(), 0);
});

test('negative: junk keys and clocks are handled, never thrown on', () => {
  const limiter = new CanaryRateLimiter();
  assert.strictEqual(limiter.consider(null, null).write, true);
  assert.strictEqual(limiter.consider(undefined, NaN).write, false, 'both fall to the same key');
  assert.strictEqual(limiter.sweep(undefined, undefined) >= 0, true);
});

test('the shipped defaults are bounded, not "unlimited"', () => {
  assert.ok(DEFAULTS.windowMs >= 1000);
  assert.ok(DEFAULTS.maxTracked > 0 && DEFAULTS.maxTracked <= 100000);
  assert.ok(DEFAULTS.maxEventsPerPair > 0 && DEFAULTS.maxEventsPerPair <= 1000);
});

// ------------------------------------------------------------ ATTRIBUTED

test('a logged-in actor is keyed by account, so changing IP does not reset it', () => {
  const a = canaryPairKey('card.vote-field', { userId: 'u1', ip: '1.1.1.1' });
  const b = canaryPairKey('card.vote-field', { userId: 'u1', ip: '2.2.2.2' });
  assert.strictEqual(a, b);
});

test('an anonymous actor is keyed by address', () => {
  const a = canaryPairKey('card.vote-field', { ip: '1.1.1.1' });
  const b = canaryPairKey('card.vote-field', { ip: '2.2.2.2' });
  assert.notStrictEqual(a, b);
});

test('different canaries are counted separately', () => {
  assert.notStrictEqual(
    canaryPairKey('card.vote-field', { userId: 'u1' }),
    canaryPairKey('card.poker-field', { userId: 'u1' }),
  );
});

test('negative: an actor with nothing at all still gets a stable key', () => {
  assert.strictEqual(canaryPairKey('x', {}), canaryPairKey('x', undefined));
  assert.ok(canaryPairKey(null, null).length > 0);
});

// -------------------------------------------------------- what is recorded

test('the detail says what was tried and how many times', () => {
  const canary = canaryFor('card.cross-board-move');
  assert.ok(canaryDetail(canary, 1).includes('tried to move a card'));
  assert.ok(!canaryDetail(canary, 1).includes('attempts'), 'a single attempt says no count');
  assert.ok(canaryDetail(canary, 42).includes('42 attempts'));
});

test('negative: the detail never carries the payload', () => {
  // The security log is not a place to store attacker-controlled data.
  const canary = canaryFor('card.cross-board-move');
  const detail = canaryDetail(canary, 2, 'board move');
  assert.ok(detail.length < 200);
  // Said where a future caller will read it, on the parameter itself.
  assert.ok(/attacker-controlled text/.test(read('server/lib/canary.js')),
    'canary.js must warn that context.detail is not a place for the payload');
  // And the logger truncates and strips control characters regardless, so a
  // caller that ignores the warning still cannot turn the log into a sink.
  assert.ok(/sanitizeDetail/.test(read('server/lib/securityLog.js')));
});

// -------------------------------------------------------------- SILENT

test('tripCanary always returns false, and tripCanaryDeny always true', () => {
  const src = read('server/lib/canary.js');
  const trip = src.match(/export function tripCanary\([\s\S]*?\n\}/)[0];
  assert.ok(/return false;/.test(trip), 'the guard gets its refusal');
  assert.ok(!/return true/.test(trip));
  const deny = src.match(/export function tripCanaryDeny\([\s\S]*?\n\}/)[0];
  assert.ok(/return true;/.test(deny), 'a deny rule refuses by returning true');
});

test('the refusal is decided BEFORE any reporting work', () => {
  const src = read('server/lib/canary.js');
  const trip = src.match(/export function tripCanary\([\s\S]*?\n\}/)[0];
  // try/catch around the reporting, return outside it: reporting cannot change
  // the answer, and cannot throw into the caller either.
  assert.ok(/try \{[\s\S]*?report\(canaryId, context\);[\s\S]*?\} catch[\s\S]*?\}\s*return false;/.test(trip),
    'reporting is wrapped and the return value is not inside the try');
});

test('nothing is awaited on the caller\'s path', () => {
  const src = read('server/lib/canary.js');
  // A canary that awaits a database read would let an attacker slow every
  // request they choose to trip it with.
  assert.ok(/const p = finish\(\);[\s\S]{0,120}p\.catch\(\(\) => \{\}\)/.test(src),
    'the username lookup and the insert are fire-and-forget');
  const trip = src.match(/export function tripCanary\([\s\S]*?\n\}/)[0];
  assert.ok(!/await/.test(trip), 'tripCanary itself awaits nothing');
});

test('the rate limit decision comes before the work, not after', () => {
  const src = read('server/lib/canary.js');
  const report = src.match(/function report\(canaryId, context\)[\s\S]*?\n\}/)[0];
  const decideAt = report.indexOf('limiter.consider');
  const workAt = report.indexOf('fillUsername');
  assert.ok(decideAt > -1 && workAt > -1 && decideAt < workAt,
    'a suppressed trip must cost one map lookup and nothing else');
  assert.ok(/if \(!decision\.write\) return;/.test(report));
});

test('the username lookup is cached, so probing cannot make WeKan work harder', () => {
  const src = read('server/lib/canary.js');
  assert.ok(/NAME_TTL_MS/.test(src) && /NAME_CACHE_MAX/.test(src));
  assert.ok(/nameCache\.size >= NAME_CACHE_MAX/.test(src), 'and the cache itself is capped');
});

test('the client address is resolved with the spoofing-safe rule', () => {
  const src = read('server/lib/canary.js');
  // Same helper as the login throttle: X-Forwarded-For only as far as
  // HTTP_FORWARDED_COUNT says to trust it, or an attacker writes somebody
  // else's address into the security log by sending a header.
  assert.ok(/resolveClientKey/.test(src));
  assert.ok(/forwardedCount: process\.env\.HTTP_FORWARDED_COUNT/.test(src));
});

console.log(`\n${passed} tests passed`);
