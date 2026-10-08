'use strict';
// Admin Panel / Settings / Visibility / Features: the card fields every board
// shows (models/lib/cardFieldVisibility.js). One tick per field type of Board
// Settings / Card, all ticked by default; an unticked field is hidden on every
// card, minicard and Board Settings / Card - visibility only.
// Run: node tests/cardFieldVisibility.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const v = require('../models/lib/cardFieldVisibility');
const { CARD_SETTINGS_ROWS } = require('../models/lib/cardSettingsRows');
const { columnFields, columnModifier, columnScrumVisibility } = require('../models/lib/boardSettingsColumns');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const hide = (...keys) => ({ cardFieldStates: Object.fromEntries(keys.map(key => [key, false])) });

// A board document as the client's Boards collection returns it: fields on
// the object, helpers on its prototype.
class BoardDoc {
  constructor(fields) { Object.assign(this, fields); }
  getCardFieldOrder() { return this.cardFieldOrder || ['default']; }
}
const boardFields = () => ({
  _id: 'b1', title: 'Board', allowsPomodoro: true, allowsPomodoroOnMinicard: true,
  allowsFlowtime: true, showLabelText: true, allowsLabelTextOnCard: true,
  scrum: { visibility: { cardSprint: true, minicardSprint: true, cardRelease: true } },
  cardFieldOrder: ['labels', 'pomodoro'],
});

test('the catalog is Board Settings / Card: one entry per field type, the personal Labels text folded in', () => {
  const rowKeys = CARD_SETTINGS_ROWS.map(row => row.key);
  assert.deepEqual(v.CARD_FIELD_KEYS, rowKeys.filter(key => key !== 'labelTextPersonal'));
  assert.equal(new Set(v.CARD_FIELD_KEYS).size, v.CARD_FIELD_KEYS.length, 'each field type once');
  assert.equal(v.fieldKeyOfRow('labelTextPersonal'), 'labelText');
  assert.equal(v.fieldKeyOfRow('pomodoro'), 'pomodoro');
  for (const field of v.CARD_FIELDS) {
    const row = CARD_SETTINGS_ROWS.find(r => r.key === field.key);
    assert.deepEqual(field.label, row.label, `${field.key} reuses the row's own label`);
    assert.deepEqual(field.icons, row.icons, `${field.key} reuses the row's own icons`);
  }
});

test('default: everything enabled, for a missing, empty or odd setting', () => {
  for (const setting of [undefined, null, {}, { cardFieldStates: null }, { cardFieldStates: [] },
    { cardFieldStates: 'x' }, { cardFieldStates: { pomodoro: 'false' } }]) {
    assert.deepEqual(v.hiddenCardFieldKeys(setting), []);
    for (const key of v.CARD_FIELD_KEYS) assert.equal(v.isCardFieldEnabled(setting, key), true, key);
    assert.ok(v.cardFieldRows(setting).every(row => row.enabled));
  }
});

test('the admin rows carry a tick and no order', () => {
  const rows = v.cardFieldRows(hide('pomodoro'));
  assert.equal(rows.length, v.CARD_FIELD_KEYS.length);
  assert.equal(rows.find(r => r.key === 'pomodoro').enabled, false);
  assert.equal(rows.find(r => r.key === 'flowtime').enabled, true);
  for (const row of rows) {
    assert.deepEqual(Object.keys(row).sort(), ['enabled', 'icons', 'key', 'label', 'labelSeparator']);
  }
});

test('nothing hidden: the client gets the very same board object', () => {
  const board = new BoardDoc(boardFields());
  assert.equal(v.applyCardFieldVisibility(board, {}), board);
  assert.equal(v.applyCardFieldVisibility(board, undefined), board);
  assert.equal(v.applyCardFieldVisibility(null, hide('pomodoro')), null);
  assert.equal(v.applyCardFieldVisibility(undefined, hide('pomodoro')), undefined);
});

test('unticking Pomodoro hides it on the card and the minicard, and leaves the board untouched', () => {
  const fields = boardFields();
  const board = new BoardDoc(fields);
  const before = JSON.stringify(board);
  const view = v.applyCardFieldVisibility(board, hide('pomodoro'));
  assert.notEqual(view, board);
  assert.equal(view.allowsPomodoro, false, 'card side');
  assert.equal(view.allowsPomodoroOnMinicard, false, 'minicard side');
  assert.equal(view.allowsFlowtime, true, 'other fields keep the board value');
  assert.equal(view._id, 'b1');
  assert.equal(view.getCardFieldOrder()[0], 'labels', 'board helpers still work on the view');
  assert.ok(view instanceof BoardDoc);
  assert.equal({ ...view }.allowsPomodoro, false, 'a spread copy keeps the fields');
  assert.equal({ ...view }.title, 'Board');
  assert.equal(JSON.stringify(board), before, 'the board document is not changed (data untouched)');
  assert.equal(board.allowsPomodoro, true);
  assert.equal(Object.keys(view).includes('__hiddenCardFields'), false, 'the mark is not enumerable');
  assert.equal(v.isCardFieldHiddenOnBoard(view, 'pomodoro'), true);
  assert.equal(v.isCardFieldHiddenOnBoard(board, 'pomodoro'), false);
});

