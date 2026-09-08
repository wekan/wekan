'use strict';

// Calendar view's FullCalendar header toolbar (client/components/boards/
// boardBody.js). Today/Previous/Next used to be their own group under the
// title, with Day/Week/Month view toggles in a third, CENTER group that
// pushed everything onto a second row below the title (.tools/calendar.png).
// All the buttons now sit together in ONE group on the right of the title,
// which stays alone on the left and is vertically centered against them.
// Run: node tests/calendarToolbarLayout.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('calendarToolbarLayout:');

const js = read('client/components/boards/boardBody.js');
const css = read('client/components/boards/calendarView.css');

test('the title is alone on the left, with no other buttons in its group', () => {
  const at = js.indexOf('headerToolbar:');
  assert.ok(at !== -1, 'headerToolbar config exists');
  const block = js.slice(at, js.indexOf('buttonIcons', at));
  assert.match(block, /left:\s*'title'/);
});

test('every button - today/prev/next AND the three view toggles - is one group on the right', () => {
  const at = js.indexOf('headerToolbar:');
  const block = js.slice(at, js.indexOf('buttonIcons', at));
  assert.match(block, /center:\s*''/, 'no separate center group left to force a second row');
  assert.match(block,
    /right:\s*\n?\s*'today prev,next timeGridDay,listDay timeGridWeek,listWeek dayGridMonth,listMonth'/);
});

test('the toolbar is forced to one row, and the title is vertically centered in it (negative on wrap)', () => {
  const at = css.indexOf('.calendar-view .fc-header-toolbar {');
  assert.ok(at !== -1, 'the toolbar rule exists');
  const rule = css.slice(at, css.indexOf('}', at));
  assert.match(rule, /display:\s*flex/);
  assert.match(rule, /flex-wrap:\s*nowrap/, 'nothing wraps the buttons onto a second row');
  assert.match(rule, /align-items:\s*center/, 'title and buttons sit at the same vertical level');
});

test('the title (an <h2>, inheriting the global h2 bottom margin) has that margin cleared', () => {
  const at = css.indexOf('.calendar-view .fc-toolbar-title {');
  assert.ok(at !== -1, 'the title rule exists');
  const rule = css.slice(at, css.indexOf('}', at));
  assert.match(rule, /margin:\s*0\b/,
    "global layouts.css's `h2 { margin: 0 0 7px }` must not offset the title from the buttons");
});

console.log(`\ncalendarToolbarLayout: ${passed} tests passed`);
