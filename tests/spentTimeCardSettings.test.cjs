'use strict';

// Issue #2530: the "Time spent" field (and its overtime indicator) was only
// reachable through the card's hamburger/context menu, requiring extra
// clicks. The card detail view and minicard already rendered the
// accumulated spent-time value unconditionally whenever a card has logged
// time (models/cards.js getSpentTime()), with no way for an admin to turn it
// off. This adds the same "Show on card"/"Show on minicard" Card Settings
// toggle pattern already used for allowsReceivedDate/allowsReceivedDateOnMinicard,
// #4285's allowsCommentsOnMinicard, etc.
//
// Unlike a brand-new field, the existing display was unconditional, so both
// new board fields default to TRUE (not false) - that is what keeps existing
// boards' behavior unchanged; a false default here would instead HIDE
// something every board already shows.
//
// Run: node tests/spentTimeCardSettings.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('spentTimeCardSettings:');

test('the board schema has both new fields, defaulting to true (existing behavior unchanged)', () => {
  const boards = read('models/boards.js');

  const cardAt = boards.indexOf('allowsSpentTime: {');
  assert.ok(cardAt !== -1, 'allowsSpentTime must be declared in the Boards schema');
  const cardField = boards.slice(cardAt, cardAt + 300);
  assert.ok(/type: Boolean/.test(cardField));
  assert.ok(/defaultValue: true/.test(cardField),
    'must default to true: the card detail view already shows spent time unconditionally today');

  const minicardAt = boards.indexOf('allowsSpentTimeOnMinicard: {');
  assert.ok(minicardAt !== -1, 'allowsSpentTimeOnMinicard must be declared in the Boards schema');
  const minicardField = boards.slice(minicardAt, minicardAt + 300);
  assert.ok(/type: Boolean/.test(minicardField));
  assert.ok(/defaultValue: true/.test(minicardField),
    'must default to true: the minicard already shows spent time unconditionally today');

  assert.ok(/setAllowsSpentTime\(/.test(boards));
  assert.ok(/setAllowsSpentTimeOnMinicard\(/.test(boards));
});

test('the server allow-lists can be written to from the client', () => {
  const serverBoards = read('server/models/boards.js');
  assert.ok(/'allowsSpentTime'/.test(serverBoards),
    'without this, Boards.update from the sidebar toggle would be rejected');
  assert.ok(/'allowsSpentTimeOnMinicard'/.test(serverBoards));
});

test('Card Settings has a row for it, the same entry as allowsReceivedDate(OnMinicard) has', () => {
  // The rows of Board Settings / Card are a table the template draws from
  // (models/lib/cardSettingsRows.js); one entry carries both the card and
  // the minicard toggle of a field, the way one hand-written row once did.
  const { CARD_SETTINGS_ROWS } = require('../models/lib/cardSettingsRows');
  const row = CARD_SETTINGS_ROWS.find(r => r.key === 'spentTime');
  assert.ok(row, 'a spent-time row');
  assert.strictEqual(row.card.toggle, 'js-field-has-spent-time');
  assert.strictEqual(row.minicard.toggle, 'js-field-has-spent-time-on-minicard');
  assert.strictEqual(row.card.field, 'allowsSpentTime');
  assert.strictEqual(row.minicard.field, 'allowsSpentTimeOnMinicard');

  const sidebarJs = read('client/components/sidebar/sidebar.js');
  assert.ok(/'click \.js-field-has-spent-time'/.test(sidebarJs));
  assert.ok(/'click \.js-field-has-spent-time-on-minicard'/.test(sidebarJs));
  assert.ok(/allowsSpentTime: !currentValue/.test(sidebarJs));
  assert.ok(/allowsSpentTimeOnMinicard: !currentValue/.test(sidebarJs));
  assert.ok(/allowsSpentTime\(\) \{/.test(sidebarJs));
  assert.ok(/allowsSpentTimeOnMinicard\(\) \{/.test(sidebarJs));
});

test('the card detail view only renders the spent-time item when the board allows it', () => {
  const jade = read('client/components/cards/cardDetails.jade');
  const at = jade.indexOf('card-details-item-spent');
  assert.ok(at !== -1, 'expected the spent-time card-details item to still exist');
  const before = jade.slice(Math.max(0, at - 400), at);
  assert.ok(/if currentBoard\.allowsSpentTime/.test(before),
    'the spent-time item must be gated behind currentBoard.allowsSpentTime');
});

test('the minicard only renders the spent-time badge when the board allows it, via getMinicardFlag', () => {
  const jade = read('client/components/cards/minicard.jade');
  const at = jade.indexOf('cardSpentTime');
  assert.ok(at !== -1);
  const before = jade.slice(Math.max(0, at - 200), at);
  assert.ok(/if showSpentTime/.test(before),
    'the minicard spent-time badge must be gated behind a showSpentTime helper');
  assert.ok(/if getSpentTime/.test(before));

  const minicardJs = read('client/components/cards/minicard.js');
  const helperAt = minicardJs.indexOf('showSpentTime() {');
  assert.ok(helperAt !== -1, 'expected a showSpentTime() template helper');
  const helper = minicardJs.slice(helperAt, helperAt + 250);
  assert.ok(/getMinicardFlag\(board, 'allowsSpentTimeOnMinicard', 'allowsSpentTime', true\)/.test(helper),
    'must follow the same getMinicardFlag(board, onMinicardField, legacyField, defaultValue) pattern as showReceived/showStart/showEnd, defaulting to true');
});

test('allowsSpentTime is a distinct field from the pre-existing spentTime CARD field', () => {
  // models/cards.js has a per-card `spentTime` NUMBER field (the logged
  // hours); models/boards.js's new `allowsSpentTime` is a per-BOARD boolean
  // visibility toggle. They must not collide.
  const cards = read('models/cards.js');
  assert.ok(/spentTime: \{/.test(cards), 'the pre-existing per-card spentTime field must still be there');
  const boards = read('models/boards.js');
  assert.notStrictEqual(
    boards.indexOf('allowsSpentTime:'),
    -1,
  );
});

console.log(`spentTimeCardSettings: ${passed} passed`);