test('re-ticking restores the board\'s own choice', () => {
  const board = new BoardDoc({ ...boardFields(), allowsPomodoro: false, allowsPomodoroOnMinicard: true });
  const hidden = v.applyCardFieldVisibility(board, hide('pomodoro'));
  assert.equal(hidden.allowsPomodoroOnMinicard, false);
  const restored = v.applyCardFieldVisibility(board, { cardFieldStates: { pomodoro: true } });
  assert.equal(restored, board);
  assert.equal(restored.allowsPomodoro, false, 'the board had it off on the card');
  assert.equal(restored.allowsPomodoroOnMinicard, true, 'and on on the minicard');
});

test('the view is cached per board and hidden set', () => {
  const board = new BoardDoc(boardFields());
  const a = v.applyCardFieldVisibility(board, hide('pomodoro'));
  assert.equal(v.applyCardFieldVisibility(board, hide('pomodoro')), a);
  const b = v.applyCardFieldVisibility(board, hide('pomodoro', 'flowtime'));
  assert.notEqual(b, a);
  assert.equal(b.allowsFlowtime, false);
});

test('every side of a hidden row reads off: plain flags, Labels text, Scrum fields', () => {
  const board = new BoardDoc(boardFields());
  const all = v.applyCardFieldVisibility(board, { cardFieldStates: Object.fromEntries(v.CARD_FIELD_KEYS.map(k => [k, false])) });
  for (const row of CARD_SETTINGS_ROWS) {
    for (const side of ['card', 'minicard']) {
      const spec = row[side];
      if (spec.scrum) assert.equal(all.scrum.visibility[spec.scrum], false, `${row.key} ${side}`);
      else if (!spec.personal) assert.equal(all[v.boardFieldOfSide(spec)], false, `${row.key} ${side}`);
      else assert.equal(v.isCardFieldHiddenOnBoard(all, row.key), true, `${row.key} ${side}`);
    }
  }
  const labels = v.applyCardFieldVisibility(board, hide('labelText'));
  assert.equal(labels.showLabelText, false);
  assert.equal(labels.allowsLabelTextOnCard, false);
  assert.equal(v.isCardFieldHiddenOnBoard(labels, 'labelTextPersonal'), true, 'the personal override follows');
  const sprint = v.applyCardFieldVisibility(board, hide('scrumSprint'));
  assert.equal(sprint.scrum.visibility.cardSprint, false);
  assert.equal(sprint.scrum.visibility.minicardSprint, false);
  assert.equal(sprint.scrum.visibility.cardRelease, true);
  assert.equal(board.scrum.visibility.cardSprint, true, 'the board\'s Scrum settings are not changed');
});

test('Board Settings / Card: a hidden field\'s rows are not offered', () => {
  const setting = hide('pomodoro', 'labelText');
  const offered = CARD_SETTINGS_ROWS.filter(row => v.isRowVisible(setting, row.key)).map(row => row.key);
  assert.ok(!offered.includes('pomodoro'));
  assert.ok(!offered.includes('labelText'));
  assert.ok(!offered.includes('labelTextPersonal'));
  assert.ok(offered.includes('flowtime'));
  const sidebar = read('client/components/sidebar/sidebar.js');
  assert.match(sidebar, /\.filter\(row => isRowVisible\(ReactiveCache\.getCurrentSetting\(\), row\.key\)\)/);
});

test('the whole-column tick leaves a hidden field\'s board value as it was', () => {
  assert.deepEqual(columnFields('card', 'card'), columnFields('card', 'card', []), 'nothing hidden: unchanged');
  const hidden = ['pomodoro', 'labelText', 'scrumSprint'];
  const card = columnFields('card', 'card', hidden);
  const minicard = columnFields('card', 'minicard', hidden);
  assert.ok(!card.includes('allowsPomodoro') && columnFields('card', 'card').includes('allowsPomodoro'));
  assert.ok(!minicard.includes('allowsPomodoroOnMinicard'));
  assert.ok(!minicard.includes('showLabelText'));
  assert.ok(!('allowsPomodoro' in columnModifier('card', 'card', true, hidden).$set));
  assert.ok(!('cardSprint' in columnScrumVisibility('card', 'card', true, hidden)));
  assert.ok('cardRelease' in columnScrumVisibility('card', 'card', true, hidden));
  const server = read('server/moveBoardObjects.js');
  assert.match(server, /columnModifier\(section, column, enabled, hidden\)/);
  assert.match(server, /columnScrumVisibility\(section, column, enabled, hidden\)/);
});

