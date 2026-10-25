'use strict';

// Similar cards and possible duplicates (docs/Features/Cards/Similar-Cards.md):
// the ranking, what it must not list, and the server method's read rules.
//
// Run: node tests/similarCards.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const s = require('../models/lib/similarCards.js');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('similarCards:');

test('the close card ranks first and a near copy is a possible duplicate', () => {
  const cards = [
    { _id: 'a', title: 'Fix the printer on floor 2', listId: 'l1' },
    { _id: 'b', title: 'Order printer paper', listId: 'l1' },
    { _id: 'c', title: 'Plan the summer party', listId: 'l2' },
  ];
  const ranked = s.rankSimilarCards({ title: 'Fix printer on floor 2' }, cards);
  assert.strictEqual(ranked[0]._id, 'a');
  assert.strictEqual(ranked[0].duplicate, true);
  assert.ok(!ranked.some(r => r._id === 'c'), 'an unrelated card is not listed');
});

test('accents, case and punctuation do not matter; every script counts', () => {
  assert.strictEqual(s.normalizeText('Équipe: RÉUNION!'), 'equipe reunion');
  assert.ok(s.dice(s.trigrams('Café menu'), s.trigrams('cafe MENU')) === 1);
  const ja = s.rankSimilarCards({ title: 'プリンター修理' }, [{ _id: 'e', title: 'プリンターを修理する' }, { _id: 'f', title: '夏のパーティー' }]);
  assert.deepStrictEqual(ja.map(r => r._id), ['e']);
  const fi = s.rankSimilarCards({ title: 'Tulostin rikki' }, [{ _id: 'x', title: 'Tulostin on rikki' }, { _id: 'y', title: 'Kahvinkeitin' }]);
  assert.deepStrictEqual(fi.map(r => r._id), ['x']);
});

test('the title counts twice the description', () => {
  const query = { title: 'Budget review', description: 'Go through the travel costs of the spring' };
  const sameTitle = { _id: 't', title: 'Budget review', description: 'Something else entirely' };
  const sameDescription = { _id: 'd', title: 'Meeting', description: 'Go through the travel costs of the spring' };
  const ranked = s.rankSimilarCards(query, [sameTitle, sameDescription], { min: 0 });
  assert.strictEqual(ranked[0]._id, 't');
});

test('archived cards, the card itself and an empty query give nothing (negative)', () => {
  const cards = [{ _id: 'a', title: 'Fix printer', archived: true }, { _id: 'self', title: 'Fix printer' }];
  assert.deepStrictEqual(s.rankSimilarCards({ title: 'Fix printer' }, cards, { excludeId: 'self' }), []);
  assert.deepStrictEqual(s.rankSimilarCards({ title: '' }, cards), []);
  assert.deepStrictEqual(s.rankSimilarCards({ title: '!!!' }, cards), []);
  assert.strictEqual(s.rankSimilarCards({ title: 'a b c' }, Array.from({ length: 20 }, (_, i) => ({ _id: `c${i}`, title: 'a b c' }))).length, 5, 'at most five');
});

test('the method reads only what the caller may read, and nothing when hidden (negative)', () => {
  const src = read('server/methods/similarCards.js');
  assert.match(src, /boardForCardHelper\(this\.userId, boardId, 'similarCards', flag\)/);
  assert.match(src, /const flag = query\.cardId \? 'allowsSimilarCardsOnCard' : 'allowsSimilarCardsOnMinicard';/);
  assert.match(src, /mergeCardScope\(\s*\{ boardId: board\._id, archived: false/);
  assert.match(src, /assignedOnlyCardScope\(board, this\.userId\)/, 'an assigned-only member compares only their own cards');
  assert.match(src, /if \(!card \|\| !assignedOnlyAllowsCard\(board, this\.userId, card\)\) return \[\];/);
  assert.match(src, /DDPRateLimiter\.addRule\(\{ type: 'method', name: 'cards\.similar'/);
  const gate = read('server/lib/assistGate.js');
  assert.match(gate, /if \(!board \|\| !canReadBoard\(userId, board\)\) return null;/);
  assert.match(gate, /if \(board\[boardFlag\] === false\) return null;/);
  assert.match(gate, /if \(!isCardFieldEnabled\(setting, cardField\)\) return null;/);
  assert.match(read('server/imports.js'), /import '\/server\/methods\/similarCards';/);
});

test('every helper method reads its board through the gate (negative: none reads cards on its own)', () => {
  // The helpers that need no AI keep their methods in server/methods; any of
  // them that takes a boardId goes through assistGate.js.
  const methods = ['similarCards.js'].map(f => read(`server/methods/${f}`));
  for (const src of methods) {
    assert.ok(/boardForCardHelper|featureOnFor/.test(src), 'uses the gate');
    assert.ok(!/ReactiveCache\.getBoard\(/.test(src), 'does not read the board around the gate');
  }
});

test('the card section and the add-card hint, each behind its Board Settings / Card side', () => {
  const jade = read('client/components/cards/cardDetails.jade');
  // The section is there only when there are similar cards
  // (docs/Features/Cards/Card-Fields.md): its heading is inside the template
  // that asks, behind `if results.length`.
  assert.match(jade, /unless \$eq currentBoard\.allowsSimilarCardsOnCard false\n\s+\+cardSimilarCardsSection\(cardId=_id\)/);
  assert.match(read('client/components/cards/similarCards.jade'), /template\(name="cardSimilarCardsSection"\)\n\s+if results\.length\n\s+\+cardSectionHeader\(section="similar-cards"/);
  assert.doesNotMatch(jade, /\+cardSectionHeader\(section="similar-cards"/, 'negative: no heading of its own, drawn with nothing under it');
  assert.match(read('client/components/lists/listBody.jade'), /\+similarCardsHint\(selector="\.js-card-title"\)/);
  const js = read('client/components/cards/similarCards.js');
  assert.match(js, /!boardFlagOn\('allowsSimilarCardsOnMinicard'\)/);
  assert.match(js, /if \(!now \|\| now\.value\.trim\(\) !== title\) return;/, 'a late answer for an older title is dropped');
  const { CARD_SETTINGS_ROWS } = require('../models/lib/cardSettingsRows.js');
  const row = CARD_SETTINGS_ROWS.find(r => r.key === 'similarCards');
  assert.ok(row && row.card.field === 'allowsSimilarCardsOnCard' && row.minicard.field === 'allowsSimilarCardsOnMinicard');
  const { CARD_FIELD_KEYS } = require('../models/lib/cardFieldVisibility.js');
  assert.ok(CARD_FIELD_KEYS.includes('similarCards'));
});

console.log(`\nsimilarCards: ${passed} tests passed`);
