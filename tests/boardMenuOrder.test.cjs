// The Board Settings menu (boardMenuPopup, client/components/sidebar/
// sidebar.jade) is five groups divided by a rule, in this exact order:
//
//   Rules, List View, Workflow, Blocks, History, Import / Export
//   ---
//   Change color, Change Background Image, Date
//   ---
//   Board View, Swimlane, List, Scrum settings, Card
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
//
// Scrum settings joined the second group in 83eac1021 (Scrum sprint
// planning): it sits after List, under the same board-admin guard as Board
// View / Swimlane / List, and opens the Sprints view's settings rather than a
// popup of its own. The expectation below, its guard and the docs diagram
// were extended for it deliberately - the other entries' order is unchanged.
//
// The Rules page's own views joined the first group on 2026-09-30, at the
// maintainer's request: List View, Workflow, Blocks, History and Import /
// Export sit directly under Rules, under its board-admin guard, and a rule
// now separates that group from Change color. The other entries' order is
// unchanged.
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

const RULES_VIEWS = ['js-open-rules-list-view', 'js-open-rules-workflow-view',
  'js-open-rules-blocks-view', 'js-open-rules-history', 'js-open-rules-import-export'];
const EXPECTED = [
  'js-open-rules-view',
  ...RULES_VIEWS,
  'hr',
  // Scrum settings, in a group of its own above Change color (2026-10-02).
  'js-open-board-scrum-settings',
  'hr',
  'js-change-board-color',
  // #1566: the board's own announcement.
  'js-open-board-announcement',
  'js-change-background-image',
  'js-open-board-date-settings',
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

test('the Board Settings menu is Rules ... Move Board to Archive, in six groups', () => {
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
  for (const cls of RULES_VIEWS) assert.deepStrictEqual(guardsOf(cls), [admin], `${cls} is board-admin only, like Rules`);
  assert.deepStrictEqual(guardsOf('js-change-board-color'), [admin]);
  assert.deepStrictEqual(guardsOf('js-open-board-announcement'), [admin]);
  assert.deepStrictEqual(guardsOf('js-change-background-image'), [admin]);
  assert.deepStrictEqual(guardsOf('js-open-board-view-settings'), ['if currentUser', admin]);
  assert.deepStrictEqual(guardsOf('js-open-board-swimlane-settings'), ['if currentUser', admin]);
  assert.deepStrictEqual(guardsOf('js-open-board-date-settings'), [admin]);
  assert.deepStrictEqual(guardsOf('js-open-board-list-settings'), ['if currentUser', admin]);
  assert.deepStrictEqual(guardsOf('js-open-board-scrum-settings'), [admin]);
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
  assert.strictEqual(uls, 6, 'six groups, six lists');
  assert.strictEqual(sequence.filter(s => s === 'hr').length, 5, 'five rules between six groups');
  assert.ok(sequence[0] !== 'hr' && sequence[sequence.length - 1] !== 'hr', 'no rule at either end');
  assert.ok(!sequence.some((s, i) => s === 'hr' && sequence[i + 1] === 'hr'), 'no doubled rule');
});

test('the docs draw the same order', () => {
  const doc = read('docs/Features/Right-Sidebar/Board-Settings/Board-View.md');
  const diagram = doc.slice(doc.indexOf('┌─ Sidebar'), doc.indexOf('└', doc.indexOf('┌─ Sidebar')));
  const names = diagram.split('\n').slice(2)
    .map(l => (/^[│\s─]+$/.test(l) ? 'hr' : l.replace(/[│▸<-]|here/g, '').trim()))
    .filter(Boolean);
  assert.deepStrictEqual(names, [
    'Rules', 'hr', 'Scrum settings', 'hr', 'Change color', 'Change Background Image', 'Date', 'hr',
    'Board View', 'Swimlane', 'List', 'Card', 'hr',
    'Export', 'Import', 'Notifications', 'Outgoing Webhooks', 'hr',
    'Archived items', 'Move Board to Archive',
  ], 'the diagram lists the entries and rules in the menu\'s order');
});

test('each Rules view entry opens the Rules page in that view; Import / Export opens its popup', () => {
  const eventsAt = js.indexOf('Template.boardMenuPopup.events(');
  const events = js.slice(eventsAt, js.indexOf('\n});', eventsAt));
  for (const [cls, mode] of [['list-view', 'list'], ['workflow-view', 'workflow'], ['blocks-view', 'blocks'], ['history', 'history']]) {
    assert.match(events, new RegExp(`'click \\.js-open-rules-${cls}'\\(event\\) \\{ event\\.preventDefault\\(\\); openRulesViewFromBoardMenu\\('${mode}'\\); \\}`));
  }
  assert.match(events, /'click \.js-open-rules-import-export': Popup\.open\('rulesImportExport'\)/);
  const helper = js.slice(js.indexOf('function openRulesViewFromBoardMenu'), js.indexOf('Template.boardMenuPopup.events('));
  assert.match(helper, /Session\.set\('rulesViewMode', mode\)/);
  assert.match(helper, /FlowRouter\.go\('board-rules'/);
  // Negative: leaving unsaved Blocks work asks first, as the Rules page sidebar does.
  assert.match(helper, /mode !== 'blocks' && Session\.get\('rulesBlocksDirty'\) && !confirm\(TAPi18n\.__\('r-blocks-discard'\)\)\) return;/);
  // Existing, translated keys only - the Rules page's own sidebar, which used
  // them first, is gone (the page uses the board sidebar). Import / Export
  // uses the popup's own title, "Import / Export rules".
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const labels = { 'r-list-view': 'List view', 'r-workflow-view': 'Workflow view', 'r-blocks-view': 'Blocks',
    history: 'History', 'rulesImportExportPopup-title': 'Import / Export rules' };
  for (const [key, text] of Object.entries(labels)) {
    assert.ok(menu.includes(`{{_ '${key}'}}`), key);
    assert.strictEqual(en[key], text, key);
  }
});
