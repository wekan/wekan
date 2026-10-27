'use strict';

// A due date typed at the end of a card title (docs/Features/Cards/Dates/
// Due-Date-From-Title.md): the parser in every WeKan language, what it must
// leave alone, and where the add-card form and the opened card use it.
//
// Run: node tests/titleDueDate.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { parseTitleDueDate, DEFAULT_HOUR } = require('../models/lib/titleDueDate.js');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Saturday 17 October 2026, 10:00 local time.
const now = new Date(2026, 9, 17, 10, 0);
const at = (y, mo, d, h = DEFAULT_HOUR, mi = 0) => new Date(y, mo - 1, d, h, mi).getTime();

function check(title, locale, expectedTitle, expectedDue) {
  const result = parseTitleDueDate(title, { locale, now });
  assert.ok(result, `${locale}: "${title}" has a date`);
  assert.strictEqual(result.title, expectedTitle, `${locale}: "${title}" keeps "${expectedTitle}"`);
  assert.strictEqual(result.dueAt.getTime(), expectedDue, `${locale}: "${title}" is due ${new Date(expectedDue)}, got ${result.dueAt}`);
}

console.log('titleDueDate:');

test('the examples of the guide', () => {
  check('Call the printer company tomorrow', 'en', 'Call the printer company', at(2026, 10, 18));
  check('Send invoices friday 9:30', 'en', 'Send invoices', at(2026, 10, 23, 9, 30));
  check('Budget draft in 3 days', 'en', 'Budget draft', at(2026, 10, 20));
  check('Release notes 2026-11-02 14:00', 'en', 'Release notes', at(2026, 11, 2, 14));
  check('Soita tulostinyhtiölle huomenna klo 14', 'fi', 'Soita tulostinyhtiölle', at(2026, 10, 18, 14));
});

test('the words come from each language\'s own tables', () => {
  check('Palaveri perjantaina klo 9.30', 'fi', 'Palaveri', at(2026, 10, 23, 9, 30));
  check('Raportti 3 päivän päästä', 'fi', 'Raportti', at(2026, 10, 20));
  check('Kokous ensi viikolla', 'fi', 'Kokous', at(2026, 10, 19));
  check('Kokous ylihuomenna', 'fi', 'Kokous', at(2026, 10, 19));
  check('Arzt morgen um 9', 'de', 'Arzt', at(2026, 10, 18, 9));
  check('Zahnarzt 23.10.', 'de', 'Zahnarzt', at(2026, 10, 23));
  check('Встреча завтра в 14:00', 'ru', 'Встреча', at(2026, 10, 18, 14));
  check('会議明日', 'ja', '会議', at(2026, 10, 18));
  check("Réunion aujourd'hui à 16:00", 'fr', 'Réunion', at(2026, 10, 17, 16));
  check('Möte i morgon kl. 10', 'sv', 'Möte', at(2026, 10, 18, 10));
  check('Bills 10/23/2026', 'en', 'Bills', at(2026, 10, 23));
  check('Party next week', 'en', 'Party', at(2026, 10, 19));
  check('Meet at 3:15 pm', 'en', 'Meet', at(2026, 10, 17, 15, 15));
  check('Call Bob tomorrow!', 'en', 'Call Bob', at(2026, 10, 18));
});

test('a weekday is the next one after today, and a past time is tomorrow', () => {
  check('Clean up saturday', 'en', 'Clean up', at(2026, 10, 24));
  check('Standup 9:00', 'en', 'Standup', at(2026, 10, 18, 9));
  check('Lunch 12:00', 'en', 'Lunch', at(2026, 10, 17, 12));
  check('Dentist 1.2.', 'fi', 'Dentist', at(2027, 2, 1));
});

test('English works in every language', () => {
  check('Huolto tomorrow', 'fi', 'Huolto', at(2026, 10, 18));
  check('Prüfen friday', 'de', 'Prüfen', at(2026, 10, 23));
});

