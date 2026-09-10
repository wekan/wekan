'use strict';

// Regression coverage for GitHub issue #2719 "when moving a card to a
// different board/list, offer a checkbox to also leave a LINKED card behind
// at the card's original location".
//
// This is a combination of two mechanisms WeKan already has: card.move()
// (models/cards.js) and card.link() (the same linked-card mirror mechanism
// #4281's "Link to board" action already wired up to the card menu). The
// fix adds an opt-in checkbox to the EXISTING Move card popup
// (moveCardPopup, client/components/cards/cardDetails.jade) so that, when
// checked, a linked-card mirror is created at the card's ORIGINAL
// board/swimlane/list once the move itself has completed - reusing
// card.link() rather than inventing a new linking mechanism. Unchecked (the
// default), nothing changes from today's plain move.
//
// There is no isolated pure module for the popup wiring (it is UI glue over
// two existing model methods), so these tests read the source and pin the
// exact shape of the fix, the same approach tests/linkCardToBoard4281.test.cjs
// uses for the sibling feature.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const read = (relPath) => fs.readFileSync(path.join(repoRoot, relPath), 'utf8');

const cardsModel = read('models/cards.js');
const cardDetailsJs = read('client/components/cards/cardDetails.js');
const cardDetailsJade = read('client/components/cards/cardDetails.jade');
const enTranslations = JSON.parse(read('imports/i18n/data/en.i18n.json'));

// --- 1. The Move card popup markup has the new checkbox --------------------
assert.match(
  cardDetailsJade,
  /template\(name="moveCardPopup"\)[\s\S]*?\+cardDestinationPicker\(dialog=dialog\)\s*\n\s*div\s*\n\s*input#js-leave-link-at-origin\(type="checkbox"\)\s*\n\s*label\(for='js-leave-link-at-origin'\) \{\{_ 'moveCardPopup-leave-link-at-origin'\}\}/,
  'moveCardPopup must have a js-leave-link-at-origin checkbox after the destination picker',
);

