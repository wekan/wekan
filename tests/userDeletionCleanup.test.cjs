'use strict';

// Plain-Node unit test (no Meteor) for the user-deletion cleanup planner.
// Run: ELECTRON_RUN_AS_NODE=1 <node> tests/userDeletionCleanup.test.cjs
//
// Regression guard for #1289 ("Error after deleting a user"): deleting a user
// only removed the users document, leaving dangling references behind —
// "ghost" board members with empty avatars, stale card members/assignees and
// watcher entries — which for years had to be cleaned up by hand or by
// editing MongoDB directly. buildUserDeletionCleanupPlan must produce the
// exact multi-updates that prune those references (and nothing else), and
// applyUserDeletionCleanup must drive them against the injected collections.

const assert = require('assert');
const {
  isValidUserId,
  buildUserDeletionCleanupPlan,
  applyUserDeletionCleanup,
} = require('../models/lib/userDeletionCleanup');

let passed = 0;
function test(name, fn) {
  const r = fn();
  if (r && typeof r.then === 'function') {
    return r.then(() => {
      passed += 1;
      console.log('  ok -', name);
    });
  }
  passed += 1;
  console.log('  ok -', name);
  return Promise.resolve();
}

const UID = 'ghostUser42';
const OTHER = 'aliveUser7';

// ---------------------------------------------------------------------------
// Minimal Mongo-ish semantics, enough to prove the selectors/modifiers do the
// right thing on realistic documents: $or / equality / dotted-path / array-
// contains matching, and $pull with either a plain value (string arrays) or a
// sub-document condition (object arrays).
// ---------------------------------------------------------------------------
function valueMatches(fieldValue, cond) {
  if (Array.isArray(fieldValue)) {
    return fieldValue.some(el => valueMatches(el, cond));
  }
  if (cond !== null && typeof cond === 'object') {
    return Object.entries(cond).every(([k, v]) =>
      valueMatches(fieldValue == null ? undefined : fieldValue[k], v),
    );
  }
  return fieldValue === cond;
}

function docMatches(doc, selector) {
  return Object.entries(selector).every(([key, cond]) => {
    if (key === '$or') {
      return cond.some(sub => docMatches(doc, sub));
    }
    // dotted paths only descend into arrays-of-objects here (members.userId)
    const parts = key.split('.');
    let value = doc;
    for (const part of parts) {
      if (Array.isArray(value)) {
        value = value.map(el => (el == null ? undefined : el[part]));
      } else if (value == null) {
        value = undefined;
      } else {
        value = value[part];
      }
    }
    return valueMatches(value, cond);
  });
}

function applyPull(doc, pullSpec) {
  Object.entries(pullSpec).forEach(([field, cond]) => {
    if (!Array.isArray(doc[field])) return;
    doc[field] = doc[field].filter(el => {
      if (cond !== null && typeof cond === 'object') {
        return !Object.entries(cond).every(([k, v]) => el != null && el[k] === v);
      }
      return el !== cond;
    });
  });
}

// A fake Mongo collection: updateAsync applies $pull to every matching doc
// and returns the matched count (like Meteor's updateAsync).
function fakeCollection(docs) {
  return {
    docs,
    calls: [],
    async updateAsync(selector, modifier, options) {
      this.calls.push({ selector, modifier, options });
      const matched = this.docs.filter(d => docMatches(d, selector));
      matched.forEach(d => applyPull(d, modifier.$pull));
      return matched.length;
    },
  };
}

// A fake FilesCollection: removeAsync(selector) deletes matching records and
// returns how many were removed (ostrio:files v3 behavior).
function fakeAvatars(docs) {
  return {
    docs,
    calls: [],
    async removeAsync(selector) {
      this.calls.push(selector);
      const keep = this.docs.filter(d => !docMatches(d, selector));
      const removed = this.docs.length - keep.length;
      this.docs = keep;
      return removed;
    },
  };
}

