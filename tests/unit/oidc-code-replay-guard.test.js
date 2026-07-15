// Standalone Node unit test for the OIDC authorization-code replay guard
// from packages/wekan-oidc/oidcCodeReplayGuard.js.
//
// Background (pentest finding, 2026-07): a captured
// /_oauth/oidc?state=...&code=... request could be replayed to mint a
// brand-new, valid Wekan session even after the original user had logged
// out, because oidc_server.js forwarded whatever `code` it received
// straight to the IdP on every hit with no local single-use tracking.
// assertOidcCodeNotReplayed() closes that gap by recording every
// (state, code) pair it sees and rejecting a repeat before the IdP is
// ever contacted.
//
// No test framework: plain Node + assert. Run with:
//   node tests/unit/oidc-code-replay-guard.test.js

const assert = require('assert');
const {
  codeHashFor,
  assertOidcCodeNotReplayed,
} = require('../../packages/wekan-oidc/oidcCodeReplayGuard.js');

assert.strictEqual(
  typeof assertOidcCodeNotReplayed,
  'function',
  'assertOidcCodeNotReplayed must be exported as a function',
);

// Minimal stand-in for the Mongo collection: mimics a unique index on _id
// by throwing an E11000-style error on a duplicate insert, same as real
// Mongo does. Good enough to exercise the atomicity the fix relies on.
function makeFakeCollection() {
  const store = new Map();
  return {
    insertAsync: async doc => {
      if (store.has(doc._id)) {
        const err = new Error('E11000 duplicate key error');
        err.code = 11000;
        throw err;
      }
      store.set(doc._id, doc);
      return doc._id;
    },
    size: () => store.size,
  };
}

async function run() {
  // a) First exchange of a given (state, code) pair succeeds.
  {
    const collection = makeFakeCollection();
    await assertOidcCodeNotReplayed(
      { state: 's1', code: 'c1' },
      collection,
    );
    assert.strictEqual(collection.size(), 1);
    console.log('OK a) first use of a code is accepted');
  }

  // b) Replaying the exact same (state, code) pair is rejected.
  {
    const collection = makeFakeCollection();
    await assertOidcCodeNotReplayed(
      { state: 's1', code: 'c1' },
      collection,
    );
    await assert.rejects(
      () => assertOidcCodeNotReplayed({ state: 's1', code: 'c1' }, collection),
      /already been used/,
      'a replayed code must be rejected',
    );
    console.log('OK b) replay of the same code is rejected');
  }

  // c) Same `code` but a different `state` is treated as a distinct use
  //    (defence in depth: binds the check to the full callback, not just
  //    the code value alone).
  {
    const collection = makeFakeCollection();
    await assertOidcCodeNotReplayed(
      { state: 's1', code: 'c1' },
      collection,
    );
    await assertOidcCodeNotReplayed(
      { state: 's2', code: 'c1' },
      collection,
    );
    assert.strictEqual(collection.size(), 2);
    console.log('OK c) same code with a different state is not treated as a replay');
  }

  // d) A query with no `code` (e.g. an error callback from the IdP) is a
  //    no-op: nothing is recorded, and it never throws here (the existing
  //    getToken()/error-handling path deals with that case instead).
  {
    const collection = makeFakeCollection();
    await assertOidcCodeNotReplayed({ state: 's1' }, collection);
    await assertOidcCodeNotReplayed(undefined, collection);
    assert.strictEqual(collection.size(), 0);
    console.log('OK d) a query without a code is a no-op');
  }

  // e) Two concurrent replay attempts for the same code: exactly one must
  //    win. This is the actual race the unique-_id-insert design defends
  //    against (a naive find-then-insert check would let both through).
  {
    const collection = makeFakeCollection();
    const attempts = await Promise.allSettled([
      assertOidcCodeNotReplayed({ state: 's1', code: 'c1' }, collection),
      assertOidcCodeNotReplayed({ state: 's1', code: 'c1' }, collection),
    ]);
    const fulfilled = attempts.filter(a => a.status === 'fulfilled');
    const rejected = attempts.filter(a => a.status === 'rejected');
    assert.strictEqual(fulfilled.length, 1, 'exactly one concurrent attempt must succeed');
    assert.strictEqual(rejected.length, 1, 'exactly one concurrent attempt must be rejected');
    console.log('OK e) only one of two concurrent replay attempts succeeds');
  }

  // f) codeHashFor is deterministic and distinguishes different inputs.
  {
    const h1 = codeHashFor({ state: 's1', code: 'c1' });
    const h2 = codeHashFor({ state: 's1', code: 'c1' });
    const h3 = codeHashFor({ state: 's1', code: 'c2' });
    assert.strictEqual(h1, h2, 'hashing the same query twice must be deterministic');
    assert.notStrictEqual(h1, h3, 'different codes must hash differently');
    console.log('OK f) codeHashFor is deterministic and input-sensitive');
  }

  console.log('ALL OIDC CODE REPLAY GUARD UNIT TESTS PASSED');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
