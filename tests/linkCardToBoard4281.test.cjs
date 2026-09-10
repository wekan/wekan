'use strict';

// Regression coverage for #4281 "Feature Request: Link selected card to a
// chosen board".
//
// WeKan already had the linked-card data model (Cards.helpers().link(),
// `type: 'cardType-linkedCard'`, `linkedId`, isLinkedCard()/getRealCard())
// and a reusable board/swimlane/list picker (cardDestinationPicker, used by
// Move card / Copy card). What was missing was a menu entry, reachable from
// the card's hamburger/action menu, that lets a user pick a DIFFERENT,
// EXISTING board and create a linked-card mirror of the CURRENT card on it -
// distinct from #4495 "create board from card" (which creates a NEW board)
// and from the plain "Copy link to clipboard" permalink action (which copies
// a URL, not a card record).
//
// This adds a "Link to board" action next to "Move card"/"Copy card" in
// cardDetailsActionsPopup, backed by a new `linkCardToBoardPopup` template
// that reuses `cardDestinationPicker` and calls the EXISTING
// `card.link(boardId, swimlaneId, listId)` method - no new linking data
// model is introduced. There is no isolated pure module for the popup wiring
// (it is UI glue over an existing model method), so these tests read the
// source and pin the exact shape of the fix.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const read = (relPath) => fs.readFileSync(path.join(repoRoot, relPath), 'utf8');

const cardsModel = read('models/cards.js');
const cardDetailsJs = read('client/components/cards/cardDetails.js');
const cardDetailsJade = read('client/components/cards/cardDetails.jade');
const enTranslations = JSON.parse(read('imports/i18n/data/en.i18n.json'));

// --- 1. The existing linked-card primitive is still there, untouched -----
assert.match(
  cardsModel,
  /async link\(boardId, swimlaneId, listId\) \{[\s\S]{0,400}?type = 'cardType-linkedCard';[\s\S]{0,200}?return await Cards\.insertAsync\(linkCard\);\s*\},/,
  'Cards.helpers().link(boardId, swimlaneId, listId) must still create a cardType-linkedCard mirror',
);

// --- 2. The card hamburger menu has a "Link to board" entry ---------------
assert.match(
  cardDetailsJade,
  /a\.js-link-card-to-board\s*\n\s*i\.fa\.fa-link\s*\n\s*\| \{\{_ 'linkCardToBoardPopup-title'\}\}/,
  'cardDetails.jade must have a js-link-card-to-board menu item using the linkCardToBoardPopup-title key',
);

// It appears in both the canModifyCard and the read-only/worker menu copies
// of the popup (cardDetailsActionsPopup renders the actions twice, once per
// permission branch), same as js-copy-card.
const menuOccurrences = (cardDetailsJade.match(/a\.js-link-card-to-board\n/g) || []).length;
const copyCardOccurrences = (cardDetailsJade.match(/a\.js-copy-card\n/g) || []).length;
assert.equal(
  menuOccurrences,
  copyCardOccurrences,
  'the link-to-board entry must appear in the menu exactly as many times as Copy card does',
);

// --- 3. The popup template reuses the existing board/swimlane/list picker -
assert.match(
  cardDetailsJade,
  /template\(name="linkCardToBoardPopup"\)\s*\n\s*\+cardDestinationPicker\(dialog=dialog\)/,
  'linkCardToBoardPopup must reuse +cardDestinationPicker, the same picker Move/Copy card use',
);

// --- 4. The click handler opens the popup, and the popup calls .link(), ---
// --- not .move()/.copyCard() - the original card must never be mutated ----
assert.match(
  cardDetailsJs,
  /'click \.js-link-card-to-board': Popup\.open\('linkCardToBoard'\),/,
  'clicking js-link-card-to-board must open the linkCardToBoard popup',
);

const dialogMatch = cardDetailsJs.match(
  /Template\.linkCardToBoardPopup\.onCreated\(function \(\) \{[\s\S]*?\n\}\);\nregisterCardDialogTemplate\('linkCardToBoardPopup'\);/,
);
assert.ok(dialogMatch, 'Template.linkCardToBoardPopup.onCreated(...) must exist and be registered via registerCardDialogTemplate');
const dialogBody = dialogMatch[0];

assert.match(
  dialogBody,
  /await card\.link\(options\.boardId, options\.swimlaneId, options\.listId\)/,
  'the popup must call the EXISTING card.link() method with the chosen board/swimlane/list',
);
assert.doesNotMatch(
  dialogBody,
  /card\.move\(/,
  'linking must never move (mutate the placement of) the ORIGINAL card',
);
assert.doesNotMatch(
  dialogBody,
  /Meteor\.callAsync\('copyCard'/,
  'linking must not go through the copy-card path - it creates a linked mirror, not a duplicate',
);

// newCard.move(...) (positioning the freshly-inserted MIRROR, not the
// original card) is fine and mirrors what Move/Copy already do.
assert.match(dialogBody, /await newCard\.move\(/, 'the newly linked card should still be positioned like Move/Copy do');

// --- 5. i18n: the key exists in English and in every locale file ----------
assert.equal(
  enTranslations['linkCardToBoardPopup-title'],
  'Link to board',
  "en.i18n.json must carry the 'linkCardToBoardPopup-title' key",
);

const i18nDir = path.join(repoRoot, 'imports/i18n/data');
const localeFiles = fs.readdirSync(i18nDir).filter((f) => f.endsWith('.i18n.json'));
const missing = [];
const englishLeftovers = [];
for (const file of localeFiles) {
  if (file === 'en.i18n.json') continue;
  const data = JSON.parse(fs.readFileSync(path.join(i18nDir, file), 'utf8'));
  const value = data['linkCardToBoardPopup-title'];
  if (typeof value !== 'string' || value.length === 0) {
    missing.push(file);
    continue;
  }
  if (value === 'Link to board' && !file.startsWith('en')) {
    englishLeftovers.push(file);
  }
}
assert.deepStrictEqual(missing, [], 'every locale file must have a non-empty linkCardToBoardPopup-title value');
// A handful of very small/rare locales may legitimately coincide with the
// English wording; this is a sanity ceiling, not an exact-zero requirement.
assert.ok(
  englishLeftovers.length < 5,
  `too many locales left with the untranslated English string: ${englishLeftovers.join(', ')}`,
);

// --- 6. The key sits in the same relative position in every locale file ---
// (right after "link-card", which every locale file already has).
const enKeys = Object.keys(JSON.parse(read('imports/i18n/data/en.i18n.json')));
const enIndex = enKeys.indexOf('linkCardToBoardPopup-title');
assert.ok(enIndex > 0, 'the key is present in en.i18n.json');
assert.equal(enKeys[enIndex - 1], 'link-card', 'the key must sit directly after link-card in en.i18n.json');

for (const file of localeFiles) {
  const keys = Object.keys(JSON.parse(fs.readFileSync(path.join(i18nDir, file), 'utf8')));
  const idx = keys.indexOf('linkCardToBoardPopup-title');
  assert.notEqual(idx, -1, `${file}: missing linkCardToBoardPopup-title`);
  assert.equal(
    keys[idx - 1],
    'link-card',
    `${file}: linkCardToBoardPopup-title must sit directly after link-card`,
  );
}

console.log('linkCardToBoard4281: all tests passed');