test('what is not a date stays in the title (negative)', () => {
  for (const [title, locale] of [
    ['Friday party planning', 'en'], ['Release 1.2', 'fi'], ['Version 1.10', 'en'],
    ['Enjoy the sun', 'en'], ['Step 1/2', 'en'], ['tomorrow', 'en'], ['Budget 2026', 'en'],
    ['Kokous huomenna', 'sv'], ['Valmis 31.02.2027', 'fi'], ['Meet 25:00', 'en'], ['', 'en'],
  ]) {
    assert.strictEqual(parseTitleDueDate(title, { locale, now }), null, `${locale}: "${title}"`);
  }
  assert.strictEqual(parseTitleDueDate(undefined, { now }), null);
});

test('every WeKan language loads its tables without throwing', () => {
  const src = read('imports/i18n/languages.js');
  const tags = [...src.matchAll(/^\s*\["[^"]+", "[^"]+", "([^"]+)"/gm)].map(m => m[1]);
  assert.ok(tags.length > 200, `found ${tags.length} languages`);
  for (const tag of tags) {
    const result = parseTitleDueDate('Review tomorrow', { locale: tag, now });
    assert.ok(result && result.dueAt.getTime() === at(2026, 10, 18), `${tag} reads English`);
  }
});

test('the add-card form and the opened card use it, each through its own Board Settings / Card side', () => {
  const listBody = read('client/components/lists/listBody.js');
  assert.match(listBody, /dueFromTitle\(submittedForm, labelledTitle, 'allowsDueFromTitleOnMinicard'\)/);
  assert.match(listBody, /const fromTitle = !dueAt && !data\.linkedListId/, 'More options and linked lists win (negative)');
  assert.match(listBody, /cardFields\.dueAt = cardDueAt;/);
  assert.match(read('client/components/lists/listBody.jade'), /\+titleDueHint\(selector="\.js-card-title" field="allowsDueFromTitleOnMinicard"\)/);
  const card = read('client/components/cards/cardDetails.js');
  assert.match(card, /typed && typed !== card\.title\s*\? dueFromTitle\(titleInput\.closest\('form'\), typed, 'allowsDueFromTitleOnCard'\)/,
    'an unchanged title is never dated (negative)');
  assert.match(card, /if \(fromTitle\) await card\.setDue\(fromTitle\.dueAt\);/);
  assert.match(read('client/components/cards/cardDetails.jade'), /\+titleDueHint\(selector="\.js-edit-card-title" field="allowsDueFromTitleOnCard"\)/);
  const hint = read('client/components/forms/titleDueHint.js');
  assert.ok(hint.includes('if (!boardFlagOn(field)) return null;'), 'on unless the board turned it off');
  assert.ok(read('client/lib/boardFlagOn.js').includes('board[field] !== false'));
  assert.match(hint, /form\.dataset\[DISMISSED\] === '1'\) return null/, 'the x keeps the words');
  // The hint follows the board's switch while the form is open, not only the
  // typing: a switch turned off takes away a hint already shown
  // (assist-due-from-title.e2e.js, negative).
  assert.match(hint, /tpl\.autorun\(\(\) => tpl\.update\(\)\)/);
});

test('Board Settings / Card has the row, and Admin Panel / Visibility / Card fields hides it', () => {
  const { CARD_SETTINGS_ROWS } = require('../models/lib/cardSettingsRows.js');
  const row = CARD_SETTINGS_ROWS.find(r => r.key === 'dueFromTitle');
  assert.ok(row, 'the row');
  assert.strictEqual(row.card.field, 'allowsDueFromTitleOnCard');
  assert.strictEqual(row.minicard.field, 'allowsDueFromTitleOnMinicard');
  const { CARD_FIELD_KEYS, applyCardFieldVisibility } = require('../models/lib/cardFieldVisibility.js');
  assert.ok(CARD_FIELD_KEYS.includes('dueFromTitle'), 'a card field the Admin Panel lists');
  const board = applyCardFieldVisibility({ allowsDueFromTitleOnCard: true }, { cardFieldStates: { dueFromTitle: false } });
  assert.strictEqual(board.allowsDueFromTitleOnCard, false);
  assert.strictEqual(board.allowsDueFromTitleOnMinicard, false);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.ok(en['due-from-title'] && en['due-from-title-keep']);
});

console.log(`\ntitleDueDate: ${passed} tests passed`);
