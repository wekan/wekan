'use strict';

// Searching for a card by the number the board calls it.
// Run: node tests/searchCardNumber.test.cjs
//
// wekan/wekan#5006 "feature request: Search for card number/#": "A customer has
// just hinted us that we are not able to search cards by its number (#)". A card
// carries a `cardNumber`, the board shows it, people quote it to each other -
// and the one thing you could not do with it was find the card again.
//
// It is `number:12`, and it is an EQUALITY match on a number rather than a regex
// on a string, which is the whole difference between finding card 12 and finding
// cards 12, 120 and 312. `number:abc` is refused with the same "expected a
// number" error `limit:` uses, because a string never equals a numeric field and
// a search that silently finds nothing teaches nobody anything.
//
// `#12` and a bare `12` search for BOTH: a label called 12, and the card whose
// number is 12. The issue's title says "number/#", and a board calls a card
// "#12" while a label can be called anything - so which of the two a person
// means cannot be read off the text. Answering with both is the only reading
// that never hides what they were looking for.
//
// The property that makes that safe, and what these tests are really about, is
// that the two are joined with OR. A search that used to find a label called
// "2024" still finds it; the card numbered 2024 is added to the answer, not
// substituted for it. An AND here would find nothing at all in almost every
// case, and would look like the feature working.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const constants = read('config/search-const.js');
const queryClasses = read('config/query-classes.js');
const cards = read('server/publications/cards.js');
const globalSearch = read('client/components/main/globalSearch.js');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('searchCardNumber:');

test('the operator exists, and is named for the field it searches', () => {
  assert.ok(/OPERATOR_NUMBER = 'cardNumber'/.test(constants),
    'the constant is the field name, like every other operator here');
  assert.ok(/'operator-number': OPERATOR_NUMBER/.test(queryClasses),
    'and the word people type is registered against it');
  assert.strictEqual(en['operator-number'], 'number',
    'which is "number" in English');
});

test('a card number is matched as a NUMBER, not as text', () => {
  // The difference between finding card 12 and finding 12, 120 and 312.
  assert.ok(/cardNumber \}\)\) \}\);/.test(cards) || /\(\{ cardNumber \}\)/.test(cards),
    'the selector is an equality on cardNumber');
  const block = cards.slice(cards.indexOf('OPERATOR_NUMBER)'), cards.indexOf('OPERATOR_TITLE)'));
  assert.ok(!/RegExp/.test(block), 'no regex - that is how 12 would match 120');
  assert.ok(/parseInt\(value, 10\)/.test(block), 'the predicate is parsed as an integer');
});

test('a non-number says so, instead of finding nothing quietly', () => {
  assert.ok(/OPERATOR_NUMBER\) \{[\s\S]{0,400}operator-number-expected/.test(queryClasses),
    'number:abc is refused with the error limit: already had');
  assert.ok(en['operator-number-expected'], 'and that message already exists');
});

test('an unparseable predicate never reaches the selector (negative)', () => {
  const block = cards.slice(cards.indexOf('OPERATOR_NUMBER)'), cards.indexOf('OPERATOR_TITLE)'));
  assert.ok(/filter\(value => !isNaN\(value\)\)/.test(block),
    'NaN would match every card or none, depending on the database');
  assert.ok(/if \(numbers\.length\)/.test(block),
    'and an empty list adds no clause at all, rather than an impossible one');
});

test('the search help documents it, in the users\' own words', () => {
  assert.ok(/globalSearch-instructions-operator-number/.test(globalSearch),
    'the instructions list it');
  assert.ok(/operator_number: TAPi18n\.__\('operator-number'\)/.test(globalSearch),
    'and the help shows the translated operator, not the English one');
  assert.ok(/__operator_number__/.test(en['globalSearch-instructions-operator-number']),
    'so a translated WeKan shows its own word for it');
});

test('#12 searches label AND card number, joined with OR', () => {
  const block = cards.slice(cards.indexOf('hasOperator(OPERATOR_LABEL)'),
    cards.indexOf('hasOperator(OPERATOR_HAS)'));
  assert.ok(/\$or: \[labelClause, numberClause\]/.test(block),
    'both, as alternatives - an AND would find nothing in almost every case');
  assert.ok(/\/\^\[0-9\]\+\$\/\.test/.test(block),
    'and only a numeric term gets the card-number half');
});

test('a bare 12 finds card 12 as well as the text "12"', () => {
  const block = cards.slice(cards.indexOf('if (queryParams.text)'));
  assert.ok(/cardsSelector\.push\(\{ cardNumber: asNumber \}\)/.test(block),
    'the card number joins the same $or the title and description are in');
  assert.ok(block.indexOf('cardsSelector.push({ cardNumber: asNumber })')
    < block.indexOf('selector.$and.push({ $or: cardsSelector })'),
    'and it is added before that $or is used, not after');
});

test('#red still means the label red, and nothing else changed (negative)', () => {
  // The union is for NUMBERS. A word is a label, exactly as before.
  const block = cards.slice(cards.indexOf('hasOperator(OPERATOR_LABEL)'),
    cards.indexOf('hasOperator(OPERATOR_HAS)'));
  assert.ok(/selector\.labelIds = labelClause\.labelIds/.test(block),
    'a label-only search takes the path it always took');
  assert.ok(en['globalSearch-instructions-operator-hash'],
    '# is still the documented label abbreviation');
  assert.ok(/'operator-label-abbrev': OPERATOR_LABEL/.test(queryClasses),
    'and is still mapped to labels');
});

test('#12 with no such label is not reported as a missing label', () => {
  // The card-number half is a real answer, so "label not found" beside the card
  // it did find would contradict the results on the screen.
  const block = cards.slice(cards.indexOf('hasOperator(OPERATOR_LABEL)'),
    cards.indexOf('hasOperator(OPERATOR_HAS)'));
  assert.ok(/\} else if \(!\/\^\[0-9\]\+\$\/\.test\(String\(label\)\.trim\(\)\)\) \{/.test(block),
    'a numeric label term skips the not-found error');
  assert.ok(/errors\.addNotFound\(OPERATOR_LABEL, label\)/.test(block),
    'while a word that matches no label still reports one');
});

console.log(`\nsearchCardNumber: ${passed} tests passed`);
