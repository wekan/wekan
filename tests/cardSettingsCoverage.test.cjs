'use strict';

// #6688: every section of the opened card and every element of the minicard
// has a Board Settings / Card toggle - and the popup lists them in the order
// the card and the minicard show them, with arrows to change that order.
//
// Flowtime, Pomodoro, Stickers, Location (the four the issue names), plus
// Dependencies, Vote, Planning Poker, Text Notes and the activity history on
// the card, and the dependencies / stickers / comment-count / vote / poker
// badges on the minicard, rendered UNCONDITIONALLY: a board that did not use
// them had no way to hide them. Each now has an `allows*` board field
// (default true, so nothing an existing board shows disappears), a setter, a
// row, a click handler, and a gate in the card or minicard template.
//
// The popup is ONE "Card field order" heading over TWO lists, "Show on
// Minicard" and "Show on Card", each row `[checkbox] [up] [down] icon label`,
// each list in its own board order. The rows are not hand-written: the
// template draws them from models/lib/cardSettingsRows.js in the order
// models/lib/cardFieldOrder.js resolves - the SAME source cardDetails.jade
// and minicard.jade render from. So the order check here is no longer "the
// popup's rows follow the template" (there are no rows in the popup to read)
// but "the layout's DEFAULT order is the order the templates render in when
// nothing is stored" - derived from cardDetails.jade and minicard.jade, so a
// section added to a template without a place in the layout fails here.
//
// Static wiring test (no Meteor runtime). Run: node tests/cardSettingsCoverage.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('cardSettingsCoverage:');

const sidebarJade = read('client/components/sidebar/sidebar.jade');
const sidebarJs = read('client/components/sidebar/sidebar.js');
const sidebarCss = read('client/components/sidebar/sidebar.css');
const cardJade = read('client/components/cards/cardDetails.jade');
const minicardJade = read('client/components/cards/minicard.jade');
const minicardJs = read('client/components/cards/minicard.js');
const boardsModel = read('models/boards.js');
const serverBoards = read('server/models/boards.js');
const permissions = read('server/permissions/boards.js');
const upgradeSteps = read('server/lib/schemaUpgradeSteps.js');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
const {
  CARD_LAYOUT, MINICARD_LAYOUT, DEFAULT_CARD_ORDER, DEFAULT_MINICARD_ORDER, DEFAULT_CARD_FIELD_ORDER,
} = require('../models/lib/cardFieldOrder');
const { CARD_SETTINGS_ROWS, rowsForSide } = require('../models/lib/cardSettingsRows');

// The popup template, from its line to the next template.
const popupStart = sidebarJade.indexOf('template(name="boardCardSettingsPopup")');
assert.ok(popupStart !== -1, 'boardCardSettingsPopup found');
const popupEnd = sidebarJade.indexOf('\ntemplate(name=', popupStart + 1);
const popup = sidebarJade.slice(popupStart, popupEnd);

const cardRows = CARD_SETTINGS_ROWS.filter(r => r.card);
const minicardRows = CARD_SETTINGS_ROWS.filter(r => r.minicard);
const cardFields = cardRows.map(r => r.card.field);
const minicardFields = minicardRows.map(r => r.minicard.field);
const allFields = [...cardFields, ...minicardFields];

function template(src, name) {
  const at = src.indexOf(`template(name="${name}")`);
  assert.ok(at !== -1, `template ${name} exists`);
  const next = src.indexOf('\ntemplate(name=', at + 1);
  return src.slice(at, next === -1 ? undefined : next);
}
const gatesOf = src => [...src.matchAll(/currentBoard\.(allows[A-Za-z]+)/g)].map(m => m[1]);
const dedupe = list => list.filter((v, i) => list.indexOf(v) === i);

// ── the fields that were missing ─────────────────────────────────────────────

