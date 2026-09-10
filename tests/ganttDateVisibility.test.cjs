'use strict';

// All four of WeKan's card dates (Received, Start, Due, End) must be visible
// somewhere in each of the three Gantt/Calendar views, and the "normally
// used" Gantt features (drag-to-reschedule persisted back to the right
// field, click-to-open, permission-gated editing) must actually be wired up
// - not just present in a vendored library's default behavior.
//
// Comparison baseline: Kanboard's Gantt (kanboard/plugin-gantt, MIT) supports
// drag-to-move, drag-to-resize (both persisted via AJAX), a data-readonly
// flag that disables both for users without write access, and click-to-open.
// It does NOT support dependency arrows, zoom/view-mode switching, or
// export - Frappe/DHTMLX Gantt exceed it there for free; nothing to match.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const frappe = read('client/components/gantt/frappeGantt.js');
const dhtmlx = read('client/components/gantt/dhtmlxGantt.js');

// --- All four dates are tracked and shown, even though the bar itself only
// ever represents two of them (Start/Due, or their Received/End fallbacks).
for (const [name, source] of [['Frappe Gantt', frappe], ['DHTMLX Gantt', dhtmlx]]) {
  assert.match(source, /_startField/, `${name} tracks which field the bar's start edge represents`);
  assert.match(source, /_endField/, `${name} tracks which field the bar's end edge represents`);
  assert.match(source, /_received/, `${name} carries the card's Received date onto the task`);
  assert.match(source, /_cardStart/, `${name} carries the card's Start date onto the task`);
  assert.match(source, /_due/, `${name} carries the card's Due date onto the task`);
  assert.match(source, /_end/, `${name} carries the card's End date onto the task`);
  assert.match(source, /card-received/, `${name} labels the Received row with the real translation key`);
  assert.match(source, /card-start/, `${name} labels the Start row with the real translation key`);
  assert.match(source, /card-due/, `${name} labels the Due row with the real translation key`);
  assert.match(source, /card-end/, `${name} labels the End row with the real translation key`);
}
assert.match(frappe, /function popupDetailsHtml\(task\)/, 'Frappe Gantt renders all four dates into its click popup');
assert.match(frappe, /popup\(\{ task, set_details \}\)/);
assert.match(dhtmlx, /function tooltipHtml\(task\)/, 'DHTMLX Gantt renders all four dates into its hover tooltip');
assert.match(dhtmlx, /gantt\.templates\.tooltip_text = /);

// --- Drag-to-reschedule is wired and writes back to the CORRECT field (not
// blindly to Start/Due when the bar fell back to Received/End).
assert.match(frappe, /on_date_change\(task, start, end\)/);
assert.match(frappe, /if \(task\._startField === 'receivedAt'\) card\.setReceived\(start\)/);
assert.match(frappe, /else card\.setStart\(start\)/);
assert.match(frappe, /if \(task\._endField === 'endAt'\) card\.setEnd\(end\)/);
assert.match(frappe, /else card\.setDue\(end\)/);

assert.match(dhtmlx, /gantt\.attachEvent\('onAfterTaskDrag'/);
assert.match(dhtmlx, /if \(task\._startField === 'receivedAt'\) card\.setReceived\(task\.start_date\)/);
assert.match(dhtmlx, /if \(task\._endField === 'endAt'\) card\.setEnd\(end\)/);
// Negative: must NOT use the generic onAfterTaskUpdate, which also fires for
// the reactive re-render's own gantt.parse() call and would write back on
// every unrelated Cards change (an infinite echo risk).
assert.doesNotMatch(dhtmlx, /gantt\.attachEvent\('onAfterTaskUpdate'/,
  'onAfterTaskUpdate fires on every gantt.parse(), not just real drags (negative)');

// --- Click-to-open a card works in both.
assert.match(frappe, /on_click\(task\)/);
assert.match(dhtmlx, /gantt\.attachEvent\('onTaskClick'/);
for (const source of [frappe, dhtmlx]) {
  assert.match(source, /FlowRouter\.go\('card', \{/);
}

// --- Editing is gated on the same board-write capability as the rest of
// WeKan (Kanboard: a data-readonly flag disables moves/resizes for users
// without PROJECT_MANAGER/PROJECT_MEMBER role).
assert.match(frappe, /readonly_dates: readonly/);
assert.match(frappe, /const readonly = !Utils\.currentUserCan\('write', board\)/);
assert.match(dhtmlx, /gantt\.config\.readonly = !Utils\.currentUserCan\('write', board\)/);

// --- View-mode switching (Frappe) - a feature Kanboard's Gantt does NOT
// have, kept because the underlying library already offers it for free.
assert.match(frappe, /view_mode_select: true/);

console.log('ganttDateVisibility: all four card dates and drag/click/readonly parity coverage passed');
