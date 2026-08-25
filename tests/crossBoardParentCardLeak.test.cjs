'use strict';

// ParentBleed — GHSA-jvv9-498p-hxrg, "Cross-board card parentId causes the board
// publication to over-publish private ancestor cards" (Moderate, CWE-200 /
// CWE-862), reported by Alpastx. https://wekan.fi/hall-of-fame/parentbleed/
//
// Also guards BoardBleed's cross-board move deny (see the bottom of this file).
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

test('negative: BoardBleed\'s cross-board MOVE deny is still enforced', () => {
  // BoardBleed (CVE-2026-55234, GHSA-gm7v-pc38-53jr) is the same rule one field
  // over: the allow rule checked write access on the card's SOURCE board only,
  // so a client could $set a new boardId and inject content into a private board
  // it cannot even read. Adding the parentId check must not have displaced it -
  // and it covered Cards, Lists and Swimlanes alike.
  assert.ok(/denyCrossBoardMove\(userId, modifier\)/.test(cardPermissions),
    'Cards keeps its BoardBleed deny');
  ['lists', 'swimlanes'].forEach(collection => {
    const src = read(`server/permissions/${collection}.js`);
    assert.ok(/\.deny\(\{/.test(src), `${collection} keeps its BoardBleed deny rule`);
    assert.ok(/denyCrossBoardMove/.test(src), `${collection} still calls the shared move guard`);
  });
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

// ------------------------------------------------ the same hole, linked cursors
//
// The advisory named the ancestor cursor. The LINKED-CARD cursors beside it had
// the identical bug and a wider blast radius: they published the linked card,
// its comments, its attachments, its checklists AND its checklist items, from
// whatever board the linked card lives on, to every subscriber of this board.
// A `cardType-linkedCard` names a card by id exactly as `parentId` does.

test('all linked-card content and metadata cursors filter by visible boards', () => {
  const calls = publication.match(/const linkedCardIds = await visibleLinkedCardIds\(board\);/g) || [];
  assert.strictEqual(calls.length, 10,
    'card content plus source metadata, subtasks and dependencies — all ten');
});

test('the shared helper asks the same visibility question as the ancestor cursor', () => {
  const helper = publication.match(/const visibleLinkedCardIds = board => \{[\s\S]*?\n  \};/);
  assert.ok(helper, 'the helper exists');
  const body = helper[0];
  assert.ok(/visibleBoardIds\(thisUserId, linkedBoardIds\)/.test(body));
  assert.ok(/allowedBoardIds\.add\(board\._id\)/.test(body),
    'cards on THIS board are their own answer');
  assert.ok(/filter\(c => allowedBoardIds\.has\(c\.boardId\)\)/.test(body));
});

test('negative: no cursor publishes the raw linkedId list any more', () => {
  // This is the shape that leaked: ids straight off this board's cards, with
  // nothing asked about the boards they point at.
  assert.ok(
    !/getCards\(\{ _id: \{ \$in: linkedCardIds \}, archived: isArchived \}, \{\}, true\)[\s\S]{0,80}?linkedCardIds = cards/.test(publication),
    'no cursor may build linkedCardIds itself and publish them unfiltered',
  );
  const selfBuilt = publication.match(/const linkedCardIds = cards\.filter\(/g) || [];
  assert.strictEqual(selfBuilt.length, 0,
    'the duplicated preambles are gone; there is one helper and it checks');
});

test('#1942: an unauthorized source stays private while its link snapshot remains usable', () => {
  const cardsModel = read('models/cards.js');
  assert.ok(/getRealCard\(\) \{[\s\S]*ReactiveCache\.getCard\(this\.linkedId\) \|\| this;/.test(cardsModel),
    'a missing private source falls back to the linked-card snapshot');
  assert.ok(/visibleBoardIds\(thisUserId, linkedBoardIds\)/.test(publication),
    'the fallback must not publish the unauthorized source board');
});

test('the assigned-only member restriction survived the de-duplication', () => {
  // Members marked isNormalAssignedOnly / isCommentAssignedOnly /
  // isReadAssignedOnly only see cards they are assigned to. That narrowing used
  // to be repeated in each cursor; it must still be applied inside the helper.
  const helper = publication.match(/const cardScopeFor = board => \{[\s\S]*?\n  \};/)[0];
  assert.ok(/isNormalAssignedOnly \|\| member\.isCommentAssignedOnly \|\| member\.isReadAssignedOnly/.test(helper));
  assert.ok(/cardSelector\.assignees = \{ \$in: \[thisUserId\] \}/.test(helper));
});

test('deduplication is scoped to one parent evaluation, never a TTL or board id', () => {
  assert.ok(/const cardIndexByParent = new WeakMap\(\)/.test(publication));
  assert.ok(/const visibleLinkedByParent = new WeakMap\(\)/.test(publication));
  assert.ok(/cardIndexByParent\.get\(board\)/.test(publication));
  assert.ok(/visibleLinkedByParent\.get\(board\)/.test(publication));
  assert.ok(!/CARD_INDEX_TTL|Date\.now\(\)/.test(publication),
    'authorization must never be reused by wall-clock age');
  assert.ok(!/_linkedIdsByBoard/.test(publication),
    'a board-id cache would survive a parent rerun and become stale');
});

test('linked and parent discovery use two narrow indexed queries', () => {
  const helper = publication.match(/const boardCardIndex = board => \{[\s\S]*?\n  \};/)[0];
  assert.ok(/type: 'cardType-linkedCard'/.test(helper));
  assert.ok(/parentId: \{ \$exists: true, \$ne: null \}/.test(helper));
  assert.ok(/fields: \{ _id: 1, linkedId: 1 \}/.test(helper));
  assert.ok(/fields: \{ _id: 1, parentId: 1 \}/.test(helper));
  assert.ok(/Promise\.all/.test(helper));
});

// ------------------------------------------- no hand-written visibility copies

test('every board-visibility selector in the publication comes from the builder', () => {
  // RevokeBleed was one hand-written copy disagreeing with another. There were
  // three more copies in this file, all correct at the time — and that is
  // exactly the state the broken one was in before it drifted.
  const copies = publication.match(/\{ orgs: \{ \$elemMatch: \{ orgId: \{ \$in: user\.orgIds\(\) \}/g) || [];
  assert.strictEqual(copies.length, 0, 'no hand-written visibility array remains');
  const builders = publication.match(/boardVisibilitySelectors\(\{/g) || [];
  assert.ok(builders.length >= 4, `every selector uses the builder, found ${builders.length}`);
});

console.log(`\n${passed} tests passed`);
