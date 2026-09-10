'use strict';

// Regression coverage for #4726 "Clone Board without cards".
//
// Cloning a board always copied every card along with the swimlanes, lists,
// labels, custom fields and other structure. This adds an opt-in
// "Without cards" checkbox to the Clone Board popup: when checked, the copy
// still gets its full structure (swimlanes, lists, labels, custom fields,
// settings) but no cards are created on it.
//
// The feature threads a `withoutCards` boolean from the client popup, through
// the `copyBoard` Meteor method, into `Boards.helpers().copy()`, into
// `Swimlanes.helpers().copy()`, down to the one place cards are actually
// copied inside that method's per-list loop. There is no isolated pure
// module for this (the decision is "skip a DB write", not arithmetic), so
// these tests read the source and pin the exact shape of the fix - both that
// it exists, and that the DEFAULT (unchecked) behaviour is unchanged.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const read = (relPath) => fs.readFileSync(path.join(repoRoot, relPath), 'utf8');

const boardsModel = read('models/boards.js');
const swimlanesModel = read('models/swimlanes.js');
const copyBoardMethod = read('server/publications/boards.js');
const boardsListJs = read('client/components/boards/boardsList.js');
const boardsListJade = read('client/components/boards/boardsList.jade');
const enTranslations = JSON.parse(read('imports/i18n/data/en.i18n.json'));

// 1. The i18n key exists in English and says what the checkbox does.
assert.equal(
  enTranslations['clone-board-without-cards'],
  'Without cards',
  'en.i18n.json must carry the "clone-board-without-cards" key used by the checkbox label',
);

// 2. Every locale file has a real (non-empty) value for the key - the
// translation-completeness rule this repo enforces for every new key.
const dataDir = path.join(repoRoot, 'imports/i18n/data');
const localeFiles = fs.readdirSync(dataDir).filter((f) => f.endsWith('.i18n.json'));
assert.ok(localeFiles.length > 200, 'sanity: expected the full locale set to be present');
const missing = [];
for (const file of localeFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
  const value = data['clone-board-without-cards'];
  if (typeof value !== 'string' || value.length === 0) {
    missing.push(file);
  }
}
assert.deepEqual(
  missing,
  [],
  `every locale file must have a non-empty "clone-board-without-cards" value, missing in: ${missing.join(', ')}`,
);

// 3. Boards.helpers().copy() accepts a withoutCards flag, defaulting to
// false so the DEFAULT clone behaviour (checkbox unchecked) is unchanged.
assert.match(
  boardsModel,
  /Boards\.helpers\(\{\s*\n\s*async copy\(withoutCards = false\) \{/,
  'Boards.helpers().copy() must accept withoutCards, defaulting to false',
);

// It must thread that flag into the swimlane copy call, not silently drop it.
assert.match(
  boardsModel,
  /await swimlane\.copy\(_id, null, 'below', '', cardIdMap, withoutCards\);/,
  'Boards.helpers().copy() must pass withoutCards into Swimlanes.helpers().copy()',
);

// 4. Swimlanes.helpers().copy() accepts the same flag...
assert.match(
  swimlanesModel,
  /async copy\(boardId, targetSwimlaneId = null, position = 'below', title = '', cardIdMap = null, withoutCards = false\) \{/,
  'Swimlanes.helpers().copy() must accept withoutCards, defaulting to false',
);

// ...and the per-list card-copy loop (the ONE place cards are actually
// created on the destination board) is skipped when it is set. Pin the
// negative shape too: the loop must be gated, not just decorated with a
// nearby comment.
assert.match(
  swimlanesModel,
  /if \(!withoutCards\) \{\s*\n\s*const cardQuery = \{[\s\S]*?for \(const card of cards\) \{\s*\n\s*await card\.copy\(boardId, newSwimlaneId, newListId, cardIdMap\);\s*\n\s*\}\s*\n\s*\}/,
  'the card-copy loop inside Swimlanes.helpers().copy() must be skipped when withoutCards is set',
);

// Negative: nowhere else in the same file does another, unguarded
// `card.copy(` call sneak the cards back in (e.g. a second insertion point
// this fix forgot to gate).
const cardCopyCallSites = swimlanesModel
  .split('\n')
  .filter((line) => line.includes('card.copy(') && !line.trim().startsWith('//'));
assert.equal(
  cardCopyCallSites.length,
  1,
  'models/swimlanes.js must have exactly one (non-comment) card.copy( call site, and it must be the gated one',
);

// 5. The Meteor method strips withoutCards out of the properties object (so
// it is never assigned onto the board document as a stray field) and passes
// it through to board.copy().
assert.match(
  copyBoardMethod,
  /const \{ members, permission, withoutCards, \.\.\.safeProperties \} = properties;/,
  'copyBoard must destructure withoutCards out of the caller-supplied properties',
);
assert.match(
  copyBoardMethod,
  /return board\.copy\(!!withoutCards\);/,
  'copyBoard must call board.copy() with the withoutCards flag coerced to a boolean',
);

// 6. The client popup has the checkbox and reads it into the Meteor call.
assert.match(
  boardsListJade,
  /template\(name="cloneBoardPopup"\)[\s\S]*input\.js-clone-board-without-cards\(type="checkbox"\)/,
  'boardsList.jade must define the cloneBoardPopup template with a .js-clone-board-without-cards checkbox',
);
assert.match(
  boardsListJs,
  /const withoutCards = evt\.currentTarget\s*\n?\s*\.querySelector\('\.js-clone-board-without-cards'\)\.checked;/,
  'the cloneBoardPopup submit handler must read the checkbox state',
);
assert.match(
  boardsListJs,
  /Meteor\.call\(\s*\n\s*'copyBoard',\s*\n\s*boardId,\s*\n\s*\{[\s\S]*?withoutCards,/,
  'the cloneBoardPopup submit handler must pass withoutCards into the copyBoard call',
);

console.log('cloneBoardWithoutCards.test.cjs: all assertions passed');
