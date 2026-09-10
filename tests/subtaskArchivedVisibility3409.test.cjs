'use strict';

// Plain-Node regression guard (no Meteor) for issue #3409 "archived subtasks
// should show as 'completed' on the parent card, not just disappear; add a
// toggle to hide them".
//
// Reading the code before the fix: client/components/cards/subtasks.jade
// rendered `each subtask in currentCard.subtasks`, and models/cards.js's
// `subtasks()` queries `{ archived: false }` — so an archived subtask
// vanished from the parent card's subtask list entirely (matching the
// reporter's complaint), even though the numeric "M/N" badge (#4050,
// subtasksFinishedCount()/allSubtasksCount()) already counted it correctly.
//
// The fix keeps archived subtasks in the list (client/components/cards/
// subtasks.js's `visibleSubtasks()` helper reads allSubtasks(), which does
// not filter by archived), marks them with a "completed" class/icon
// (subtasks.jade/.css), and adds a client-side "hide completed subtasks"
// toggle (js-toggle-hide-completed-subtasks) that filters them back out only
// when turned on.
// Run: node tests/subtaskArchivedVisibility3409.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const jsSrc = fs.readFileSync(
  path.join(repoRoot, 'client/components/cards/subtasks.js'), 'utf8');
const jadeSrc = fs.readFileSync(
  path.join(repoRoot, 'client/components/cards/subtasks.jade'), 'utf8');
const cssSrc = fs.readFileSync(
  path.join(repoRoot, 'client/components/cards/subtasks.css'), 'utf8');
const enI18n = JSON.parse(fs.readFileSync(
  path.join(repoRoot, 'imports/i18n/data/en.i18n.json'), 'utf8'));

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- POSITIVE: the subtask list query includes archived subtasks ----------

test('subtasks.jade no longer iterates the archived-filtering currentCard.subtasks', () => {
  assert.ok(
    !/each subtask in currentCard\.subtasks\b/.test(jadeSrc),
    'the template must not go back to the query that drops archived subtasks',
  );
  assert.ok(
    /each subtask in visibleSubtasks/.test(jadeSrc),
    'the subtask list must iterate the visibleSubtasks helper',
  );
});

test('visibleSubtasks() helper is built from allSubtasks(), not the archived-filtering subtasks()', () => {
  const m = jsSrc.match(/visibleSubtasks\(\)\s*\{[\s\S]*?\n  \},/);
  assert.ok(m, 'visibleSubtasks() helper found in subtasks.js');
  const fn = m[0];
  assert.ok(fn.includes('allSubtasks'),
    'must read allSubtasks() so archived subtasks are included by default');
  assert.ok(!/\.subtasks\(\)/.test(fn),
    'must not call the archived-filtering subtasks() method');
});

// --- POSITIVE: archived subtasks render with a "completed" treatment ------

test('subtaskDetail marks an archived subtask with the is-completed class', () => {
  assert.ok(
    /\.js-subtasks\.subtask\(class="\{\{#if subtask\.archived\}\}is-completed\{\{\/if\}\}"\)/.test(jadeSrc),
    'the subtask row must carry is-completed when subtask.archived is true',
  );
});

test('the is-completed class has a visible "done" styling rule', () => {
  assert.ok(
    /\.subtask\.is-completed[\s\S]*?\{[\s\S]*?text-decoration:\s*line-through/.test(cssSrc),
    'archived subtasks must get a strikethrough/dimmed treatment, matching the ' +
    'checklist-item-checked look elsewhere in this file',
  );
});

// --- POSITIVE: a hide-completed toggle exists and is wired up -------------

test('a hide-completed-subtasks toggle control exists in the template', () => {
  assert.ok(
    /js-toggle-hide-completed-subtasks/.test(jadeSrc),
    'the subtasks template must render a toggle control',
  );
});

test('the toggle click handler flips a reactive hideCompletedSubtasks flag', () => {
  assert.ok(
    /'click \.js-toggle-hide-completed-subtasks'/.test(jsSrc),
    'a click handler for the toggle must be registered',
  );
  assert.ok(
    /hideCompletedSubtasks\.set\(!tpl\.hideCompletedSubtasks\.get\(\)\)/.test(jsSrc),
    'the handler must flip the ReactiveVar',
  );
});

test('visibleSubtasks() filters archived subtasks out only when the toggle is on', () => {
  const m = jsSrc.match(/visibleSubtasks\(\)\s*\{[\s\S]*?\n  \},/);
  const fn = m[0];
  assert.ok(/hideCompletedSubtasks\.get\(\)/.test(fn),
    'the helper must consult the toggle');
  assert.ok(/filter\(subtask => !subtask\.archived\)/.test(fn),
    'when hiding, the filter must drop archived subtasks');
});

// --- i18n: the toggle label exists -----------------------------------------

test('en.i18n.json has the hideCompletedSubtasks label', () => {
  assert.strictEqual(enI18n.hideCompletedSubtasks, 'Hide completed subtasks');
});

// --- Simulate the actual filtering logic end-to-end, without Meteor -------

function computeVisibleSubtasks(allSubtasks, hideCompleted) {
  // Mirrors visibleSubtasks() exactly.
  if (hideCompleted) {
    return allSubtasks.filter(subtask => !subtask.archived);
  }
  return allSubtasks;
}

test('#3409: archived subtasks stay in the list by default (toggle off)', () => {
  const subtasks = [
    { _id: 's1', archived: false },
    { _id: 's2', archived: true },
    { _id: 's3', archived: false },
  ];
  const visible = computeVisibleSubtasks(subtasks, false);
  assert.deepStrictEqual(visible.map(s => s._id), ['s1', 's2', 's3'],
    'an archived subtask must not disappear from the list by default');
});

test('#3409: turning the toggle on hides the archived (completed) subtasks', () => {
  const subtasks = [
    { _id: 's1', archived: false },
    { _id: 's2', archived: true },
    { _id: 's3', archived: false },
  ];
  const visible = computeVisibleSubtasks(subtasks, true);
  assert.deepStrictEqual(visible.map(s => s._id), ['s1', 's3'],
    'with the toggle on, only the archived subtask should be filtered out');
});

// --- NEGATIVE: the numeric M/N counter logic from #4050 is untouched ------

test('NEGATIVE: this fix does not touch subtasksFinishedCount()/allSubtasksCount() in models/cards.js', () => {
  const cardsSrc = fs.readFileSync(path.join(repoRoot, 'models/cards.js'), 'utf8');
  const finishedCount = cardsSrc.match(/subtasksFinishedCount\(\)\s*\{[\s\S]*?\n  \},/);
  assert.ok(finishedCount, 'subtasksFinishedCount() must still exist, unmodified in shape');
  assert.ok(finishedCount[0].includes('this.subtasksFinished()'));
});

console.log(`\n${passed} tests passed`);
