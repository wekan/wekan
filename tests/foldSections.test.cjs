'use strict';

// The board's chrome folds: the sidebar's sections, and the header's controls.
// Run: node tests/foldSections.test.cjs
//
// Activities got a caret first, replacing an eye and the words "Show
// activities" beside it. Members and Labels are the two sections above it, and
// they had no way to fold at all: the People / Organizations / Teams / Domains
// tabs with their avatars, and every label of the board, were always open and
// pushed everything below them down the panel.
//
// They fold now, by the same control an opened card's sections use: the heading
// is the button, a caret in front of it says which way it is, and clicking it
// hides what belongs to that heading.
//
// Activities is deliberately NOT in the shared store: it has a board setting of
// its own (`board.showActivities`) that also decides what the publication
// sends, so its caret writes that instead. Members and Labels decide nothing on
// the server, so they are a per-session choice of the reader's.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const jade = read('client/components/sidebar/sidebar.jade');
const js = read('client/components/sidebar/sidebar.js');
const css = read('client/components/sidebar/sidebar.css');
const state = read('client/lib/foldState.js');
const headerJade = read('client/components/boards/boardHeader.jade');
const headerJs = read('client/components/boards/boardHeader.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('foldSections:');

const members = jade.slice(jade.indexOf('template(name="membersWidget")'),
  jade.indexOf('template(name="boardOrgGeneral")'));
const labels = jade.slice(jade.indexOf('template(name="labelsWidget")'),
  jade.indexOf('template(name="memberPopup")'));

test('Members has a caret at the start of its heading', () => {
  assert.ok(/h3\.js-toggle-fold\(data-fold="members"/.test(members),
    'the heading is the button');
  assert.ok(/i\.fa\(class="\{\{foldCaret 'members'\}\}"\)/.test(members),
    'with a caret drawn from the section state');
  assert.ok(members.indexOf('foldCaret') < members.indexOf('fa-users'),
    'at the LEFT of the members icon, before the name');
});

test('folding Members hides the tabs and the avatars in them', () => {
  assert.ok(/if isFoldOpen 'members'\n\s+\+basicTabs\(tabs=tabs\)/.test(members),
    'the whole tab strip is inside the fold');
  // The avatars live in the tab contents, so they go with it; this pins that
  // they are still INSIDE basicTabs and not left behind beside it.
  const open = members.slice(members.indexOf("if isFoldOpen 'members'"));
  assert.ok(open.indexOf('+basicTabs') < open.indexOf('+userAvatar'),
    'the avatars are under the tabs, which are under the fold');
});

test('Labels has the same caret, and folds its labels', () => {
  assert.ok(/h3\.js-toggle-fold\(data-fold="labels"/.test(labels),
    'the heading is the button');
  assert.ok(labels.indexOf('foldCaret') < labels.indexOf('fa-tag'),
    'the caret comes before the tag icon');
  assert.ok(/if isFoldOpen 'labels'\n\s+\.board-widget-content/.test(labels),
    'the labels under the heading are inside the fold');
  assert.ok(/\.board-widget-content\n\s+each currentBoard\.labels/.test(labels),
    'and they are still INSIDE that content box, not siblings of it');
  assert.ok(/if currentUser\.isBoardAdmin\n\s+a\.card-label\.add-label\.js-add-label/.test(labels),
    'so is the + that creates one');
});

test('one handler, one rule, for both headings', () => {
  assert.ok(/'click \.js-toggle-fold'\(event\)/.test(js), 'a click folds');
  assert.ok(/'keydown \.js-toggle-fold'\(event\)/.test(js),
    'and Enter or Space does the same - the heading says role="button"');
  assert.ok(/event\.key !== 'Enter' && event\.key !== ' '/.test(js), 'only those two keys');
  assert.ok(/toggleFold\(event\.currentTarget\.dataset\.fold\)/.test(js),
    'the section names itself in the markup');
  assert.ok(/h3\.js-toggle-fold \{[^}]*cursor: pointer/.test(css),
    'and a mouse sees a button');
});

test('an unknown section is OPEN, not hidden (negative)', () => {
  // A section added later must show up rather than disappear because nobody
  // ever wrote a `true` for it.
  assert.ok(/state === undefined \? true : state/.test(state), 'default open');
  assert.ok(/caretClassFor/.test(state),
    'and the caret comes from the shared rule, so it points the same way as a card\'s');
});

test('the choice is the reader\'s, and is not a board setting (negative)', () => {
  // Members and Labels decide nothing on the server: folding them must not
  // write to the board, where it would fold for everybody.
  assert.ok(/new ReactiveDict\(\)/.test(state), 'module-level, per session');
  assert.ok(!/Boards\.update|Meteor\.call/.test(state), 'nothing is stored on the board');
  // Activities is the opposite, and stays where it is.
  assert.ok(/toggleShowActivities\(\)/.test(js),
    'Activities still writes its own board setting, which the publication reads');
  assert.ok(/showActivities/.test(state),
    'and the module says why it is not one of these');
});

// ── the first header bar's board controls ──────────────────────────────────

const controls = headerJade.slice(headerJade.indexOf('template(name="boardHeaderButtons")'),
  headerJade.indexOf('template(name="boardVisibilityList")'));

test('a caret leads the board controls, before the lock', () => {
  assert.ok(/a\.board-header-btn\.js-toggle-fold\(data-fold="board-controls"/.test(controls),
    'a button of its own, in the same bar');
  assert.ok(controls.indexOf('js-toggle-fold') < controls.indexOf('js-change-visibility'),
    'at the start of the group - left of the lock in a left-to-right page');
  assert.ok(/i\.fa\(class="\{\{foldCaret 'board-controls'\}\}"\)/.test(controls),
    'and it is the same caret, so it mirrors in RTL by itself');
});

test('folding hides the seven controls it was asked to hide', () => {
  const folded = ['js-change-visibility', 'js-watch-board', 'js-sort-cards',
    'js-open-filter-view', 'js-open-search-view', 'js-toggle-dependencies',
    'js-multiselection-activate'];
  for (const control of folded) {
    const at = controls.indexOf(control);
    assert.ok(at !== -1, `${control} is in the bar`);
    const before = controls.lastIndexOf("if isFoldOpen 'board-controls'", at);
    assert.ok(before !== -1, `${control} is inside the fold`);
  }
});

test('a board\'s own Rules buttons are NOT folded away (negative)', () => {
  // Somebody added those to this board on purpose; they are not part of the
  // standard control set the caret hides.
  const at = controls.indexOf('+boardButtons');
  assert.ok(at !== -1, 'the rule buttons are still there');
  const line = controls.slice(controls.lastIndexOf('\n', at) + 1, at + 14);
  assert.strictEqual(line.trim(), '+boardButtons');
  assert.strictEqual(line.length - line.trimStart().length, 8,
    'at the group\'s own indentation, outside both fold blocks');
});

test('the caret is named by words the app already has (negative)', () => {
  assert.ok(/\{\{_ 'collapse'\}\}/.test(controls) && /\{\{_ 'uncollapse'\}\}/.test(controls),
    'Collapse and Uncollapse, so no new key in 147 language files');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.ok(en.collapse && en.uncollapse, 'and both exist');
  assert.ok(!en['board-header-controls'], 'no key was invented for it');
});

test('the header has its own handler, on the same class', () => {
  // A Blaze event map only sees its own template: the sidebar's handler cannot
  // catch a click in the header bar.
  assert.ok(/'click \.js-toggle-fold'\(event\)/.test(headerJs), 'a click folds');
  assert.ok(/'keydown \.js-toggle-fold'\(event\)/.test(headerJs), 'and so do Enter and Space');
  assert.ok(/toggleFold\(event\.currentTarget\.dataset\.fold\)/.test(headerJs),
    'through the same store as the sidebar');
  assert.ok(/role="button" tabindex="0"/.test(controls), 'and the caret says it is a button');
});

console.log(`\nfoldSections: ${passed} tests passed`);
