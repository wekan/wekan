'use strict';

// GHSA-jvv9-498p-hxrg — "Cross-board card parentId causes the board publication
// to over-publish private ancestor cards" (Moderate, CWE-200 / CWE-862),
// reported by Alpastx.
//
// A card's `parentId` may name a card on ANOTHER board, and setting it was
// authorized only against the CHILD board's write ACL. The board publication
// then walked the whole ancestor chain (it renders a subtask's full path, #3453)
// and published the complete ancestor card documents to every subscriber of the
// child board — with no check that any of them may see the parent's board. So
// anyone who could write on board B and knew a card id on private board A could
// bridge A's cards, descriptions and custom fields into B's DDP feed.
//
// Fixed at both ends: the WRITE refuses a parent whose board the actor cannot
// see (REST create, REST update, and the DDP deny rule), and the PUBLICATION
// sends only the ancestors whose board the subscriber may see.
//
// Run: node tests/crossBoardParentCardLeak.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const publication = read('server/publications/boards.js');
const cardPermissions = read('server/permissions/cards.js');
const restCards = read('server/models/cards.js');
const visibleBoards = read('server/lib/visibleBoardIds.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --------------------------------------------------------- the publish side

test('the ancestor cursor filters by the boards the subscriber may see', () => {
  const cursor = publication.match(/\/\/ Parent cards \(for subtasks\)[\s\S]*?\n      \},/);
  assert.ok(cursor, 'the parent-cards child cursor is found');
  const body = cursor[0];

  assert.ok(/visibleBoardIds\(thisUserId, ancestorBoardIds\)/.test(body),
    'it asks which ancestor boards this subscriber may see');
  assert.ok(/allowedBoardIds\.add\(board\._id\)/.test(body),
    "the board being published is its own answer — its cards need no second decision");
  assert.ok(/filter\(c => allowedBoardIds\.has\(c\.boardId\)\)/.test(body),
    'ancestors on other boards are filtered out');
});

test('negative: the unfiltered publish of every ancestor is gone', () => {
  const cursor = publication.match(/\/\/ Parent cards \(for subtasks\)[\s\S]*?\n      \},/)[0];
  assert.ok(
    !/getCards\(\{ _id: \{ \$in: ancestorIds \} \}, \{\}, true\)/.test(cursor),
    'publishing the raw ancestorIds is exactly what leaked the private cards',
  );
  // The full documents that DO go out are the filtered set.
  assert.ok(/getCards\(\{ _id: \{ \$in: allowedAncestorIds \} \}, \{\}, true\)/.test(cursor));
});

test('an empty result publishes nothing rather than falling through', () => {
  const cursor = publication.match(/\/\/ Parent cards \(for subtasks\)[\s\S]*?\n      \},/)[0];
  assert.ok(/if \(ancestorIds\.length === 0\) return null;/.test(cursor));
  assert.ok(/if \(allowedAncestorIds\.length === 0\) return null;/.test(cursor));
});

// ----------------------------------------------------------- the write side

test('the visibility question is asked with the shared board selectors', () => {
  assert.ok(/boardVisibilitySelectors\(\{/.test(visibleBoards),
    'visibleBoardIds uses the same selectors as the publication and All Boards');
  assert.ok(/isActive/.test(read('models/lib/boardVisibilitySelectors.js')),
    'which means a revoked share does not grant visibility here either');
});

test('a parent card that does not exist is refused, not silently accepted', () => {
  assert.ok(/if \(!parent\) \{[\s\S]*?NotFound[\s\S]*?statusCode = 404/.test(visibleBoards));
  assert.ok(/if \(!parent\) return false;/.test(cardPermissions),
    'the deny rule treats a missing parent as not visible');
});

test('an invisible parent board is a 403, not a 500', () => {
  assert.ok(/Forbidden/.test(visibleBoards));
  assert.ok(/statusCode = 403/.test(visibleBoards));
});

test('the DDP deny rule refuses a parentId on an invisible board', () => {
  assert.ok(/export async function denyInvisibleParentCard/.test(cardPermissions));
  assert.ok(/denyInvisibleParentCard\(userId, modifier\)/.test(cardPermissions),
    'the update deny rule calls it');
  assert.ok(/canUserSeeParentCard\(userId, doc\.parentId\)/.test(cardPermissions),
    'and insert is covered too — a card can be created with a parent already set');
});

test('negative: clearing or omitting a parent is still allowed', () => {
  const deny = cardPermissions.match(/export async function denyInvisibleParentCard[\s\S]*?\n\}/)[0];
  assert.ok(/if \(typeof parentId !== 'string' \|\| !parentId\) return false;/.test(deny),
    'no parentId in the modifier means nothing to refuse');
  assert.ok(/if \(!set\) return false;/.test(deny), 'a modifier without $set is not a parent change');
});

test('negative: the pre-existing cross-board MOVE deny is still enforced', () => {
  // GHSA-gm7v-pc38-53jr — the same rule one field over. Adding the parentId
  // check must not have replaced it.
  assert.ok(/denyCrossBoardMove\(userId, modifier\)/.test(cardPermissions));
});

test('both REST paths that set a parent check it first', () => {
  assert.ok(/assertParentCardIsVisible\(req\.userId, paramParentId\)/.test(restCards),
    'card create');
  assert.ok(/assertParentCardIsVisible\(req\.userId, req\.body\.parentId\)/.test(restCards),
    'card update — the PUT the advisory used');

  // The check must come BEFORE the write it guards.
  const put = restCards.match(/if \(req\.body\.parentId\) \{[\s\S]*?updated = true;\n    \}/)[0];
  const checkAt = put.indexOf('assertParentCardIsVisible');
  const writeAt = put.indexOf('updateAsync');
  assert.ok(checkAt > -1 && writeAt > -1 && checkAt < writeAt,
    'the parent is validated before the update runs');
});

test('the linked-card read check it was modelled on is still there', () => {
  // The advisory pointed at this as the precedent: linking across boards
  // already required read access to the source card's board.
  assert.ok(/checkBoardAccess\(req\.userId, sourceCard\.boardId\)/.test(restCards));
});

console.log(`\n${passed} tests passed`);
