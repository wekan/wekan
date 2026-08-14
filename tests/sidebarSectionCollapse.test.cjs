'use strict';

// The board sidebar's sections fold by their headings.
// Run: node tests/sidebarSectionCollapse.test.cjs
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
const state = read('client/lib/sidebarSectionState.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('sidebarSectionCollapse:');

const members = jade.slice(jade.indexOf('template(name="membersWidget")'),
  jade.indexOf('template(name="boardOrgGeneral")'));
const labels = jade.slice(jade.indexOf('template(name="labelsWidget")'),
  jade.indexOf('template(name="memberPopup")'));

test('Members has a caret at the start of its heading', () => {
  assert.ok(/h3\.js-toggle-sidebar-section\(data-section="members"/.test(members),
    'the heading is the button');
  assert.ok(/i\.fa\(class="\{\{sidebarSectionCaret 'members'\}\}"\)/.test(members),
    'with a caret drawn from the section state');
  assert.ok(members.indexOf('sidebarSectionCaret') < members.indexOf('fa-users'),
    'at the LEFT of the members icon, before the name');
});

test('folding Members hides the tabs and the avatars in them', () => {
  assert.ok(/if isSidebarSectionOpen 'members'\n\s+\+basicTabs\(tabs=tabs\)/.test(members),
    'the whole tab strip is inside the fold');
  // The avatars live in the tab contents, so they go with it; this pins that
  // they are still INSIDE basicTabs and not left behind beside it.
  const open = members.slice(members.indexOf("if isSidebarSectionOpen 'members'"));
  assert.ok(open.indexOf('+basicTabs') < open.indexOf('+userAvatar'),
    'the avatars are under the tabs, which are under the fold');
});

test('Labels has the same caret, and folds its labels', () => {
  assert.ok(/h3\.js-toggle-sidebar-section\(data-section="labels"/.test(labels),
    'the heading is the button');
  assert.ok(labels.indexOf('sidebarSectionCaret') < labels.indexOf('fa-tag'),
    'the caret comes before the tag icon');
  assert.ok(/if isSidebarSectionOpen 'labels'\n\s+\.board-widget-content/.test(labels),
    'the labels under the heading are inside the fold');
  assert.ok(/\.board-widget-content\n\s+each currentBoard\.labels/.test(labels),
    'and they are still INSIDE that content box, not siblings of it');
  assert.ok(/if currentUser\.isBoardAdmin\n\s+a\.card-label\.add-label\.js-add-label/.test(labels),
    'so is the + that creates one');
});

test('one handler, one rule, for both headings', () => {
  assert.ok(/'click \.js-toggle-sidebar-section'\(event\)/.test(js), 'a click folds');
  assert.ok(/'keydown \.js-toggle-sidebar-section'\(event\)/.test(js),
    'and Enter or Space does the same - the heading says role="button"');
  assert.ok(/event\.key !== 'Enter' && event\.key !== ' '/.test(js), 'only those two keys');
  assert.ok(/toggleSidebarSection\(event\.currentTarget\.dataset\.section\)/.test(js),
    'the section names itself in the markup');
  assert.ok(/h3\.js-toggle-sidebar-section \{[^}]*cursor: pointer/.test(css),
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

console.log(`\nsidebarSectionCollapse: ${passed} tests passed`);
