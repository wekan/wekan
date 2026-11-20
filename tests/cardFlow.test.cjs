'use strict';
// The Kanban and Scrum flow fields of a card (models/lib/cardFlow.js): a
// blocked card and why, class of service with Expedite's WIP limit of one,
// MoSCoW and WSJF - what the method writes, what it refuses, and that every
// one of them is a Board Settings / Card row and an Admin Panel card field, so
// it can be hidden on a board and on the whole instance.
// Run: node --test tests/cardFlow.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const flow = require('../models/lib/cardFlow');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const now = new Date('2026-11-20T12:00:00Z');

test('blocking a card records why, who and when; unblocking clears all four', () => {
  assert.deepStrictEqual(flow.flowModifier({ blocked: true, blockedReason: '  waits for the vendor ' }, { userId: 'u1', now }), {
    $set: { 'flow.blocked': true, 'flow.blockedAt': now, 'flow.blockedBy': 'u1', 'flow.blockedReason': 'waits for the vendor' },
  });
  assert.deepStrictEqual(flow.flowModifier({ blocked: false, blockedReason: 'ignored' }, { userId: 'u1', now }), {
    $unset: { 'flow.blocked': '', 'flow.blockedReason': '', 'flow.blockedAt': '', 'flow.blockedBy': '' },
  });
});

test('class of service, MoSCoW and WSJF are set, and cleared with an empty value', () => {
  assert.deepStrictEqual(flow.flowModifier({ classOfService: 'expedite', moscow: 'must' }), {
    $set: { 'flow.classOfService': 'expedite', 'flow.moscow': 'must' },
  });
  assert.deepStrictEqual(flow.flowModifier({ classOfService: '', moscow: null }), {
    $unset: { 'flow.classOfService': '', 'flow.moscow': '' },
  });
  assert.deepStrictEqual(flow.flowModifier({ wsjf: { businessValue: '8', jobSize: null } }), {
    $set: { 'flow.wsjf.businessValue': 8 }, $unset: { 'flow.wsjf.jobSize': '' },
  });
  // (8 + 5 + 3) / 2 = 8; (1 + 1 + 1) / 20 = 0.15 -> 0.2
  assert.strictEqual(flow.wsjfScore({ businessValue: 8, timeCriticality: 5, riskReduction: 3, jobSize: 2 }), 8);
  assert.strictEqual(flow.wsjfScore({ businessValue: 1, timeCriticality: 1, riskReduction: 1, jobSize: 20 }), 0.2);
  assert.strictEqual(flow.wsjfScore({ businessValue: 8, timeCriticality: 5, riskReduction: 3 }), null, 'no size, no score');
});

test('negative: the method refuses what is not a flow field, a value off the scale, and a client\'s who and when', () => {
  for (const bad of [null, [], {}, { title: 'x' }, { blocked: 'yes' }, { blockedAt: now }, { blockedBy: 'u2' },
    { classOfService: 'urgent' }, { moscow: 'maybe' }, { wsjf: { businessValue: 4 } }, { wsjf: { cost: 1 } },
    { wsjf: [1] }, { blockedReason: 'x'.repeat(flow.MAX_REASON + 1) }, { blockedReason: 7 }]) {
    assert.throws(() => flow.flowModifier(bad, { userId: 'u1', now }), /invalid-flow-/, JSON.stringify(bad));
  }
});

test('Expedite has a WIP limit of one open card per board', () => {
  const cards = [{ _id: 'a', flow: { classOfService: 'expedite' } }, { _id: 'b', flow: { classOfService: 'standard' } }];
  assert.strictEqual(flow.expediteOverLimit('b', cards), true, 'a second Expedite card is refused');
  assert.strictEqual(flow.expediteOverLimit('a', cards), false, 'the Expedite card itself is not counted');
  // Negative: a done or archived Expedite card leaves room for the next one.
  assert.strictEqual(flow.expediteOverLimit('b', [{ _id: 'a', dueComplete: true, flow: { classOfService: 'expedite' } }]), false);
  assert.strictEqual(flow.expediteOverLimit('b', [{ _id: 'a', archived: true, flow: { classOfService: 'expedite' } }]), false);
});

