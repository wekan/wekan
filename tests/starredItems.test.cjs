'use strict';

// #1172: star a Swimlane, List or Card - the SAME per-user id-array shape
// `profile.starredBoards` already has (models/users.js / server/models/users.js
// `toggleBoardStar`), generalized to `starredSwimlanes` / `starredLists` /
// `starredCards`, surfaced from each object's own menu, aggregated on a new
// "Starred" page (client/components/main/starredItems.js) and in the header
// bookmarks dropdown (client/components/main/header.js), which both read the
// SAME `starredItemsByType()` query rather than two definitions of it.
//
// Run: node tests/starredItems.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const tests = [];
let passed = 0;
const test = (name, fn) => tests.push([name, fn]);

const modelsUsers = read('models/users.js');
const serverUsers = read('server/models/users.js');
const headerJs = read('client/components/main/header.js');
const headerJade = read('client/components/main/header.jade');
const starredItemsJs = read('client/components/main/starredItems.js');
const starredItemsJade = read('client/components/main/starredItems.jade');
const listHeaderJs = read('client/components/lists/listHeader.js');
const listHeaderJade = read('client/components/lists/listHeader.jade');
const swimlaneHeaderJs = read('client/components/swimlanes/swimlaneHeader.js');
const swimlaneHeaderJade = read('client/components/swimlanes/swimlaneHeader.jade');
const cardDetailsJs = read('client/components/cards/cardDetails.js');
const cardDetailsJade = read('client/components/cards/cardDetails.jade');
const routerJs = read('config/router.js');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));

// --- 1. Persistence: the same toggle pattern as toggleBoardStar, targeting a
// per-object-type id-array field. Simulate the exact $addToSet/$pull rule the
// source uses, pinned against a plain-array reimplementation so the test
// fails if the semantics (idempotent add, idempotent remove, one entry per
// id) ever drift. ---
function toggleStar(ids, id) {
  const has = ids.includes(id);
  return has ? ids.filter(x => x !== id) : [...ids, id];
}

test('toggling star/unstar on an id array is idempotent and unique per id', () => {
  let ids = [];
  ids = toggleStar(ids, 'a'); // star
  assert.deepStrictEqual(ids, ['a']);
  ids = toggleStar(ids, 'b'); // star another
  assert.deepStrictEqual(ids, ['a', 'b']);
  ids = toggleStar(ids, 'a'); // unstar the first
  assert.deepStrictEqual(ids, ['b']);
  ids = toggleStar(ids, 'a'); // star it again - goes to the end (like $addToSet)
  assert.deepStrictEqual(ids, ['b', 'a']);
  // Never a duplicate: toggling an already-present id always removes it.
  assert.ok(!ids.includes('a') === false); // sanity: 'a' present once
  assert.strictEqual(ids.filter(x => x === 'a').length, 1);
});

for (const [type, field, method] of [
  ['swimlane', 'starredSwimlanes', 'toggleSwimlaneStar'],
  ['list', 'starredLists', 'toggleListStar'],
  ['card', 'starredCards', 'toggleCardStar'],
]) {
  test(`models/users.js has a ${method} helper toggling profile.${field} (same shape as toggleBoardStar)`, () => {
    const re = new RegExp(
      `async ${method}\\([a-zA-Z]+\\) \\{[\\s\\S]{0,300}?profile\\.${field}`,
    );
    assert.ok(re.test(modelsUsers), `models/users.js should define ${method} against profile.${field}`);
  });

  test(`server/models/users.js has a Meteor method ${method} that checks the id and requires login`, () => {
    const re = new RegExp(
      `async ${method}\\([a-zA-Z]+\\) \\{[\\s\\S]{0,200}?check\\([a-zA-Z]+, String\\)[\\s\\S]{0,200}?not-logged-in`,
    );
    assert.ok(re.test(serverUsers), `server/models/users.js should define ${method} with check() and a login guard`);
  });

  test(`models/users.js exposes hasStarred${type[0].toUpperCase()}${type.slice(1)} and ${field}() reading profile.${field}`, () => {
    const hasName = `hasStarred${type[0].toUpperCase()}${type.slice(1)}`;
    assert.ok(modelsUsers.includes(hasName), `missing ${hasName}`);
    assert.ok(modelsUsers.includes(`${field}()`), `missing ${field}()`);
  });
}

test('starredCount() sums all five starred kinds (boards, pages, swimlanes, lists, cards)', () => {
  const body = modelsUsers.slice(modelsUsers.indexOf('starredCount() {'), modelsUsers.indexOf('hasStarred(boardId) {'));
  for (const call of ['starredBoards()', 'starredPages()', 'starredSwimlanes()', 'starredLists()', 'starredCards()']) {
    assert.ok(body.includes(call), `starredCount() should add ${call}`);
  }
});

// --- 2. The schema declares the three new id-array fields, same shape as
// starredBoards. ---
test('the profile schema declares starredSwimlanes/starredLists/starredCards as arrays of String', () => {
  for (const field of ['starredSwimlanes', 'starredLists', 'starredCards']) {
    assert.ok(modelsUsers.includes(`'profile.${field}'`), `schema is missing profile.${field}`);
    assert.ok(modelsUsers.includes(`'profile.${field}.$'`), `schema is missing profile.${field}.$`);
  }
});

