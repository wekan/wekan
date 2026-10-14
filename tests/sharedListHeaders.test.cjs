'use strict';

// #2805: one shared, sticky list header row for all swimlanes, as a board
// view setting. Source-read test (CSS and Blaze; no browser here).
// Run: node tests/sharedListHeaders.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// The setting: a board field, off by default, toggled in Board Settings / Swimlane.
const boards = read('models/boards.js');
assert.match(boards, /sharedListHeaders: \{[\s\S]{0,400}type: Boolean,\s*optional: true,\s*\},/);
assert.doesNotMatch(boards.slice(boards.indexOf('sharedListHeaders: {'), boards.indexOf('sharedListHeaders: {') + 500), /defaultValue: true/, 'off by default');
assert.match(boards, /hasSharedListHeaders\(\) \{\s*return this\.sharedListHeaders === true;/);
const sidebarJade = read('client/components/sidebar/sidebar.jade');
const popup = sidebarJade.slice(sidebarJade.indexOf('template(name="boardSwimlaneSettingsPopup")'), sidebarJade.indexOf('template(name="boardListSettingsPopup")'));
assert.match(popup, /a\.flex\.js-toggle-shared-list-headers/);
assert.match(read('client/components/sidebar/sidebar.js'), /'click \.js-toggle-shared-list-headers'\(\) \{[\s\S]{0,200}board\.setSharedListHeaders\(!board\.hasSharedListHeaders\(\)\);/);
console.log('  ok - a board setting, off by default, in Board Settings / Swimlane');

// Positive: the canvas gets the class and the first swimlane is marked.
assert.match(read('client/components/boards/boardBody.jade'), /class="\{\{#if currentBoard\.hasSharedListHeaders\}\}shared-list-headers\{\{\/if\}\}"/);
assert.match(read('client/components/swimlanes/swimlanes.jade'), /class="\{\{#if isFirstSwimlane\}\}is-first-swimlane\{\{\/if\}\}"/);
assert.match(read('client/components/swimlanes/swimlanes.js'), /isFirstSwimlane\(\) \{[\s\S]{0,300}first\._id === this\._id/);
const css = read('client/components/swimlanes/swimlanes.css');
assert.match(read('client/components/lists/list.js'), /stickyListHeaders\(\) \{[\s\S]{0,300}board\.getStickyListHeaders\(\) \|\| \(board\.hasSharedListHeaders && board\.hasSharedListHeaders\(\)\)/,
  'the shared row pins through the existing sticky rule (#3847), not a second one');
console.log('  ok - the first swimlane\'s headers stay at the top');

// Negative: the one rule is scoped to the setting, so a board without it is
// drawn exactly as before, and no second sticky mechanism exists.
const rules = css.slice(css.indexOf('/* #2805: one shared'));
assert.match(rules, /\*\/\n\.board-canvas\.shared-list-headers \.js-swimlane:not\(\.is-first-swimlane\) \.list-header \{\s*display: none;\s*\}\s*$/);
assert.doesNotMatch(rules, /position: sticky/);
console.log('  ok - only boards with the setting change');
console.log('\nsharedListHeaders: all tests passed');