test('saving: every catalog key explicit and boolean; unknown keys refused (negative)', () => {
  const all = Object.fromEntries(v.CARD_FIELD_KEYS.map(key => [key, key !== 'pomodoro']));
  const ok = v.cardFieldStatesValue(all);
  assert.equal(ok.cardFieldStates.pomodoro, false);
  assert.equal(ok.cardFieldStates.flowtime, true);
  assert.deepEqual(Object.keys(ok.cardFieldStates), v.CARD_FIELD_KEYS);
  assert.deepEqual(v.cardFieldStatesValue({ ...all, bogus: false }), { error: 'unknown-card-field', keys: ['bogus'] });
  assert.deepEqual(v.cardFieldStatesValue({ ...all, labelTextPersonal: true }).error, 'unknown-card-field');
  assert.equal(v.cardFieldStatesValue({ ...all, pomodoro: 'false' }).error, 'invalid');
  const missing = { ...all };
  delete missing.flowtime;
  assert.equal(v.cardFieldStatesValue(missing).error, 'invalid');
  for (const bad of [null, undefined, [], 'x', 1]) assert.equal(v.cardFieldStatesValue(bad).error, 'invalid');
});

test('the server saves it in the site-admin-only Features method (negative: no other path)', () => {
  const method = read('server/methods/instanceFeatures.js');
  const body = method.slice(method.indexOf('async saveInstanceFeatures(input)'));
  assert.ok(body.indexOf('await requireSiteAdmin()') < body.indexOf('cardFieldStatesValue(cardFields)'),
    'the admin check runs before anything is read or stored');
  assert.match(method, /if \(user\?\.isAdmin !== true\) throw new Meteor\.Error\('error-notAuthorized'\)/);
  assert.match(body, /cardFields: Match\.Optional\(Object\)/);
  assert.match(body, /throw new Meteor\.Error\('invalid-card-fields', value\.error\)/);
  // Nothing else writes cardFieldStates.
  const writers = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      if (['node_modules', '.meteor', '_build', '.build', '.tools'].includes(entry.name)) continue;
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(rel);
      else if (/\.js$/.test(entry.name) && /cardFieldStates\s*[:=]|'cardFieldStates'|"cardFieldStates"/.test(read(rel))) writers.push(rel);
    }
  };
  ['server', 'client', 'models', 'imports'].forEach(walk);
  assert.deepEqual(writers.sort(), ['models/lib/cardFieldVisibility.js', 'models/settings.js',
    'server/methods/instanceFeatures.js', 'server/publications/settings.js'].sort());
  assert.match(read('models/settings.js'), /cardFieldStates: \{\s*type: Object,\s*optional: true,\s*blackbox: true,/);
  assert.match(read('server/publications/settings.js'), /\n  cardFieldStates: 1,/);
});

test('the client hides it at the one board read the card and minicard use', () => {
  const cache = read('imports/reactiveCache.js');
  const client = cache.slice(cache.indexOf('const ReactiveCacheClient = {'));
  const getBoard = client.slice(client.indexOf('getBoard(idOrFirstObjectSelector'), client.indexOf('getBoards(', client.indexOf('getBoard(idOrFirstObjectSelector')));
  assert.match(getBoard, /return applyCardFieldVisibility\(ret, this\.getCurrentSetting\(\)\);/);
  // The server's board read is NOT wrapped: publications, the REST API and
  // exports see the board as stored.
  const server = cache.slice(0, cache.indexOf('const ReactiveCacheClient = {'));
  assert.ok(!server.includes('applyCardFieldVisibility('), 'the server read is untouched');
  // The two reads that are not a board flag.
  assert.match(read('client/components/cards/minicard.js'), /isCardFieldHiddenOnBoard\(currentBoard, 'listTitle'\)/);
  assert.match(read('client/components/cards/cardDetails.js'), /isCardFieldHiddenOnBoard\(board, 'listTitle'\)/);
  const label = read('client/lib/minicardLabelText.js');
  assert.equal((label.match(/isCardFieldHiddenOnBoard\(board, 'labelText'\)/g) || []).length, 2);
});

test('the Admin Panel section: ticks above the Features Save, and no ordering (negative)', () => {
  const jade = read('client/components/settings/settingBody.jade');
  const rows = jade.indexOf('each cardFieldRows');
  const save = jade.indexOf('button.js-visibility-features-save');
  assert.ok(rows > jade.indexOf('each featureRows') && rows < save, 'inside Features, above its Save');
  const section = jade.slice(rows, save);
  assert.match(section, /li\.tableVisibilityMode-form\.js-card-field-row\(data-card-field=key\)/);
  assert.match(section, /\.materialCheckBox\.js-card-field-enabled/);
  for (const forbidden of ['sortable', 'drag', 'handle', 'card-field-order', 'fa-arrow-up', 'fa-arrow-down', 'js-move']) {
    assert.ok(!section.includes(forbidden), `no ordering UI: ${forbidden}`);
  }
  const js = read('client/components/settings/settingBody.js');
  assert.match(js, /cardFields\[row\.dataset\.cardField\] = \$\(row\)\.find\('\.js-card-field-enabled'\)\.hasClass\('is-checked'\)/);
  assert.match(js, /pilotUsernames: instance\.\$\('#feature-pilot-users'\)\.val\(\) \|\| '',\s*cardFields,/);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.ok(en['card-field-visibility'] && en['card-field-visibility-desc']);
  for (const field of v.CARD_FIELDS) for (const key of field.label) assert.ok(en[key], `label ${key} exists`);
});

console.log(`\ncardFieldVisibility: ${passed} passed`);