const run = (async () => {
  // --- plan shape (positive) ------------------------------------------------
  await test('plan pulls object-shaped board members/watchers by userId', () => {
    const plan = buildUserDeletionCleanupPlan(UID);
    assert.ok(plan, 'valid id must yield a plan');
    assert.deepStrictEqual(plan.boards.selector, {
      $or: [{ 'members.userId': UID }, { 'watchers.userId': UID }],
    });
    assert.deepStrictEqual(plan.boards.modifier, {
      $pull: { members: { userId: UID }, watchers: { userId: UID } },
    });
  });

  await test('plan pulls string-shaped card members/assignees/watchers', () => {
    const plan = buildUserDeletionCleanupPlan(UID);
    assert.deepStrictEqual(plan.cards.selector, {
      $or: [{ members: UID }, { assignees: UID }, { watchers: UID }],
    });
    assert.deepStrictEqual(plan.cards.modifier, {
      $pull: { members: UID, assignees: UID, watchers: UID },
    });
    assert.deepStrictEqual(plan.lists.selector, { watchers: UID });
    assert.deepStrictEqual(plan.lists.modifier, { $pull: { watchers: UID } });
    assert.deepStrictEqual(plan.avatars.selector, { userId: UID });
  });

  // --- end-to-end against fake collections (positive) ------------------------
  await test('cleanup removes every ghost reference of the deleted user', async () => {
    const boards = fakeCollection([
      {
        _id: 'b1',
        members: [
          { userId: OTHER, isAdmin: true, isActive: true },
          { userId: UID, isAdmin: false, isActive: true },
        ],
        watchers: [{ userId: UID, level: 'watching' }],
      },
      { _id: 'b2', members: [{ userId: OTHER, isAdmin: true }] },
    ]);
    const cards = fakeCollection([
      { _id: 'c1', members: [UID, OTHER], assignees: [UID], watchers: [UID] },
      { _id: 'c2', members: [OTHER], assignees: [] },
    ]);
    const lists = fakeCollection([
      { _id: 'l1', watchers: [UID, OTHER] },
      { _id: 'l2', watchers: [OTHER] },
    ]);
    const avatars = fakeAvatars([
      { _id: 'a1', userId: UID },
      { _id: 'a2', userId: OTHER },
    ]);

    const plan = buildUserDeletionCleanupPlan(UID);
    const result = await applyUserDeletionCleanup(plan, {
      boards,
      cards,
      lists,
      avatars,
    });

    assert.deepStrictEqual(result, { boards: 1, cards: 1, lists: 1, avatars: 1 });
    // ghost gone from the board, sibling member intact
    assert.deepStrictEqual(
      boards.docs[0].members.map(m => m.userId),
      [OTHER],
    );
    assert.deepStrictEqual(boards.docs[0].watchers, []);
    // ghost gone from card members/assignees/watchers, other member intact
    assert.deepStrictEqual(cards.docs[0].members, [OTHER]);
    assert.deepStrictEqual(cards.docs[0].assignees, []);
    assert.deepStrictEqual(cards.docs[0].watchers, []);
    assert.deepStrictEqual(lists.docs[0].watchers, [OTHER]);
    // the deleted user's avatar files are gone, other user's remain
    assert.deepStrictEqual(avatars.docs.map(a => a.userId), [OTHER]);
    // multi-updates: every collection update must pass { multi: true }
    [boards, cards, lists].forEach(coll =>
      coll.calls.forEach(call =>
        assert.deepStrictEqual(call.options, { multi: true }),
      ),
    );
  });

  // --- negative: untouched data stays untouched -------------------------------
  await test('other users, unrelated boards/cards/lists are never modified', async () => {
    const boards = fakeCollection([
      { _id: 'b', members: [{ userId: OTHER, isAdmin: true }], watchers: [{ userId: OTHER, level: 'muted' }] },
    ]);
    const cards = fakeCollection([
      { _id: 'c', members: [OTHER], assignees: [OTHER], watchers: [OTHER] },
    ]);
    const lists = fakeCollection([{ _id: 'l', watchers: [OTHER] }]);
    const avatars = fakeAvatars([{ _id: 'a', userId: OTHER }]);

    const result = await applyUserDeletionCleanup(buildUserDeletionCleanupPlan(UID), {
      boards,
      cards,
      lists,
      avatars,
    });

    assert.deepStrictEqual(result, { boards: 0, cards: 0, lists: 0, avatars: 0 });
    assert.deepStrictEqual(boards.docs[0].members, [{ userId: OTHER, isAdmin: true }]);
    assert.deepStrictEqual(cards.docs[0], {
      _id: 'c',
      members: [OTHER],
      assignees: [OTHER],
      watchers: [OTHER],
    });
    assert.deepStrictEqual(lists.docs[0].watchers, [OTHER]);
    assert.strictEqual(avatars.docs.length, 1);
  });

  // --- negative: invalid user ids yield NO plan (no overly-broad selectors) ---
  await test('invalid user ids produce null plans and are treated as invalid', () => {
    const bad = [undefined, null, '', 42, {}, { $ne: null }, ['x'], true];
    bad.forEach(v => {
      assert.strictEqual(isValidUserId(v), false, `isValidUserId(${JSON.stringify(v)})`);
      assert.strictEqual(
        buildUserDeletionCleanupPlan(v),
        null,
        `plan for ${JSON.stringify(v)} must be null`,
      );
    });
    assert.strictEqual(isValidUserId(UID), true);
  });

  // --- negative: applier is safe with missing plan / collections --------------
  await test('applier no-ops safely on null plan or missing collections', async () => {
    const zero = { boards: 0, cards: 0, lists: 0, avatars: 0 };
    assert.deepStrictEqual(await applyUserDeletionCleanup(null, {}), zero);
    assert.deepStrictEqual(
      await applyUserDeletionCleanup(buildUserDeletionCleanupPlan(UID), null),
      zero,
    );
    // partial injection: only cards present — others skipped, no throw
    const cards = fakeCollection([{ _id: 'c', members: [UID] }]);
    const partial = await applyUserDeletionCleanup(buildUserDeletionCleanupPlan(UID), {
      cards,
    });
    assert.deepStrictEqual(partial, { boards: 0, cards: 1, lists: 0, avatars: 0 });
    assert.deepStrictEqual(cards.docs[0].members, []);
  });

  console.log(`\n${passed} tests passed.`);
})();

run.catch(err => {
  console.error(err);
  process.exit(1);
});