test('the view of a card with nothing set is empty, and labels come from the catalog', () => {
  const empty = flow.flowView({});
  assert.strictEqual(empty.blocked, false);
  assert.strictEqual(empty.classOfService, null);
  assert.strictEqual(empty.wsjfScore, null);
  const view = flow.flowView({ flow: { classOfService: 'fixed-date', moscow: 'wont', blocked: true } });
  assert.strictEqual(view.classLabelKey, 'class-of-service-fixed-date');
  assert.strictEqual(view.moscowLabelKey, 'moscow-wont');
  assert.strictEqual(flow.flowView({ flow: { classOfService: 'bogus' } }).classOfService, null, 'negative: an unknown value is not drawn');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const key of [...Object.values(flow.CLASS_LABEL), ...Object.values(flow.MOSCOW_LABEL), 'card-blocked', 'card-blocked-reason',
    'card-blocked-since', 'class-of-service', 'moscow-priority', 'wsjf-score', 'expedite-limit',
    'wsjf-business-value', 'wsjf-time-criticality', 'wsjf-risk-reduction', 'wsjf-job-size']) {
    assert.ok(en[key], `${key} is in English`);
  }
});

test('each flow field is a Board Settings / Card row, off until turned on, and an Admin Panel card field', () => {
  const { CARD_SETTINGS_ROWS } = require('../models/lib/cardSettingsRows');
  const { CARD_FIELD_KEYS } = require('../models/lib/cardFieldVisibility');
  const { SECTIONS } = require('../models/lib/cardSettingsSections');
  const boards = read('models/boards.js');
  const serverBoards = read('server/models/boards.js');
  const cardJade = read('client/components/cards/cardDetails.jade');
  const miniJade = read('client/components/cards/minicard.jade');
  for (const [key, name] of [['blocked', 'Blocked'], ['classOfService', 'ClassOfService'], ['moscow', 'Moscow'], ['wsjf', 'Wsjf']]) {
    const row = CARD_SETTINGS_ROWS.find(r => r.key === key);
    assert.ok(row, `${key} has a row`);
    for (const [side, field] of [['card', `allows${name}OnCard`], ['minicard', `allows${name}OnMinicard`]]) {
      assert.strictEqual(row[side].field, field);
      assert.strictEqual(row[side].default, false, `${key} is off on the ${side} until a board turns it on`);
      assert.match(boards, new RegExp(`${field}: \\{ type: Boolean, optional: true \\}`));
      assert.ok(serverBoards.includes(`'${field}'`), `${field} is a card setting the board API saves`);
    }
    assert.ok(CARD_FIELD_KEYS.includes(key), `${key} can be hidden in Admin Panel / Features / Card fields`);
    assert.ok(SECTIONS.find(s => s.id === 'card').keys.includes(key), `${key} is in the Card section`);
    assert.match(cardJade, new RegExp(`if \\$eq field "${key}"\\n\\s+if currentBoard\\.allows${name}OnCard`));
    assert.match(miniJade, new RegExp(`if \\$eq field "${key}"\\n\\s+if currentBoard\\.allows${name}OnMinicard`));
  }
});

test('negative: the flow is written only by the validated method, never by a direct client write', () => {
  const cards = read('models/cards.js');
  assert.match(cards, /flow: \{ type: Object, optional: true, blackbox: true \}/);
  assert.match(cards, /\|\| field === 'flow' \|\| field\.startsWith\('flow\.'\)\);/, 'a client $set of flow is denied');
  assert.match(cards, /doc\.flow !== undefined; \}/, 'and so is an insert carrying one');
  const method = read('server/lib/cardFlowMethod.js');
  assert.match(method, /canEditCardOrLinkedCard\(userId, card, board\)/, 'the card edit right');
  assert.match(method, /isAssignedOnlyMember\(board, userId\)/, 'an assigned-only member, only their own cards');
  assert.match(method, /throw new Meteor\.Error\('expedite-limit'\)/);
  assert.match(method, /flowModifier\(patch, \{ userId, now: new Date\(\), listId: card\.listId \}\)/, 'who, when and which list are the server\'s');
  assert.match(read('server/models/cards.js'), /import '\/server\/lib\/cardFlowMethod';/);
  // The Blocked checkbox is a native one, which the app-wide rule hides three
  // ways; all three are undone or it cannot be ticked (found by the UI spec).
  const css = read('client/components/cards/cardFlow.css');
  const rule = css.slice(css.indexOf('.card-flow-blocked-toggle input[type="checkbox"] {'));
  for (const decl of ['display: inline-block;', 'visibility: visible;', 'inset-inline-start: auto;']) {
    assert.ok(rule.slice(0, rule.indexOf('}')).includes(decl), `the Blocked checkbox: ${decl}`);
  }
  // Nothing else writes flow.* from the client.
  const clientFiles = fs.readdirSync(path.join(__dirname, '..', 'client/components/cards')).filter(f => f.endsWith('.js'));
  for (const file of clientFiles) {
    assert.doesNotMatch(read(`client/components/cards/${file}`), /\$set: \{[^}]*'flow\./, `${file} writes no flow field directly`);
  }
});
