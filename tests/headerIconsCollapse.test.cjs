'use strict';

// #6680 follow-up: a collapse button beside the board title hides every icon
// from the mobile/desktop toggle through the notification bell, so a viewer
// who does not need them can get the whole run out of the way at once.
//
// This is a static wiring test (no Meteor runtime here), pinning:
//   - the toggle button sits right after the board title, inside the same
//     .home-icon wrapper, with an icon that swaps by state;
//   - headerIconsCollapsed()/the click handler use a plain per-session
//     Session var, the same shape as mobileMode() beside it - not a board
//     setting, since this is a personal viewing preference, not something
//     one viewer should be able to hide for everyone else;
//   - every icon in the described range carries .js-header-collapsible-icon,
//     and nothing outside that range does;
//   - the CSS actually hides marked icons when collapsed, and the NEW
//     wrapper spans stay display:contents outside that state so introducing
//     them does not change any existing icon's flex-item behavior.
//
// Run: node tests/headerIconsCollapse.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('headerIconsCollapse:');

const jade = read('client/components/main/header.jade');
const js = read('client/components/main/header.js');
const css = read('client/components/main/header.css');

test('the toggle button sits right after the board title, inside .home-icon', () => {
  const titleAt = jade.indexOf('span.header-page-title');
  const toggleAt = jade.indexOf('a.board-header-btn.js-toggle-header-icons-collapsed');
  assert.ok(titleAt !== -1 && toggleAt !== -1, 'both elements exist');
  assert.ok(toggleAt > titleAt, 'the toggle comes after the title');
  // Both are 8-space-indented children of "span.home-icon.allBoards" (6
  // spaces): the toggle line itself must be indented exactly like the title.
  const titleIndent = jade.slice(0, titleAt).match(/( *)$/)[1].length;
  const toggleIndent = jade.slice(0, toggleAt).match(/( *)$/)[1].length;
  assert.strictEqual(toggleIndent, titleIndent,
    'the toggle is a sibling of the title, not nested somewhere else');
  // And no OTHER top-level element (e.g. "// Logo", a comment at the same
  // indent as span.home-icon itself) sits between them.
  const homeIconIndent = titleIndent - 2;
  const betweenLines = jade.slice(titleAt, toggleAt).split('\n').slice(1, -1);
  for (const l of betweenLines) {
    if (!l.trim()) continue;
    const indent = l.match(/^ */)[0].length;
    assert.ok(indent > homeIconIndent, `line inside .home-icon must be indented further: "${l}"`);
  }
});

test('the icon swaps by headerIconsCollapsed, and the tooltip is translated', () => {
  const block = jade.slice(jade.indexOf('js-toggle-header-icons-collapsed'),
    jade.indexOf('js-toggle-header-icons-collapsed') + 300);
  assert.ok(/title="\{\{_ 'toggle-header-icons-collapsed'\}\}"/.test(block));
  assert.ok(/if headerIconsCollapsed/.test(block));
  assert.ok(block.includes('fa-angle-double-right') && block.includes('fa-angle-double-left'),
    'both icon states are drawn');
});

test('headerIconsCollapsed() and its click handler use a plain Session var, like mobileMode()', () => {
  assert.ok(/headerIconsCollapsed\(\) \{\s*return !!Session\.get\('wekan-header-icons-collapsed'\);/
    .test(js.replace(/\n\s*/g, ' ')), 'the helper reads the Session var');
  const at = js.indexOf("'click .js-toggle-header-icons-collapsed'");
  assert.ok(at !== -1, 'the click handler exists');
  const body = js.slice(at, js.indexOf('},', at));
  assert.ok(body.includes("Session.set('wekan-header-icons-collapsed'"),
    'the handler writes the same Session var');
  // Negative: this must NOT be a board setting (no Boards.updateAsync/
  // board.setXyz call) - it is a personal viewing preference.
  assert.ok(!/board\.set|Boards\.updateAsync/.test(body),
    'the handler never persists to the board (negative)');
});

test('every icon in the mobile-toggle-to-notifications range carries the marker class', () => {
  for (const needle of [
    '.mobile-mode-toggle.js-header-collapsible-icon',
    'js-toggle-desktop-drag-handles.js-header-collapsible-icon',
    'js-toggle-list-width-resize-lock.js-header-collapsible-icon',
    'js-toggle-same-width-for-all-lists.js-header-collapsible-icon',
    'js-toggle-swimlane-height-resize-lock.js-header-collapsible-icon',
    '.header-star-group.js-header-collapsible-icon',
    'js-create-board.js-header-collapsible-icon',
  ]) {
    assert.ok(jade.includes(needle), `expected to find: ${needle}`);
  }
  // The four template inclusions and notifications are wrapped, since a
  // Spacebars `+templateName` inclusion cannot carry a class of its own.
  for (const included of ['+boardHeaderButtons', '+allBoardsHeaderButtons',
    '+boardViewMenu', '+allBoardsViewMenu', '+adminPanelTabs', '+notifications']) {
    const at = jade.indexOf(included);
    assert.ok(at !== -1, `${included} is still included`);
    const before = jade.slice(Math.max(0, at - 60), at);
    assert.ok(/span\.js-header-collapsible-icon\s*\n\s*$/.test(before),
      `${included} is wrapped in span.js-header-collapsible-icon`);
  }
});

test('nothing outside that range carries the marker class (negative)', () => {
  for (const outside of ['home-icon', 'header-logo', 'header-account-group',
    'header-notify-icon', 'js-open-notifications']) {
    // None of these element definitions should have the collapsible class
    // directly on them - they are either before the range (home/logo) or
    // after it (the account group and its contents).
    const re = new RegExp(`${outside}[^\\n]*js-header-collapsible-icon`);
    assert.ok(!re.test(jade), `${outside} must not carry the collapsible class`);
  }
});

test('the CSS hides every marked icon when collapsed, and the new wrapper spans stay transparent otherwise', () => {
  // A data ATTRIBUTE, not an extra class on #header-quick-access's own
  // `class="{{themeColorClass}}"` binding: appending to that exact string
  // broke tests/globalThemeColor.test.cjs's count of elements using the
  // theme-color helper unmodified.
  assert.ok(/#header-quick-access\[data-header-icons-collapsed="true"\] \.js-header-collapsible-icon \{[^}]*display:\s*none\s*!important/
    .test(css.replace(/\s+/g, ' ')), 'the collapsed rule hides marked icons');
  assert.ok(/#header-quick-access \.header-quick-access-end > span\.js-header-collapsible-icon \{[^}]*display:\s*contents/
    .test(css.replace(/\s+/g, ' ')), 'the new span wrappers default to display: contents');
});

test('the root element still uses the theme-color helper unmodified, plus a data attribute', () => {
  // globalThemeColor.test.cjs counts exact `class="{{themeColorClass}}"`
  // occurrences (>=2, #header and #header-quick-access) - that string must
  // stay byte-for-byte untouched; the collapsed state rides a separate
  // data-* attribute instead of being appended into the same class string.
  assert.ok(jade.includes('class="{{themeColorClass}}" data-header-icons-collapsed="{{headerIconsCollapsed}}"'),
    'the theme-color class binding is untouched, with the data attribute beside it');
});

console.log(`\nheaderIconsCollapse: ${passed} tests passed`);
