/**
 * Test: WekanCreator import of *inconsistent* board JSON
 *
 * A Wekan board export can be syntactically valid JSON yet internally
 * inconsistent: dangling user references (a member whose account was deleted is
 * no longer in `users`), dangling card `listId`s, orphaned checklists, an
 * absent `lists` array, etc. Such exports used to make the import fail outright
 * ("error-json-malformed") or silently drop data (cards with an undefined
 * listId never render). These tests lock in the defensive behaviour added to:
 *
 *   - client/components/import/wekanMembersMapper.js  (wekanGetMembersToMap)
 *   - models/wekanmapper.js                           (getMembersToMap, used by cloneBoard)
 *   - models/wekanCreator.js                          (createCards / createChecklists)
 *
 * Those modules depend on Meteor (ReactiveCache, collections) and cannot be
 * imported under plain Node, so — following the convention of the sibling
 * wekanCreator.import.test.js — each test re-implements the exact guard being
 * verified. The re-implementations are kept byte-for-byte faithful to the
 * production code they mirror; if you change a guard, change it here too.
 *
 * Unlike the sibling file, failures here throw (assert), so a regression makes
 * the process exit non-zero instead of merely printing an ✗.
 */

const assert = require('assert');

// --- Faithful copy of the member-mapping guard ----------------------------
// Mirrors wekanGetMembersToMap (client) / getMembersToMap (wekanmapper.js).
// `lookupWekanUser` stands in for ReactiveCache.getUser({ username }).
function mapMembers(data, lookupWekanUser = () => null) {
  const membersToMap = data.members || [];
  const users = data.users || [];
  const mappable = [];
  membersToMap.forEach(importedMember => {
    importedMember.id = importedMember.userId;
    delete importedMember.userId;
    const user = users.filter(u => u._id === importedMember.id)[0];
    // Dangling user reference: skip instead of dereferencing undefined.
    if (!user) {
      return;
    }
    if (user.profile && user.profile.fullname) {
      importedMember.fullName = user.profile.fullname;
    }
    importedMember.username = user.username;
    const wekanUser = lookupWekanUser(importedMember.username);
    if (wekanUser) {
      importedMember.wekanId = wekanUser._id;
    }
    mappable.push(importedMember);
  });
  return mappable;
}

// --- Faithful copy of the card listId resolution --------------------------
// Mirrors createCards(): this.lists[card.listId] || this._defaultListId, and
// the lazy creation of a single default list when the export has none.
function resolveCardListId(card, listMap, state) {
  let listId = listMap[card.listId] || state.defaultListId;
  if (!listId) {
    listId = 'default-list-created';
    state.defaultListId = listId;
  }
  return listId;
}

// --- Faithful copy of the orphaned-checklist guard ------------------------
// Mirrors createChecklists(): skip checklists whose card is missing.
function importChecklists(checklists, cardMap) {
  const created = [];
  checklists.forEach(checklist => {
    if (!cardMap[checklist.cardId]) {
      return; // orphaned checklist: skip
    }
    created.push({ cardId: cardMap[checklist.cardId], title: checklist.title });
  });
  return created;
}

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

// ==========================================================================
// Dangling user references in members
// ==========================================================================
test('member with deleted user account is skipped, not crashing', () => {
  const data = {
    members: [
      { userId: 'user1', isAdmin: true },
      { userId: 'ghost', isAdmin: false }, // account no longer in users
    ],
    users: [{ _id: 'user1', username: 'admin', profile: { fullname: 'Admin' } }],
  };
  const mapped = mapMembers(data);
  assert.strictEqual(mapped.length, 1, 'only the resolvable member is kept');
  assert.strictEqual(mapped[0].id, 'user1');
  assert.strictEqual(mapped[0].username, 'admin');
  assert.strictEqual(mapped[0].fullName, 'Admin');
});

test('valid members are still fully mapped (no false positives)', () => {
  const data = {
    members: [
      { userId: 'user1' },
      { userId: 'user2' },
    ],
    users: [
      { _id: 'user1', username: 'alice', profile: { fullname: 'Alice' } },
      { _id: 'user2', username: 'bob' }, // no profile.fullname
    ],
  };
  const mapped = mapMembers(data, username =>
    username === 'alice' ? { _id: 'local-alice' } : null,
  );
  assert.strictEqual(mapped.length, 2);
  assert.strictEqual(mapped[0].wekanId, 'local-alice', 'matched local user is mapped');
  assert.strictEqual(mapped[1].fullName, undefined, 'missing fullname is tolerated');
  assert.strictEqual(mapped[1].wekanId, undefined, 'unmatched user has no wekanId');
});

test('missing members / users arrays do not crash', () => {
  assert.deepStrictEqual(mapMembers({}), [], 'no members and no users -> empty list');
  assert.deepStrictEqual(
    mapMembers({ members: [{ userId: 'x' }] }),
    [],
    'members present but users array absent -> all dropped, no throw',
  );
});

// ==========================================================================
// Dangling card listId references
// ==========================================================================
test('card pointing at a missing list falls back to the first list', () => {
  const listMap = { list1: 'new-list-1', list2: 'new-list-2' };
  const state = { defaultListId: 'new-list-1' }; // first imported list
  const listId = resolveCardListId({ listId: 'deleted-list' }, listMap, state);
  assert.strictEqual(listId, 'new-list-1', 'dangling listId resolves to default list');
});

test('card keeps its own list when the reference is valid', () => {
  const listMap = { list1: 'new-list-1', list2: 'new-list-2' };
  const state = { defaultListId: 'new-list-1' };
  const listId = resolveCardListId({ listId: 'list2' }, listMap, state);
  assert.strictEqual(listId, 'new-list-2');
});

test('export with no lists at all gets a default list created for its cards', () => {
  const listMap = {};
  const state = { defaultListId: null };
  const a = resolveCardListId({ listId: 'whatever' }, listMap, state);
  const b = resolveCardListId({ listId: 'other' }, listMap, state);
  assert.strictEqual(a, 'default-list-created');
  assert.strictEqual(b, 'default-list-created', 'second card reuses the same default list');
});

// ==========================================================================
// Orphaned sub-objects (checklists referencing missing cards)
// ==========================================================================
test('orphaned checklist (card missing) is skipped', () => {
  const cardMap = { card1: 'new-card-1' };
  const created = importChecklists(
    [
      { cardId: 'card1', title: 'kept' },
      { cardId: 'deleted-card', title: 'orphan' },
    ],
    cardMap,
  );
  assert.strictEqual(created.length, 1);
  assert.strictEqual(created[0].title, 'kept');
  assert.strictEqual(created[0].cardId, 'new-card-1');
});

// ==========================================================================
// Runner — Mocha-compatible when available, standalone otherwise
// ==========================================================================
if (typeof describe === 'function') {
  describe('WekanCreator import of inconsistent board JSON', () => {
    tests.forEach(([name, fn]) => it(name, fn));
  });
} else {
  console.log('====================================');
  console.log('WekanCreator Inconsistent Import Tests');
  console.log('====================================\n');
  let failed = 0;
  tests.forEach(([name, fn]) => {
    try {
      fn();
      console.log(`✓ ${name}`);
    } catch (e) {
      failed++;
      console.log(`✗ ${name}\n    ${e.message}`);
    }
  });
  console.log(`\n${tests.length - failed}/${tests.length} passed`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}