const NEW_CARD_FIELDS = {
  allowsStickers: { row: 'js-field-has-stickers', gate: 'card-details-item-stickers' },
  allowsLocation: { row: 'js-field-has-location', gate: 'card-details-item-location' },
  allowsDependencies: { row: 'js-field-has-dependencies', gate: 'card-details-group-dependencies' },
  allowsFlowtime: { row: 'js-field-has-flowtime', gate: 'card-details-item-flow' },
  allowsPomodoro: { row: 'js-field-has-pomodoro', gate: 'card-details-item-pomodoro' },
  allowsVote: { row: 'js-field-has-vote', gate: 'if getVoteQuestion' },
  allowsPoker: { row: 'js-field-has-poker', gate: 'if getPokerQuestion' },
  allowsTextNotes: { row: 'js-field-has-text-notes', gate: 'section="text-notes"' },
  allowsActivities: { row: 'js-field-has-activities', gate: 'section="activities"' },
};
const NEW_MINICARD_FIELDS = {
  allowsStickersOnMinicard: { row: 'js-field-has-stickers-on-minicard', helper: 'showStickersOnMinicard', gate: 'minicard-stickers' },
  allowsDependenciesOnMinicard: { row: 'js-field-has-dependencies-on-minicard', helper: 'showDependenciesOnMinicard', gate: 'minicard-dependencies' },
  allowsCommentCountOnMinicard: { row: 'js-field-has-comment-count-on-minicard', helper: 'showCommentCountOnMinicard', gate: 'badge-comment' },
  allowsVoteOnMinicard: { row: 'js-field-has-vote-on-minicard', helper: 'showVoteOnMinicard', gate: 'title=getVoteQuestion' },
  allowsPokerOnMinicard: { row: 'js-field-has-poker-on-minicard', helper: 'showPokerOnMinicard', gate: 'title=getPokerQuestion' },
};
// allowsActivities predates this - it is in the schema with default true and
// had a click handler; it just gated nothing and its row was commented out.
const BRAND_NEW = [...Object.keys(NEW_CARD_FIELDS), ...Object.keys(NEW_MINICARD_FIELDS)]
  .filter(f => f !== 'allowsActivities');

test('every new field is in the Boards schema with defaultValue true (nothing an existing board shows disappears)', () => {
  for (const field of [...Object.keys(NEW_CARD_FIELDS), ...Object.keys(NEW_MINICARD_FIELDS)]) {
    const m = boardsModel.match(new RegExp(`${field}: \\{[^}]*?defaultValue: (true|false)`));
    assert.ok(m, `${field} declared in models/boards.js`);
    assert.strictEqual(m[1], 'true', `${field} defaults to true`);
  }
});

test('every new field has a setter, is an API card-setting key and a healed true-default', () => {
  for (const field of BRAND_NEW) {
    const setter = `setAllows${field.slice('allows'.length)}`;
    assert.ok(boardsModel.includes(`async ${setter}(${field})`), `${setter} exists`);
    assert.ok(serverBoards.includes(`'${field}'`), `${field} in BOARD_CARD_SETTING_KEYS`);
    assert.ok(upgradeSteps.includes(`'${field}'`), `${field} in BOARD_ALLOWS_TRUE_DEFAULTS`);
  }
});

test('the opened card gates each new section on its board field', () => {
  for (const [field, { gate }] of Object.entries(NEW_CARD_FIELDS)) {
    const gateAt = cardJade.indexOf(gate);
    assert.ok(gateAt !== -1, `${gate} is in cardDetails.jade`);
    const before = cardJade.slice(Math.max(0, gateAt - 900), gateAt);
    assert.ok(before.includes(`if currentBoard.${field}`), `${gate} sits under if currentBoard.${field}`);
  }
});

test('the minicard gates each new badge on its board field through a helper that defaults to true', () => {
  for (const [field, { helper, gate }] of Object.entries(NEW_MINICARD_FIELDS)) {
    const gateAt = minicardJade.indexOf(gate);
    assert.ok(gateAt !== -1, `${gate} is in minicard.jade`);
    const before = minicardJade.slice(Math.max(0, gateAt - 300), gateAt);
    assert.ok(before.includes(`if ${helper}`), `${gate} sits under if ${helper}`);
    assert.ok(new RegExp(`${helper}\\(\\) \\{[^}]*getMinicardFlag\\(board, '${field}', null, true\\)`).test(minicardJs),
      `${helper} reads ${field} with a true default and no card-side fallback`);
  }
});

test('Board Settings / Card has a row and a click handler for each new field', () => {
  for (const [field, { row }] of Object.entries({ ...NEW_CARD_FIELDS, ...NEW_MINICARD_FIELDS })) {
    const entry = CARD_SETTINGS_ROWS.find(r => (r.card && r.card.toggle === row) || (r.minicard && r.minicard.toggle === row));
    assert.ok(entry, `${row} row in the table`);
    const spec = entry.card && entry.card.toggle === row ? entry.card : entry.minicard;
    assert.strictEqual(spec.field, field, `the ${row} checkbox reads ${field}`);
    assert.ok(sidebarJs.includes(`'click .${row}'`), `click handler for .${row}`);
    assert.ok(new RegExp(`\\$set: \\{ ${field}: `).test(sidebarJs), `the handler writes ${field}`);
    assert.ok(new RegExp(`^  ${field}\\(\\) \\{`, 'm').test(sidebarJs), `helper ${field}() for the checkbox`);
  }
});

