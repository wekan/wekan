// The Board Settings menu (boardMenuPopup, client/components/sidebar/
// sidebar.jade) is four groups divided by a rule, in this exact order:
//
//   Rules, Change color, Change Background Image
//   ---
//   Board View, Swimlane, List, Card
//   ---
//   Export, Import, Notifications, Outgoing Webhooks
//   ---
//   Archived items, Move Board to Archive
//
// It used to open with Rules, Archived items, Change color, Change
// Background Image and Notifications in one group, and end with Move Board
// to Archive alone - "what has been put away" was split across the first and
// the last group and Notifications sat among the colours. This suite derives
// the sequence of entries and rules from the jade, so a reorder that drifts
// from the list above fails here rather than being noticed in a screenshot.
// The guards each entry carries are pinned too: a reorder must move entries,
// not loosen who sees them.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const jade = read('client/components/sidebar/sidebar.jade');
const js = read('client/components/sidebar/sidebar.js');

const menuAt = jade.indexOf('template(name="boardMenuPopup")');
assert.ok(menuAt !== -1, 'boardMenuPopup exists');
const menu = jade.slice(menuAt, jade.indexOf('\ntemplate(', menuAt + 1));

// Only the LIVE lines of the template: a jade `//` or `//-` comment and
// everything indented under it is dropped, so the commented-out entries
// (delete-duplicate-lists, board-info-on-my-boards) and the prose comments
// that explain where an entry went cannot register as entries.
function liveLines(src) {
  const out = [];
  let commentIndent = -1;
  for (const raw of src.split('\n')) {
    if (!raw.trim()) continue;
    const indent = raw.length - raw.trimStart().length;
    if (commentIndent !== -1 && indent > commentIndent) continue;
    commentIndent = -1;
    if (/^\s*\/\//.test(raw)) { commentIndent = indent; continue; }
    out.push({ indent, text: raw.trim() });
  }
  return out;
}
const lines = liveLines(menu);

// The sequence of entries (by their js-* class) and rules, top to bottom.
const sequence = lines
  .map(l => (l.text === 'hr' ? 'hr' : (l.text.match(/^a\.(js-[a-z-]+)/) || [])[1]))
  .filter(Boolean);

const EXPECTED = [
  'js-open-rules-view',
  'js-change-board-color',
  'js-change-background-image',
  'hr',
  'js-open-board-view-settings',
  'js-open-board-swimlane-settings',
  'js-open-board-list-settings',
  'js-open-board-card-settings',
  'hr',
  'js-export-board',
  'js-import-into-board',
  'js-open-notification-settings',
  'js-outgoing-webhooks',
  'hr',
  'js-open-archives',
  'js-archive-board',
];

test('the Board Settings menu is Rules ... Move Board to Archive, in four groups', () => {
  assert.deepStrictEqual(sequence, EXPECTED);
});

test('every entry has a click handler in boardMenuPopup.events', () => {
  const eventsAt = js.indexOf('Template.boardMenuPopup.events(');
  assert.ok(eventsAt !== -1);
  const events = js.slice(eventsAt, js.indexOf('\n});', eventsAt));
  for (const cls of EXPECTED.filter(c => c !== 'hr')) {
    // `'click .js-archive-board '` carries a trailing space in the key, which
    // jQuery's selector parser tolerates; match the class, not the quote.
    assert.ok(new RegExp(`'click \\.${cls}\\s*'`).test(events), `${cls} is handled`);
  }
});

// The guard an entry sits under: the nearest enclosing `if` / `unless`
// lines with a smaller indent, innermost last.
function guardsOf(cls) {
  const at = lines.findIndex(l => l.text.startsWith(`a.${cls}`));
  assert.ok(at !== -1, `${cls} exists`);
  const guards = [];
  let indent = lines[at].indent;
  for (let i = at - 1; i >= 0; i--) {
    if (lines[i].indent < indent) {
      indent = lines[i].indent;
      if (/^(if|unless) /.test(lines[i].text)) guards.unshift(lines[i].text);
    }
  }
  return guards;
}

test('the reorder kept every guard (negative: nothing became visible to more people)', () => {
  const admin = 'if currentUser.isBoardAdmin';
  assert.deepStrictEqual(guardsOf('js-open-rules-view'), [admin]);
  assert.deepStrictEqual(guardsOf('js-change-board-color'), [admin]);
  assert.deepStrictEqual(guardsOf('js-change-background-image'), [admin]);
  assert.deepStrictEqual(guardsOf('js-open-board-view-settings'), ['if currentUser', admin]);
  assert.deepStrictEqual(guardsOf('js-open-board-swimlane-settings'), ['if currentUser', admin]);
  assert.deepStrictEqual(guardsOf('js-open-board-list-settings'), ['if currentUser', admin]);
  assert.deepStrictEqual(guardsOf('js-open-board-card-settings'), ['if currentUser'],
    'Card stays open to any board member for its personal Labels text row');
  assert.deepStrictEqual(guardsOf('js-export-board'), ['if withApi', 'unless exportDisabled']);
  assert.deepStrictEqual(guardsOf('js-import-into-board'), ['if withApi', 'unless exportDisabled', 'if canImportIntoBoard']);
  assert.deepStrictEqual(guardsOf('js-open-notification-settings'), [admin]);
  assert.deepStrictEqual(guardsOf('js-outgoing-webhooks'), [admin]);
  assert.deepStrictEqual(guardsOf('js-open-archives'), [], 'Archived items is open to everyone who sees the board');
  assert.deepStrictEqual(guardsOf('js-archive-board'), ['unless currentBoard.isTemplatesBoard', admin]);
});

test('each group is its own ul, and a rule never follows a rule (negative)', () => {
  const uls = lines.filter(l => l.text === 'ul.pop-over-list').length;
  assert.strictEqual(uls, 4, 'four groups, four lists');
  assert.strictEqual(sequence.filter(s => s === 'hr').length, 3, 'three rules between four groups');
  assert.ok(sequence[0] !== 'hr' && sequence[sequence.length - 1] !== 'hr', 'no rule at either end');
  assert.ok(!sequence.some((s, i) => s === 'hr' && sequence[i + 1] === 'hr'), 'no doubled rule');
});

test('the docs draw the same order', () => {
  const doc = read('docs/Features/Board/Board-View-Settings.md');
  const diagram = doc.slice(doc.indexOf('┌─ Sidebar'), doc.indexOf('└', doc.indexOf('┌─ Sidebar')));
  const names = diagram.split('\n').slice(2)
    .map(l => (/^[│\s─]+$/.test(l) ? 'hr' : l.replace(/[│▸<-]|here/g, '').trim()))
    .filter(Boolean);
  assert.deepStrictEqual(names, [
    'Rules', 'Change color', 'Change Background Image', 'hr',
    'Board View', 'Swimlane', 'List', 'Card', 'hr',
    'Export', 'Import', 'Notifications', 'Outgoing Webhooks', 'hr',
    'Archived items', 'Move Board to Archive',
  ], 'the diagram lists the entries and rules in the menu\'s order');
});
