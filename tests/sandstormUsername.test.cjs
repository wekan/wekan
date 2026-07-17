'use strict';

// Plain-Node unit test (no Meteor) for the Sandstorm unique-username helpers.
// Run: ELECTRON_RUN_AS_NODE=1 <node> tests/sandstormUsername.test.cjs
//
// Covers #574 "Sandstorm - generation of unique usernames": the uniqueness
// probe must be case-INsensitive (Meteor usernames are case-preserving but
// case-insensitively unique), the handle must be regex-escaped before being
// interpolated into the probe, and the probe->update race must be resolved by
// catching the E11000 duplicate-key error and retrying with the next number.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  generateUniqueUsername,
  escapeForRegex,
  usernameCaseInsensitiveRegex,
  isDuplicateKeyError,
  claimUniqueUsername,
} = require('../models/lib/sandstormUsername');

const tests = [];
let passed = 0;
function test(name, fn) {
  tests.push([name, fn]);
}

// --- generateUniqueUsername (historical numbering) ---------------------------

test('appendNumber 0 keeps the bare handle, 1+ append the number', () => {
  assert.strictEqual(generateUniqueUsername('max', 0), 'max');
  assert.strictEqual(generateUniqueUsername('max', 1), 'max1');
  assert.strictEqual(generateUniqueUsername('max', 12), 'max12');
});

// --- case-insensitive, anchored, escaped probe --------------------------------

test('probe regex matches the same name in any case', () => {
  const re = usernameCaseInsensitiveRegex('max');
  assert.ok(re.test('max'));
  assert.ok(re.test('Max'));
  assert.ok(re.test('MAX'));
});

test('probe regex is anchored: no prefix/suffix/substring matches', () => {
  const re = usernameCaseInsensitiveRegex('max');
  assert.ok(!re.test('max1'), 'must not match a longer name');
  assert.ok(!re.test('emax'), 'must not match a suffix hit');
  assert.ok(!re.test('a max b'), 'must not match a substring hit');
});

test('regex metacharacters in a handle are matched literally', () => {
  assert.strictEqual(escapeForRegex('a.b+c'), 'a\\.b\\+c');
  const re = usernameCaseInsensitiveRegex('a.b');
  assert.ok(re.test('a.b'));
  assert.ok(!re.test('axb'), 'the dot must not act as a wildcard');
  // A hostile handle must not blow up regex construction.
  assert.ok(usernameCaseInsensitiveRegex('x($[a]*\\').test('x($[a]*\\'));
});

// --- duplicate-key error detection --------------------------------------------

test('recognizes duplicate-key errors by code and by message', () => {
  assert.ok(isDuplicateKeyError({ code: 11000 }));
  assert.ok(isDuplicateKeyError({ code: 11001 }));
  assert.ok(
    isDuplicateKeyError(
      new Error('E11000 duplicate key error collection: wekan.users index: username_1'),
    ),
  );
  assert.ok(isDuplicateKeyError({ errmsg: 'E11000 duplicate key error' }));
});

test('does not misclassify other errors as duplicate-key', () => {
  assert.ok(!isDuplicateKeyError(null));
  assert.ok(!isDuplicateKeyError(undefined));
  assert.ok(!isDuplicateKeyError(new Error('connection reset')));
  assert.ok(!isDuplicateKeyError({ code: 121, message: 'validation failed' }));
});

// --- claimUniqueUsername: probing ----------------------------------------------

function takenSet(names) {
  const lower = names.map(n => n.toLowerCase());
  return async candidate => lower.includes(candidate.toLowerCase());
}

test('claims the bare handle when nothing conflicts', async () => {
  const claimed = [];
  const result = await claimUniqueUsername('max', takenSet([]), async c => {
    claimed.push(c);
  });
  assert.strictEqual(result, 'max');
  assert.deepStrictEqual(claimed, ['max']);
});

test('skips names that are taken, including case-insensitive hits (#574)', async () => {
  // 'Max' and 'MAX1' exist with different case: the old case-sensitive query
  // would have handed out 'max' again; the fix must walk on to 'max2'.
  const result = await claimUniqueUsername(
    'max',
    takenSet(['Max', 'MAX1']),
    async () => {},
  );
  assert.strictEqual(result, 'max2');
});

// --- claimUniqueUsername: the race ----------------------------------------------

test('retries with the next number when the update loses the unique-index race', async () => {
  // The probe says 'max' is free, but a concurrent insert claims it first:
  // the update throws E11000 and the helper must claim 'max1' instead.
  const attempts = [];
  let raced = false;
  const result = await claimUniqueUsername(
    'max',
    async () => false,
    async candidate => {
      attempts.push(candidate);
      if (!raced) {
        raced = true;
        const err = new Error('E11000 duplicate key error');
        err.code = 11000;
        throw err;
      }
    },
  );
  assert.strictEqual(result, 'max1');
  assert.deepStrictEqual(attempts, ['max', 'max1']);
});

test('a non-duplicate error from the update propagates unchanged', async () => {
  const boom = new Error('mongo is down');
  await assert.rejects(
    claimUniqueUsername(
      'max',
      async () => false,
      async () => {
        throw boom;
      },
    ),
    err => err === boom,
  );
});

// --- wiring: sandstorm.js actually uses the helpers ------------------------------

test('sandstorm.js probes case-insensitively and claims via the racy-safe helper', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'sandstorm.js'), 'utf8');
  assert.ok(
    /from ['"]\/models\/lib\/sandstormUsername['"]/.test(src),
    'sandstorm.js must import from /models/lib/sandstormUsername',
  );
  assert.ok(
    src.includes('usernameCaseInsensitiveRegex(candidate)'),
    'the uniqueness probe must use the anchored case-insensitive regex',
  );
  assert.ok(
    src.includes('claimUniqueUsername('),
    'the username must be claimed through the duplicate-key-retrying helper',
  );
  assert.ok(
    !/username:\s*generateUniqueUsername\(/.test(src),
    'the old case-sensitive exact-match probe must be gone',
  );
});

// --- runner ---------------------------------------------------------------------

(async () => {
  for (const [name, fn] of tests) {
    await fn();
    passed += 1;
    console.log('  ok -', name);
  }
  console.log(`\nsandstormUsername: ${passed} tests passed`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
