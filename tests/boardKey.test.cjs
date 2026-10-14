'use strict';

// Board keys (#2449, #2450; every board has one, decided 2026-10-14): a key is
// suggested from the title, unique, and a card's number shows and is found as
// KEY-7. The per-board numbers themselves do not change.
// Run: node tests/boardKey.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const k = require('../models/lib/boardKey');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

test('a key is suggested from the title, and is never one already taken', () => {
  assert.equal(k.suggestKey('Development Team'), 'DT');
  assert.equal(k.suggestKey('Marketing'), 'MARK');
  assert.equal(k.suggestKey('Ålands Öppna Bräde'), 'AOB', 'accents are dropped');
  assert.equal(k.suggestKey('2026 plans'), 'PLAN', 'a leading number is not an initial');
  assert.equal(k.suggestKey('看板'), 'BOARD', 'a title with no Latin letters');
  assert.equal(k.suggestKey('A'), 'AB', 'at least two characters');
  assert.equal(k.suggestKey('Development Team', new Set(['DT', 'DT2'])), 'DT3');
  const taken = new Set(['ABCDEFGHIJ']);
  for (let i = 2; i < 12; i += 1) taken.add(`ABCDEFGHI${i}`.slice(0, 10));
  assert.ok(k.isValidKey(k.suggestKey('Abcdefghij', taken)), 'a long key stays within 10 characters');
});

test('what a key may be (negative: lower case, too short or long, a leading digit, other characters)', () => {
  for (const ok of ['DT', 'OPS2', 'ABCDEFGHIJ']) assert.equal(k.isValidKey(ok), true, ok);
  for (const bad of ['dt', 'D', 'ABCDEFGHIJK', '2DT', 'D-T', 'DÖ', '', null]) assert.equal(k.isValidKey(bad), false, String(bad));
  assert.equal(k.normalizeKey('  dev '), 'DEV');
});

test('a card number shows as KEY-7, and KEY-7 finds it on its board', () => {
  assert.equal(k.formatCardKey('DEV', 7), 'DEV-7');
  assert.equal(k.formatCardKey(undefined, 7), '#7', 'a board without a key yet');
  assert.equal(k.formatCardKey('DEV', null), '');
  assert.deepEqual(k.parseCardKey(' dev-12 '), { key: 'DEV', number: 12 });
  assert.equal(k.parseCardKey('DEV12'), null);
  assert.equal(k.parseCardKey('DEV-1-2'), null);
});

test('it is shown and searched everywhere a card number was', async () => {
  for (const file of ['client/components/cards/minicard.jade', 'client/components/cards/cardDetails.jade']) {
    assert.match(read(file), /\| #\{getCardKey\} &nbsp;/, file);
    assert.doesNotMatch(read(file), /##\{getCardNumber\}/, `${file}: no bare #7 left`);
  }
  const { buildCardSearchOr } = await import('../models/lib/cardSearch.js');
  assert.ok(buildCardSearchOr('DEV-7', { boardKey: 'DEV' }).some(c => c.cardNumber === 7));
  assert.ok(!buildCardSearchOr('OPS-7', { boardKey: 'DEV' }).some(c => 'cardNumber' in c), 'another board\'s key finds nothing here');
  const server = read('server/boardKeys.js');
  assert.match(server, /throw new Meteor\.Error\('board-key-taken'\)/);
  assert.match(server, /allowIsBoardAdminOrSiteAdmin\(this\.userId, board\)/);
  assert.match(server, /Boards\.after\.insert\(/);
});