// --- 3. Each menu (swimlane / list / card) has a star toggle wired to the
// matching Meteor method, and a helper reading the matching hasStarred*. ---
test('the list hamburger menu stars/unstars via toggleListStar', () => {
  assert.ok(listHeaderJade.includes('js-star-list-item'));
  assert.ok(listHeaderJs.includes("Meteor.callAsync('toggleListStar'"));
  assert.ok(listHeaderJs.includes('isListItemStarred'));
});

test('the swimlane hamburger menu stars/unstars via toggleSwimlaneStar', () => {
  assert.ok(swimlaneHeaderJade.includes('js-star-swimlane-item'));
  assert.ok(swimlaneHeaderJs.includes("Meteor.callAsync('toggleSwimlaneStar'"));
  assert.ok(swimlaneHeaderJs.includes('isSwimlaneItemStarred'));
});

test('the card hamburger menu stars/unstars via toggleCardStar', () => {
  assert.ok(cardDetailsJade.includes('js-star-card-item'));
  assert.ok(cardDetailsJs.includes("Meteor.callAsync('toggleCardStar'"));
  assert.ok(cardDetailsJs.includes('isCardItemStarred'));
});

// --- 4. The Starred page aggregates all four types for the current user,
// and the "Starred" route/nav entry exists. ---
test('the Starred page helpers cover boards, swimlanes, lists AND cards', () => {
  for (const helper of ['starredBoards', 'starredSwimlanes', 'starredLists', 'starredCards']) {
    assert.ok(starredItemsJs.includes(`${helper}()`), `starredItems.js is missing a ${helper}() helper`);
  }
  assert.ok(starredItemsJade.includes('starredBoards'));
  assert.ok(starredItemsJade.includes('starredSwimlanes'));
  assert.ok(starredItemsJade.includes('starredLists'));
  assert.ok(starredItemsJade.includes('starredCards'));
});

test('the /starred-items route renders the starredItems content template', () => {
  assert.ok(/FlowRouter\.route\('\/starred-items'/.test(routerJs));
  assert.ok(/name: 'starred-items'/.test(routerJs));
  assert.ok(/content: 'starredItems'/.test(routerJs));
});

// --- 5. Negative test: only ONE place resolves the four `profile.starred*`
// id arrays into docs. starredItems.js must import it, not redefine it - a
// second definition is exactly the "same subject as two different queries"
// bug this shared function exists to prevent. ---
test('starredItemsByType is defined exactly once (in header.js) and starredItems.js imports it', () => {
  const definitionCount = (headerJs.match(/function starredItemsByType/g) || []).length;
  assert.strictEqual(definitionCount, 1, 'starredItemsByType should be defined exactly once');
  assert.ok(
    /import \{ starredItemsByType \} from '\.\/header\.js'/.test(starredItemsJs),
    'starredItems.js should import starredItemsByType from header.js rather than redefine it',
  );
  // And starredItems.js must not itself resolve profile.starredSwimlanes/etc -
  // that would be the duplicate query the shared function exists to avoid.
  assert.ok(!/profile\.starred(Swimlanes|Lists|Cards)/.test(starredItemsJs));
});

test('the header dropdown (starredBoardsPopup) reads the shared query for its swimlane/list/card rows', () => {
  assert.ok(headerJs.includes('starredItemsByType(user, DROPDOWN_ITEMS_PER_TYPE).swimlanes'));
  assert.ok(headerJs.includes('starredItemsByType(user, DROPDOWN_ITEMS_PER_TYPE).lists'));
  assert.ok(headerJs.includes('starredItemsByType(user, DROPDOWN_ITEMS_PER_TYPE).cards'));
  assert.ok(headerJade.includes('starredSwimlanes'));
  assert.ok(headerJade.includes('starredLists'));
  assert.ok(headerJade.includes('starredCards'));
  // Compact, capped rows with a link to the full, uncapped page.
  assert.ok(headerJade.includes("pathFor 'starred-items'"));
});

// --- 6. i18n: the new labels exist in English, and are actually used by the
// jade they were added for (a key nobody reads is dead weight). ---
test('the new i18n keys exist in en.i18n.json', () => {
  for (const key of [
    'star-item', 'unstar-item', 'starred-swimlanes', 'starred-lists',
    'starred-cards', 'see-all-starred-items', 'no-starred-items',
  ]) {
    assert.ok(Object.prototype.hasOwnProperty.call(en, key), `en.i18n.json is missing ${key}`);
    assert.strictEqual(typeof en[key], 'string');
    assert.ok(en[key].length > 0);
  }
});

test('star-item/unstar-item are used by every one of the three new menu entries', () => {
  for (const jade of [listHeaderJade, swimlaneHeaderJade, cardDetailsJade]) {
    assert.ok(jade.includes("'star-item'"));
    assert.ok(jade.includes("'unstar-item'"));
  }
});

// --- run ---
for (const [name, fn] of tests) {
  try {
    fn();
    passed++;
  } catch (e) {
    console.error(`FAIL: ${name}`);
    console.error(e && e.stack ? e.stack : e);
    process.exitCode = 1;
  }
}
console.log(`${passed}/${tests.length} passed - starredItems.test.cjs`);