test('the four the issue names - Flowtime, Pomodoro, Stickers, Location - are all covered (negative: none is unconditional)', () => {
  for (const marker of ['card-details-item-flow', 'card-details-item-pomodoro',
    'card-details-item-stickers', 'card-details-item-location']) {
    const at = cardJade.indexOf(marker);
    const lines = cardJade.slice(0, at).split('\n');
    const line = lines[lines.length - 1];
    const indent = line.length - line.trimStart().length;
    // The nearest shallower line above must be a board gate, not a fold state
    // or the order loop's `if $eq field`.
    let parent = null;
    for (let i = lines.length - 2; i >= 0; i--) {
      const l = lines[i];
      if (!l.trim() || l.trim().startsWith('//')) continue;
      if (l.length - l.trimStart().length < indent) { parent = l.trim(); break; }
    }
    assert.match(parent, /^if currentBoard\.allows/, `${marker}'s parent is a board gate, not "${parent}"`);
  }
});

// ── coverage: everything the card and minicard show has a row ────────────────

test('every board gate of the opened card has a "Show on Card" row', () => {
  for (const g of dedupe(gatesOf(cardJade))) {
    assert.ok(cardFields.includes(g), `card gate ${g} has a row`);
  }
});

test('every board gate of the minicard has a "Show on Minicard" row', () => {
  const helperFields = [...minicardJs.matchAll(/getMinicardFlag\(board, '(allows[A-Za-z]+)'/g)].map(m => m[1]);
  const direct = [...minicardJs.matchAll(/board\??\.(allows[A-Za-z]+OnMinicard)/g)].map(m => m[1]);
  for (const g of dedupe([...helperFields, ...direct, ...gatesOf(minicardJade)])) {
    if (g === 'allowsCardSortingByNumber') continue; // the card-side half of the sort badge's pair
    assert.ok(minicardFields.includes(g), `minicard gate ${g} has a row`);
  }
});

test('every NEW row is read by the card or the minicard (negative: no dead toggle)', () => {
  const readAnywhere = [cardJade, minicardJade, minicardJs].join('\n');
  for (const f of [...Object.keys(NEW_CARD_FIELDS), ...Object.keys(NEW_MINICARD_FIELDS)]) {
    assert.ok(readAnywhere.includes(f), `${f} is read by a template`);
  }
});

test('every row has a checkbox helper, a click handler, existing label keys and icons', () => {
  for (const row of CARD_SETTINGS_ROWS) {
    assert.ok(Array.isArray(row.icons) && row.icons.length > 0, `${row.key} has an icon`);
    for (const k of row.label) assert.ok(en[k], `${row.key}: i18n key ${k} exists`);
    for (const side of ['card', 'minicard']) {
      const spec = row[side];
      if (!spec) continue;
      assert.ok(new RegExp(`^  ${spec.field}\\(\\) \\{`, 'm').test(sidebarJs), `helper ${spec.field}() (${row.key}/${side})`);
      assert.ok(sidebarJs.includes(`'click .${spec.toggle}'`), `click handler for .${spec.toggle}`);
    }
  }
});

// ── the popup: one heading, two lists, every row [checkbox] [up] [down] icon label

test('"Card field order" is ONE heading above both the Show on Minicard and the Show on Card list', () => {
  const heading = popup.indexOf("h4.card-field-order-heading {{_ 'card-field-order'}}");
  const minicard = popup.indexOf("{{_ 'show-on-minicard'}}");
  const card = popup.indexOf("{{_ 'show-on-card'}}");
  assert.ok(heading !== -1 && minicard !== -1 && card !== -1);
  assert.ok(heading < minicard && heading < card, 'the heading is above both column headings');
  assert.strictEqual((popup.match(/card-field-order-heading/g) || []).length, 1, 'exactly one');
  assert.ok(en['card-field-order'] && en['show-on-minicard'] && en['show-on-card'], 'existing keys');
});

test('each list draws every row as [checkbox] [up] [down] icon label from the table, in the board order', () => {
  for (const [helper, column] of [['minicardSettingsRows', 'card-field-order-column-minicard'], ['cardSettingsRows', 'card-field-order-column-card']]) {
    const at = popup.indexOf(`.card-field-order-column.${column}`);
    assert.ok(at !== -1, `${column} list`);
    const list = popup.slice(at, popup.indexOf('.card-field-order-column.', at + 1) === -1 ? undefined : popup.indexOf('.card-field-order-column.', at + 1));
    assert.ok(list.includes(`each row in ${helper}`), `${column} iterates ${helper}`);
    const row = list.slice(list.indexOf('.card-field-order-row'));
    const toggle = row.indexOf('a.flex.card-field-order-toggle(class=row.toggle');
    const up = row.indexOf('js-card-field-order-up');
    const down = row.indexOf('js-card-field-order-down');
    const icons = row.indexOf('each icon in row.icons');
    const label = row.indexOf('| {{row.title}}');
    assert.ok(toggle !== -1 && up !== -1 && down !== -1 && icons !== -1 && label !== -1, `${column}: all five parts`);
    assert.ok(toggle < up && up < down && down < icons && icons < label, `${column}: checkbox, up, down, icon, label - in that order`);
    assert.ok(row.includes('{{#if row.checked}}is-checked{{/if}}'), `${column}: the checkbox reads the row's state`);
    assert.ok(row.includes('{{#unless row.canMoveUp}}is-disabled{{/unless}}'), `${column}: up disables when it would do nothing`);
    assert.ok(row.includes('{{#unless row.canMoveDown}}is-disabled{{/unless}}'), `${column}: down likewise`);
    assert.ok(row.includes('data-key="{{row.key}}"'), `${column}: the row says which field`);
  }
  assert.ok(popup.includes('data-side="minicard"') && popup.includes('data-side="card"'), 'and which side');
  // `each row in`, never plain `each`: the popup's data (side, card) must stay.
  assert.ok(!/^\s*each (minicard|card)SettingsRows/m.test(popup));
  // The two builders resolve the rows through the layout for their side.
  assert.match(sidebarJs, /cardSettingsRows\(\) \{\s*return buildCardSettingsRows\('card', this\)/);
  assert.match(sidebarJs, /minicardSettingsRows\(\) \{\s*return buildCardSettingsRows\('minicard', this\)/);
  assert.match(sidebarJs, /side === 'card' \? CARD_LAYOUT : MINICARD_LAYOUT/);
  assert.match(sidebarJs, /side === 'card' \? currentBoard\?\.cardFieldOrder : currentBoard\?\.minicardFieldOrder/);
  assert.match(sidebarJs, /rowsForSide\(side, order\)/);
});

test('the arrows are keyboard-reachable buttons titled with the existing move keys', () => {
  for (const dir of ['up', 'down']) {
    const re = new RegExp(`a\\.flex\\.card-field-order-move\\.js-card-field-order-${dir}\\(href="#" role="button"[^\\n]*title="\\{\\{_ 'card-field-order-move-${dir}'\\}\\}"`);
    assert.match(popup, re, `${dir} arrow`);
    assert.ok(en[`card-field-order-move-${dir}`], `card-field-order-move-${dir} exists`);
  }
  assert.ok(sidebarCss.includes('.card-field-order-move.is-disabled'), 'a disabled arrow is styled as such');
});

test('every locale has the heading and arrow keys (they existed before; no new key was added)', () => {
  const dir = path.join(repoRoot, 'imports/i18n/data');
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.i18n.json'))) {
    const json = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    for (const k of ['card-field-order', 'card-field-order-move-up', 'card-field-order-move-down', 'show-on-card', 'show-on-minicard']) {
      assert.ok(typeof json[k] === 'string' && json[k].length > 0, `${file} has ${k}`);
    }
  }
});

test('no hand-written row is left in the popup (negative: the table is the single source)', () => {
  assert.ok(!popup.includes('js-field-has-'), 'no js-field-has-* in the template');
  assert.ok(!popup.includes('//div.check-div'), 'no dead commented-out rows');
  assert.ok(!sidebarJade.includes('cardFieldOrderRows'), 'the old separate arrow list is gone');
});

// ── the arrows move ONE side, through the board's admin-only setters ────────

test('an arrow moves the field on its own side only, through setCardFieldOrder / setMinicardFieldOrder', () => {
  const fn = sidebarJs.slice(sidebarJs.indexOf('function moveCardSettingsRow('), sidebarJs.indexOf('Template.boardCardSettingsPopup.events('));
  assert.match(fn, /const \{ key, side \} = rowEl\.dataset/);
  assert.match(fn, /if \(side === 'minicard'\) \{\s*currentBoard\.setMinicardFieldOrder\(moveKey\(currentBoard\.minicardFieldOrder, key, direction, MINICARD_LAYOUT\)\)/);
  assert.match(fn, /currentBoard\.setCardFieldOrder\(moveKey\(currentBoard\.cardFieldOrder, key, direction, CARD_LAYOUT\)\)/);
  assert.match(sidebarJs, /'click \.js-card-field-order-up'\(evt\) \{\s*moveCardSettingsRow\(evt, 'up'\)/);
  assert.match(sidebarJs, /'click \.js-card-field-order-down'\(evt\) \{\s*moveCardSettingsRow\(evt, 'down'\)/);
  assert.ok(!/\$set: \{ (cardFieldOrder|minicardFieldOrder): /.test(sidebarJs), 'the popup never writes the order itself (negative)');
});

test('the setters normalise what they store, the schema holds both orders, and only a board admin may write them', () => {
  assert.match(boardsModel, /async setCardFieldOrder\(order\) \{[\s\S]*?\$set: \{ cardFieldOrder: applyCardOrder\(order\) \}/);
  assert.match(boardsModel, /async setMinicardFieldOrder\(order\) \{[\s\S]*?\$set: \{ minicardFieldOrder: applyMinicardOrder\(order\) \}/);
  assert.match(boardsModel, /minicardFieldOrder: \{[\s\S]*?type: Array,\s*optional: true/);
  assert.match(boardsModel, /'minicardFieldOrder\.\$': \{\s*type: String/);
  assert.match(boardsModel, /cardFieldOrder: \{[\s\S]*?type: Array,\s*optional: true/);
  // Boards.update is allowed to a board admin (or site admin) and nobody else.
  assert.match(permissions, /Boards\.allow\(\{[\s\S]*?update: allowIsBoardAdminOrSiteAdmin/);
  // Only an admin sees the arrows at all.
  assert.ok(/if canModifyBoard\n\s+a\.flex\.card-field-order-move\.js-card-field-order-up/.test(popup));
});

// ── order: the layouts' defaults ARE the templates' order ───────────────────

test('the card layout\'s default order is the order cardDetails.jade renders (derived from the template)', () => {
  const main = template(cardJade, 'cardDetails');
  const leftAt = main.indexOf('.card-details-left');
  const header = gatesOf(main.slice(0, leftAt));
  const middle = DEFAULT_CARD_FIELD_ORDER.flatMap(key => {
    const name = `cardFieldSection${key.charAt(0).toUpperCase()}${key.slice(1)}`;
    assert.ok(cardJade.includes(`template(name="${name}")`), `${name} is its own template`);
    assert.ok(main.includes(`if $eq section "${key}"\n            +${name}`), `the loop renders ${key} through +${name}`);
    return gatesOf(template(cardJade, name));
  });
  const tail = gatesOf(main.slice(leftAt));
  const gateToKey = Object.fromEntries(cardRows.map(r => [r.card.field, r.key]));
  const fromTemplate = dedupe([...header, ...middle, ...tail]).map(g => gateToKey[g]).filter(Boolean);
  const fromLayout = DEFAULT_CARD_ORDER.filter(k => fromTemplate.includes(k));
  assert.deepStrictEqual(fromLayout, fromTemplate, 'DEFAULT_CARD_ORDER is the template order');
  // Head and tail are what the template draws outside the section loop.
  assert.deepStrictEqual(CARD_LAYOUT.head, header.map(g => gateToKey[g]));
  assert.deepStrictEqual(CARD_LAYOUT.tail.filter(k => fromTemplate.includes(k)),
    dedupe(tail).map(g => gateToKey[g]).filter(Boolean));
});

test('inside a card section the fields render through the ordered*Fields loop, in the layout\'s default order', () => {
  const loops = { labels: 'orderedLabelsFields', dates: 'orderedDatesFields', members: 'orderedMembersFields',
    sort: 'orderedSortFields', voteAndPoker: 'orderedVoteAndPokerFields' };
  const gateToKey = Object.fromEntries(cardRows.map(r => [r.card.field, r.key]));
  for (const [section, helper] of Object.entries(loops)) {
    const name = `cardFieldSection${section.charAt(0).toUpperCase()}${section.slice(1)}`;
    const tpl = template(cardJade, name);
    assert.ok(tpl.includes(`each field in ${helper}`), `${name} loops ${helper}`);
    const placed = [...tpl.matchAll(/if \$eq field "([A-Za-z]+)"/g)].map(m => m[1]);
    const fields = CARD_LAYOUT.sections.find(s => s.key === section).fields;
    const expected = fields.filter(f => placed.includes(f));
    assert.deepStrictEqual(placed, expected, `${name} places its fields in default order`);
    // The gates keep their fields: each `if $eq field` is followed by its gate.
    for (const m of tpl.matchAll(/if \$eq field "([A-Za-z]+)"\n\s+if currentBoard\.(allows[A-Za-z]+)/g)) {
      assert.strictEqual(gateToKey[m[2]], m[1], `${m[2]} gates field ${m[1]}`);
    }
    // A pinned header is not in the loop: it stays first.
    const s = CARD_LAYOUT.sections.find(x => x.key === section);
    if (s.pinnedFirst) assert.ok(!placed.includes(s.fields[0]), `${s.fields[0]} is the header, outside the loop`);
    assert.ok(cardJade.includes(`Template.registerHelper('${helper}'`) || read('client/components/cards/cardDetails.js').includes(`'${helper}'`),
      `${helper} is registered globally (each section is its own template)`);
  }
});

test('the minicard layout\'s default order is the order minicard.jade renders (derived from the template)', () => {
  const body = minicardJade.slice(minicardJade.indexOf('each section in orderedMinicardSections'));
  const sections = [...body.matchAll(/if \$eq section "([A-Za-z]+)"/g)].map(m => m[1]);
  assert.deepStrictEqual(sections, MINICARD_LAYOUT.sections.map(s => s.key));
  for (const group of ['dates', 'badges']) {
    const at = body.indexOf(`if $eq section "${group}"`);
    const next = body.indexOf('if $eq section "', at + 1);
    const fields = [...body.slice(at, next).matchAll(/if \$eq field "([A-Za-z]+)"/g)].map(m => m[1]);
    assert.deepStrictEqual(fields, MINICARD_LAYOUT.sections.find(s => s.key === group).fields, `${group} fields in default order`);
  }
  assert.deepStrictEqual(MINICARD_LAYOUT.head, ['dueComplete', 'cardNumber'], 'the title bar is fixed');
  assert.ok(minicardJade.indexOf('if showCardNumber') < minicardJade.indexOf('each section in orderedMinicardSections'));
  const gateToKey = Object.fromEntries(minicardRows.map(r => [r.minicard.field, r.key]));
  // Every helper/gate under an `if $eq field` belongs to that field's row.
  for (const m of body.matchAll(/if \$eq field "([A-Za-z]+)"\n\s+if (show[A-Za-z]+|currentBoard\.allows[A-Za-z]+)/g)) {
    const gate = m[2].replace('currentBoard.', '');
    const field = minicardFields.find(f => f === gate || f === gate.replace(/^show/, 'allows') || f === `${gate.replace(/^show/, 'allows')}OnMinicard`);
    if (field) assert.strictEqual(gateToKey[field], m[1], `${m[2]} gates ${m[1]}`);
  }
  assert.ok(DEFAULT_MINICARD_ORDER.length === new Set(DEFAULT_MINICARD_ORDER).size);
});

test('minicard-only rows sit beside the row they belong with', () => {
  const rows = rowsForSide('minicard', DEFAULT_MINICARD_ORDER).map(r => r.key);
  const idx = k => rows.indexOf(k);
  assert.strictEqual(idx('labelText'), idx('labels') + 1, 'Labels text right under Labels');
  assert.strictEqual(idx('labelTextPersonal'), idx('labelText') + 1, 'the personal override right under it');
  assert.strictEqual(idx('listTitle'), idx('showLists') + 1, 'List title right under Show lists');
  assert.ok(idx('commentCount') !== -1 && idx('commentCount') < idx('comments'),
    'Comment count is a badge with its own place, above the comment preview');
  const personal = CARD_SETTINGS_ROWS.filter(r => r.minicard && r.minicard.personal).map(r => r.key);
  assert.deepStrictEqual(personal, ['labelTextPersonal', 'listTitle']);
  assert.ok(popup.includes('{{#if row.personal}}card-settings-row-personal{{/if}}'), 'personal rows keep the class CSS hides outside the minicard view');
  assert.ok(sidebarCss.includes('.board-card-settings.show-personal-only .card-field-order-row:not(.card-settings-row-personal)'));
});

console.log(`\n${passed} passed`);