// The checkbox must NOT have been added to copyCardPopup/linkCardToBoardPopup
// /convertChecklistItemToCardPopup - this is additive UI on Move card only.
const copyCardTemplate = cardDetailsJade.match(/template\(name="copyCardPopup"\)[\s\S]*?(?=\ntemplate\()/);
assert.ok(copyCardTemplate, 'copyCardPopup template must exist');
assert.doesNotMatch(
  copyCardTemplate[0],
  /js-leave-link-at-origin/,
  'the leave-a-link checkbox is specific to Move card, not Copy card',
);

// --- 2. The move popup's setDone reads the checkbox and calls card.link() --
// --- with the ORIGINAL location, AFTER the move has been performed ---------
const dialogMatch = cardDetailsJs.match(
  /Template\.moveCardPopup\.onCreated\(function \(\) \{[\s\S]*?\n\}\);\nregisterCardDialogTemplate\('moveCardPopup'\);/,
);
assert.ok(dialogMatch, 'Template.moveCardPopup.onCreated(...) must exist and be registered via registerCardDialogTemplate');
const dialogBody = dialogMatch[0];

assert.match(
  dialogBody,
  /const leaveLinkAtOrigin = tpl\.\$\('#js-leave-link-at-origin'\)\.is\(':checked'\)/,
  'setDone must read the checkbox state',
);

// The original location must be captured from the card BEFORE card.move()
// mutates it.
const captureIdx = dialogBody.indexOf('const originalBoardId = card.boardId;');
const moveIdx = dialogBody.indexOf('await card.move(');
const linkIdx = dialogBody.indexOf('card.link(originalBoardId, originalSwimlaneId, originalListId)');
assert.ok(captureIdx !== -1, 'original board/swimlane/list must be captured from the card');
assert.ok(moveIdx !== -1, 'the popup must still call card.move()');
assert.ok(linkIdx !== -1, 'the popup must call card.link() with the captured original location');
assert.ok(
  captureIdx < moveIdx && moveIdx < linkIdx,
  'the original location must be captured BEFORE the move, and the link created AFTER the move',
);

assert.match(
  dialogBody,
  /if \(leaveLinkAtOrigin\) \{\s*\n\s*const linkCardId = await card\.link\(originalBoardId, originalSwimlaneId, originalListId\);/,
  'the linked mirror must only be created when the checkbox is checked',
);

// --- 3. Negative: when unchecked, plain move behavior is unchanged ---------
// card.move() and card.setTitle() must run unconditionally (outside any
// leaveLinkAtOrigin guard) so the default (unchecked) path is untouched.
const moveCallLine = dialogBody.split('\n').find((l) => l.includes('await card.move('));
assert.ok(moveCallLine, 'card.move() call must exist');
assert.doesNotMatch(
  moveCallLine,
  /leaveLinkAtOrigin/,
  'card.move() must run regardless of the leaveLinkAtOrigin checkbox',
);
assert.match(
  dialogBody,
  /if \(leaveLinkAtOrigin\) \{\s*\n\s*const linkCardId = await card\.link\([\s\S]*?\n\s*\}\s*\n\s*\},/,
  'the link-creation block must be self-contained and gated only on the checkbox',
);

// --- 4. The existing linked-card primitive itself is untouched -------------
assert.match(
  cardsModel,
  /async link\(boardId, swimlaneId, listId\) \{[\s\S]{0,400}?type = 'cardType-linkedCard';[\s\S]{0,200}?return await Cards\.insertAsync\(linkCard\);\s*\},/,
  'Cards.helpers().link(boardId, swimlaneId, listId) must still create a cardType-linkedCard mirror',
);

// --- 5. i18n: the key exists in English and in every locale file -----------
assert.equal(
  enTranslations['moveCardPopup-leave-link-at-origin'],
  'Leave a link at the original location',
  "en.i18n.json must carry the 'moveCardPopup-leave-link-at-origin' key",
);

const i18nDir = path.join(repoRoot, 'imports/i18n/data');
const localeFiles = fs.readdirSync(i18nDir).filter((f) => f.endsWith('.i18n.json'));
const missing = [];
const englishLeftovers = [];
for (const file of localeFiles) {
  if (file === 'en.i18n.json') continue;
  const data = JSON.parse(fs.readFileSync(path.join(i18nDir, file), 'utf8'));
  const value = data['moveCardPopup-leave-link-at-origin'];
  if (typeof value !== 'string' || value.length === 0) {
    missing.push(file);
    continue;
  }
  if (value === 'Leave a link at the original location' && !file.startsWith('en')) {
    englishLeftovers.push(file);
  }
}
assert.deepStrictEqual(missing, [], 'every locale file must have a non-empty moveCardPopup-leave-link-at-origin value');
assert.deepStrictEqual(
  englishLeftovers,
  [],
  `no non-English locale may keep the untranslated English string: ${englishLeftovers.join(', ')}`,
);

// --- 6. The key sits in the same relative position in every locale file ----
// (right after "moveCardPopup-title", which every locale file already has).
const enKeys = Object.keys(JSON.parse(read('imports/i18n/data/en.i18n.json')));
const enIndex = enKeys.indexOf('moveCardPopup-leave-link-at-origin');
assert.ok(enIndex > 0, 'the key is present in en.i18n.json');
assert.equal(enKeys[enIndex - 1], 'moveCardPopup-title', 'the key must sit directly after moveCardPopup-title in en.i18n.json');

for (const file of localeFiles) {
  const keys = Object.keys(JSON.parse(fs.readFileSync(path.join(i18nDir, file), 'utf8')));
  const idx = keys.indexOf('moveCardPopup-leave-link-at-origin');
  assert.notEqual(idx, -1, `${file}: missing moveCardPopup-leave-link-at-origin`);
  assert.equal(
    keys[idx - 1],
    'moveCardPopup-title',
    `${file}: moveCardPopup-leave-link-at-origin must sit directly after moveCardPopup-title`,
  );
}

console.log('moveCardLeaveLinkAtOrigin2719: all tests passed');
