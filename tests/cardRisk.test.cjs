'use strict';

// The at-risk mark (docs/Features/Cards/At-Risk.md): the five rules, their
// weights, what is never at risk, and where the mark is drawn and hidden.
//
// Run: node tests/cardRisk.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const r = require('../models/lib/cardRisk.js');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const now = new Date('2026-10-17T12:00:00Z');
const days = n => new Date(now.getTime() + n * 86400000);
const kinds = res => res.reasons.map(x => x.kind);

console.log('cardRisk:');

test('overdue alone is at risk', () => {
  const res = r.cardRisk({ dueAt: days(-1) }, { now });
  assert.deepStrictEqual(kinds(res), ['overdue']);
  assert.strictEqual(res.atRisk, true);
});

test('due soon with little done, blocked, idle and sent back add up', () => {
  const soon = r.cardRisk({ dueAt: days(1) }, { now, checklist: { finished: 1, total: 4 } });
  assert.deepStrictEqual(kinds(soon), ['dueSoon']);
  assert.strictEqual(soon.atRisk, false, 'two points are not enough');
  const both = r.cardRisk({ dueAt: days(1) }, { now, checklist: { finished: 1, total: 4 }, blockers: [{ title: 'Order parts' }] });
  assert.deepStrictEqual(kinds(both), ['dueSoon', 'blocked']);
  assert.strictEqual(both.atRisk, true);
  assert.strictEqual(both.reasons[1].card, 'Order parts');
  const idle = r.cardRisk({ dateLastActivity: days(-20) }, { now, inMiddleList: true, backMoves: 2 });
  assert.deepStrictEqual(kinds(idle), ['idle', 'sentBack']);
  assert.strictEqual(idle.reasons[0].days, 20);
  assert.strictEqual(idle.atRisk, true);
});

test('what is never at risk (negative)', () => {
  for (const card of [{ dueAt: days(-1), dueComplete: true }, { dueAt: days(-1), endAt: days(-2) }, { dueAt: days(-1), archived: true }]) {
    assert.strictEqual(r.cardRisk(card, { now }).atRisk, false, JSON.stringify(card));
  }
  assert.deepStrictEqual(kinds(r.cardRisk({ dueAt: days(1) }, { now, checklist: { finished: 3, total: 4 } })), [], 'most of the checklist done');
  assert.deepStrictEqual(kinds(r.cardRisk({ dueAt: days(5) }, { now, checklist: { finished: 0, total: 4 } })), [], 'not due soon');
  assert.deepStrictEqual(kinds(r.cardRisk({ dateLastActivity: days(-30) }, { now, inMiddleList: false })), [], 'idle in the first or last list is waiting or done');
  assert.deepStrictEqual(kinds(r.cardRisk({}, { now, backMoves: 1 })), []);
  assert.strictEqual(r.cardRisk(null, { now }).atRisk, false);
});

test('a move back is a move to an earlier list', () => {
  const sort = { a: 0, b: 1, c: 2 };
  assert.strictEqual(r.countBackMoves([{ oldListId: 'c', listId: 'a' }, { oldListId: 'a', listId: 'b' }, { oldListId: 'b', listId: 'a' }, { oldListId: 'x', listId: 'a' }], sort), 2);
});

test('the minicard and the opened card draw it, each behind its Board Settings / Card side', () => {
  const mini = read('client/components/cards/minicard.jade');
  assert.match(mini, /unless \$eq currentBoard\.allowsAtRiskOnMinicard false\n\s+with atRisk\n\s+\.badge\.badge-state-image-only\.minicard-at-risk\.js-minicard-at-risk\(title=text\)/);
  const card = read('client/components/cards/cardDetails.jade');
  assert.match(card, /unless \$eq currentBoard\.allowsAtRiskOnCard false\n\s+with cardAtRisk\n\s+\.card-details-at-risk\.js-card-at-risk/);
  assert.match(read('client/components/cards/cardDetails.js'), /riskOf\(Template\.currentData\(\), \{ withMoves: true \}\)/);
  const { CARD_SETTINGS_ROWS } = require('../models/lib/cardSettingsRows.js');
  const row = CARD_SETTINGS_ROWS.find(x => x.key === 'atRisk');
  assert.ok(row && row.card.field === 'allowsAtRiskOnCard' && row.minicard.field === 'allowsAtRiskOnMinicard');
  assert.ok(require('../models/lib/cardFieldVisibility.js').CARD_FIELD_KEYS.includes('atRisk'));
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const key of ['at-risk', ...Object.values(r.REASON_KEYS)]) assert.ok(en[key], key);
});

console.log(`\ncardRisk: ${passed} tests passed`);
