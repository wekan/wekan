'use strict';

// Admin Panel / Problems: Broken cards, the Summary's "Broken cards N" and its
// Repair button mean the SAME cards.
//
// The Broken cards pane listed a card whose type is not one of the four WeKan
// shows, while the Summary counted - and repaired - only a missing board,
// swimlane or list (models/lib/brokenCardsRepair.js). A card of an unknown
// type with all three ids was in the list, never in the count, and never
// changed by the repair. The pane's selector is that module's selector now,
// the count and the repair include the type, and the repair gives such a card
// the plain card type.
// Run: node tests/brokenCardTypes.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const m = require('../models/lib/brokenCardsRepair');
const { CARD_TYPES } = require('../config/const.js');

// The selector shapes the module uses, evaluated the way MongoDB does.
function matches(doc, sel) {
  return Object.entries(sel).every(([key, cond]) => {
    if (key === '$or') return cond.some(s => matches(doc, s));
    const v = doc[key];
    if (cond && '$in' in cond) return cond.$in.some(x => (x === null ? v === null || v === undefined : v === x));
    if (cond && '$nin' in cond) return !cond.$nin.some(x => (x === null ? v === null || v === undefined : v === x));
    return v === cond;
  });
}

const CARDS = [
  { _id: 'ok', boardId: 'b', swimlaneId: 's', listId: 'l', type: 'cardType-card' },
  { _id: 'linked', boardId: 'b', swimlaneId: 's', listId: 'l', type: 'cardType-linkedCard' },
  { _id: 'noList', boardId: 'b', swimlaneId: 's', listId: '', type: 'cardType-card' },
  { _id: 'noBoard', boardId: null, swimlaneId: 's', listId: 'l', type: 'cardType-card' },
  { _id: 'oddType', boardId: 'b', swimlaneId: 's', listId: 'l', type: 'cardType-nonsense' },
  { _id: 'noType', boardId: 'b', swimlaneId: 's', listId: 'l' },
  { _id: 'oddTypeNoBoard', boardId: '', swimlaneId: 's', listId: 'l', type: 'x' },
];

test('the four card types are the ones WeKan shows (config/const.js)', () => {
  assert.deepEqual([...m.CARD_TYPES], CARD_TYPES);
  assert.ok(CARD_TYPES.includes(m.DEFAULT_CARD_TYPE));
});

test('the reporter\'s card: an unknown type with all three ids is counted, and repaired', () => {
  const broken = CARDS.filter(c => matches(c, m.brokenCardsSelector())).map(c => c._id).sort();
  assert.deepEqual(broken, ['noBoard', 'noList', 'noType', 'oddType', 'oddTypeNoBoard']);
  const plan = m.planBrokenCardRepair(CARDS);
  assert.deepEqual(plan.needsType.sort(), ['noType', 'oddType']);
  assert.deepEqual(plan.unfixable.sort(), ['noBoard', 'oddTypeNoBoard'], 'no board: nothing to place it on, type or not');
});

test('the count, the repair and isBrokenCard agree on every card', () => {
  for (const card of CARDS) {
    const counted = matches(card, m.brokenCardsSelector());
    assert.equal(m.isBrokenCard(card), counted, card._id);
    if (counted) {
      const repairable = matches(card, m.repairableCardsSelector());
      const unfixable = matches(card, m.unfixableCardsSelector());
      assert.ok(repairable !== unfixable, `${card._id} is exactly one of repairable or unfixable`);
    }
  }
});

test('negative: a card of a known type with all its ids is not touched', () => {
  const plan = m.planBrokenCardRepair(CARDS.filter(c => c._id === 'ok' || c._id === 'linked'));
  assert.deepEqual([plan.needsList, plan.needsSwimlane, plan.needsType, plan.unfixable], [[], [], [], []]);
  assert.equal(m.isBrokenCard(CARDS[0]), false);
});

test('the pane, the Summary\'s count and the repair use this module, and only this module says what broken is', () => {
  const pub = read('server/publications/cards.js');
  assert.match(pub, /const BROKEN_CARDS_SELECTOR = brokenCardsSelector\(\);/);
  assert.match(read('server/lib/systemStatus.js'), /Cards\.find\(brokenCardsSelector\(\)\)\.countAsync\(\)/);
  const repair = read('server/methods/repairBrokenCards.js');
  assert.match(repair, /if \(needsType\.has\(card\._id\)\) set\.type = DEFAULT_CARD_TYPE;/);
  assert.match(repair, /fields: \{ _id: 1, boardId: 1, listId: 1, swimlaneId: 1, type: 1 \}/, 'the type is read to plan it');
  assert.match(read('client/components/settings/problemsSummary.js'), /\(res\.typesAssigned \|\| 0\)/, 'and the Summary counts it as fixed');
  // Tree-wide: no second definition of an unknown card type anywhere.
  const offenders = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      // tests/ folders assert the shape of the selector; they do not define one.
      if (['node_modules', '.meteor', 'tests'].includes(e.name) || e.name.startsWith('_build') || e.name.startsWith('.')) continue;
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) walk(rel);
      else if (rel.endsWith('.js') && /\$nin:\s*CARD_TYPES/.test(read(rel)) && rel !== path.join('models', 'lib', 'brokenCardsRepair.js')) offenders.push(rel);
    }
  };
  for (const dir of ['server', 'models', 'client', 'imports']) walk(dir);
  assert.deepEqual(offenders, []);
});
