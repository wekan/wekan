'use strict';

// Guard: Admin Panel / Problems can put back the swimlane a list was bound to.
// Run: node tests/listSwimlaneRestore.test.cjs
//
// #6670. Before #6515 the board data-repair ran automatically on startup and on
// every board open, and it cleared the swimlaneId of EVERY per-swimlane list it
// saw - a legitimate per-swimlane list is indistinguishable from a #6484
// corrupted board-wide one at the data level. #6515 stopped it; nothing put the
// bindings back, and an unbound list renders under every swimlane, which is what
// the reporter saw.
//
// The value is recoverable rather than guessable, and that is the whole point of
// this repair. The clearing went through `Lists.direct.updateAsync`, which
// bypasses collection hooks, so it only ever touched the list document - while
// the binding each list was CREATED with sits in a different collection:
//
//   // models/lists.js - Lists.after.insert -> trackOriginalPosition()
//   originalSwimlaneId: this.swimlaneId || null,
//   if (!existingHistory) { PositionHistory.insertAsync(document); }
//
// insert-ONLY, written once at creation, never overwritten. So it survived.
//
// What must NOT happen is inference from the cards. It looks reasonable - "every
// card in this list is in one swimlane, so bind it there" - and it is wrong: on
// a board whose second swimlane is new, every card is still in the first one, so
// inference would bind every list to swimlane 1 and hide them from all the
// others. That is #6484, the bug the clearing existed to fix. The negative tests
// below pin that this restores only what was recorded.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const { planListSwimlaneRestore, isUnbound } =
  require(path.join(ROOT, 'models', 'lib', 'listSwimlaneRestore'));
const { buildProblemsOverview } =
  require(path.join(ROOT, 'models', 'lib', 'problemsOverview'));

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
// Source scans look at CODE. Every file here EXPLAINS in its comments what it
// deliberately does not do ("nothing is inferred from the cards"), and a scan
// that counted the explanation as the thing would fail on its own rationale.
const code = f => read(f)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '');
const serverLib = code('server/lib/restoreListSwimlanes.js');
const method = code('server/methods/restoreListSwimlanes.js');
const imports = read('server/imports.js');
const systemStatus = read('server/lib/systemStatus.js');
const summaryJade = read('client/components/settings/problemsSummary.jade');
const summaryJs = read('client/components/settings/problemsSummary.js');

let passed = 0;
const test = (name, run) => {
  run();
  passed++;
  if (process.env.VERBOSE) console.log(`  ok - ${name}`);
};

const SWIMLANES = [
  { _id: 's1', boardId: 'b1', title: 'Swimlane one' },
  { _id: 's2', boardId: 'b1', title: 'Swimlane two' },
  { _id: 'other', boardId: 'b2', title: 'On another board' },
];
const historyFor = entries => entries.map(([entityId, originalSwimlaneId]) => ({
  entityType: 'list', entityId, boardId: 'b1', originalSwimlaneId,
}));

// ---- what counts as unbound --------------------------------------------------

test('a list with no swimlane, in any of its shapes, is unbound', () => {
  for (const value of [undefined, null, '']) {
    assert.equal(isUnbound({ _id: 'l', swimlaneId: value }), true, String(value));
  }
  assert.equal(isUnbound({ _id: 'l' }), true, 'a missing field is unbound too');
  assert.equal(isUnbound({ _id: 'l', swimlaneId: 's1' }), false);
});

// ---- the plan ----------------------------------------------------------------

test('an unbound list is put back in the swimlane it was created in', () => {
  const plan = planListSwimlaneRestore(
    [{ _id: 'l1', boardId: 'b1', title: 'Backlog', swimlaneId: '' }],
    historyFor([['l1', 's2']]),
    SWIMLANES,
  );
  assert.deepEqual(plan, [{
    listId: 'l1', boardId: 'b1', swimlaneId: 's2',
    listTitle: 'Backlog', swimlaneTitle: 'Swimlane two',
  }]);
});

test('it restores each list to its own swimlane, not all to one', () => {
  const plan = planListSwimlaneRestore(
    [
      { _id: 'l1', boardId: 'b1', title: 'A', swimlaneId: '' },
      { _id: 'l2', boardId: 'b1', title: 'B', swimlaneId: null },
      { _id: 'l3', boardId: 'b1', title: 'C' },
    ],
    historyFor([['l1', 's1'], ['l2', 's2'], ['l3', 's1']]),
    SWIMLANES,
  );
  assert.deepEqual(plan.map(p => [p.listId, p.swimlaneId]),
    [['l1', 's1'], ['l2', 's2'], ['l3', 's1']]);
});

// ---- negatives: every reason to leave a list alone ---------------------------

// Idempotency, and the reason an admin can press the button twice safely: a
// binding that exists is never overwritten, including one set by hand since.
test('a list that already has a swimlane is never touched (negative)', () => {
  const plan = planListSwimlaneRestore(
    [{ _id: 'l1', boardId: 'b1', title: 'A', swimlaneId: 's1' }],
    historyFor([['l1', 's2']]),
    SWIMLANES,
  );
  assert.deepEqual(plan, [], 'restoring over a current binding would undo a fix');
});

test('a list with no creation record is left board-wide (negative)', () => {
  const plan = planListSwimlaneRestore(
    [{ _id: 'l1', boardId: 'b1', title: 'A', swimlaneId: '' }],
    [],
    SWIMLANES,
  );
  assert.deepEqual(plan, [], 'nothing is inferred when nothing was recorded');
});

// A list CREATED board-wide records null, and null means "there is nothing to
// put back" - not "pick a swimlane".
test('a list created board-wide stays board-wide (negative)', () => {
  for (const recorded of [null, '', undefined]) {
    const plan = planListSwimlaneRestore(
      [{ _id: 'l1', boardId: 'b1', title: 'A', swimlaneId: '' }],
      historyFor([['l1', recorded]]),
      SWIMLANES,
    );
    assert.deepEqual(plan, [], `recorded ${String(recorded)} is not a swimlane`);
  }
});

test('a swimlane that has since been deleted is not resurrected (negative)', () => {
  const plan = planListSwimlaneRestore(
    [{ _id: 'l1', boardId: 'b1', title: 'A', swimlaneId: '' }],
    historyFor([['l1', 'deleted-swimlane']]),
    SWIMLANES,
  );
  assert.deepEqual(plan, [],
    'binding to a swimlane that no longer exists would hide the list everywhere');
});

// Cross-board is the worst outcome available here: a list bound to a swimlane of
// another board renders in NO swimlane of its own board.
test('a recorded swimlane on another board is refused (negative)', () => {
  const plan = planListSwimlaneRestore(
    [{ _id: 'l1', boardId: 'b1', title: 'A', swimlaneId: '' }],
    historyFor([['l1', 'other']]),
    SWIMLANES,
  );
  assert.deepEqual(plan, []);
});

test('history for other entity types is ignored (negative)', () => {
  const plan = planListSwimlaneRestore(
    [{ _id: 'l1', boardId: 'b1', title: 'A', swimlaneId: '' }],
    [{ entityType: 'card', entityId: 'l1', boardId: 'b1', originalSwimlaneId: 's2' }],
    SWIMLANES,
  );
  assert.deepEqual(plan, [], "a card's history must not bind a list");
});

test('junk input is refused rather than throwing (negative)', () => {
  assert.deepEqual(planListSwimlaneRestore(null, null, null), []);
  assert.deepEqual(planListSwimlaneRestore([null, {}, { _id: '' }], [], SWIMLANES), []);
});

// THE one that matters most. This is the shape of the board in the report: a
// second swimlane was just added, so every card still sits in the first. An
// inference-based repair binds every list to swimlane one and the new swimlane
// shows nothing - #6484 all over again. Cards are not an input here at all, and
// this test exists so they cannot quietly become one.
test('nothing is inferred from where the cards are (negative)', () => {
  const cards = [
    { _id: 'c1', listId: 'l1', swimlaneId: 's1' },
    { _id: 'c2', listId: 'l1', swimlaneId: 's1' },
  ];
  const plan = planListSwimlaneRestore(
    [{ _id: 'l1', boardId: 'b1', title: 'A', swimlaneId: '' }],
    [],
    SWIMLANES,
    cards, // a fourth argument the planner must not grow a use for
  );
  assert.deepEqual(plan, [],
    'every card being in one swimlane is not evidence the list belonged to it');
  assert.equal(planListSwimlaneRestore.length, 3,
    'the planner takes lists, history and swimlanes - cards are not an input');
  assert.doesNotMatch(code('models/lib/listSwimlaneRestore.js'), /\bcards?\b/i,
    'and its code must not mention cards at all');
});

// ---- the problem shown in Admin Panel / Problems -----------------------------

test('the overview reports the problem only when something can be restored', () => {
  const none = buildProblemsOverview({ unboundLists: 0 });
  assert.equal(none.problems.some(p => p.id === 'unbound-lists'), false,
    'a problem with no remedy is not a problem an admin can act on');

  const some = buildProblemsOverview({ unboundLists: 7 });
  const problem = some.problems.find(p => p.id === 'unbound-lists');
  assert.ok(problem, 'the problem must appear when there is something to restore');
  assert.equal(problem.count, 7);
  assert.equal(problem.severity, 'warning');
  assert.match(problem.detail, /7 list/);
  assert.match(problem.detail, /CREATED in/,
    'the detail must say what it restores, since the button has no description');
  assert.match(problem.detail, /left board-wide/,
    'and what it leaves alone, so a count that stays put is explained');
});

test('the count is gathered alongside the other detections', () => {
  assert.match(systemStatus, /countRestorableListSwimlanes/,
    'the Problems overview must ask for the count');
  assert.match(systemStatus, /buildProblemsOverview\(\{[^}]*unboundLists[^}]*\}\)/s,
    'and pass it to the shared builder');
});

// ---- detection is read-only, the repair is the only writer -------------------

test('detecting never writes, and a broken detection does not hide other problems', () => {
  const detect = serverLib.slice(
    serverLib.indexOf('export async function planRestorableListSwimlanes'),
    serverLib.indexOf('export async function restoreListSwimlanes'));
  assert.doesNotMatch(detect, /update|insert|remove/i,
    'the Problems page polls this every 30 seconds; it must not write');
  assert.match(detect, /catch \(error\)/,
    'a detection that throws would take the whole Problems overview with it');
});

test('the repair writes only swimlaneId, and only through .direct', () => {
  const apply = serverLib.slice(serverLib.indexOf('export async function restoreListSwimlanes'));
  const writes = [...apply.matchAll(/Lists\.[\w.]*update\w*\(/g)].map(m => m[0]);
  assert.deepEqual(writes, ['Lists.direct.updateAsync('],
    'putting a value back must not raise activities for everyone watching');
  assert.match(apply, /\$set: \{ swimlaneId \}/, 'and it sets nothing else');
  assert.doesNotMatch(apply, /removeAsync|\$unset/, 'nothing is deleted');
});

test('the method is admin-only and is registered', () => {
  assert.match(method, /isAdmin/, 'a repair that rewrites boards is admin-only');
  assert.match(method, /not-authorized/);
  assert.match(method, /setBoardRepairStatus/,
    'it must show up as in-progress like the repair beside it');
  assert.match(imports, /import '\/server\/methods\/restoreListSwimlanes';/,
    'an unregistered method is a button that does nothing');
});

// ---- the button ---------------------------------------------------------------

test('the button appears on this problem and calls the method', () => {
  assert.match(summaryJade, /if isUnboundLists problem/,
    'the button belongs to the unbound-lists problem, not to every problem');
  assert.match(summaryJade, /button\.js-restore-list-swimlanes\.primary/);
  assert.match(summaryJade, /disabled="\{\{#if restoreRunning\}\}disabled\{\{\/if\}\}"/,
    'it must not be clickable twice while it runs');
  assert.match(summaryJs, /isUnboundLists\(problem\)[\s\S]*?problem\.id === 'unbound-lists'/,
    'and it must key off the id the overview actually produces');
  assert.match(summaryJs, /Meteor\.call\('restoreListSwimlanes'/);
  assert.match(summaryJs, /templateInstance\.reload\(\)/,
    'the count must refresh, so the admin sees what is left');
});

test('the result names both what was restored and what was not', () => {
  assert.match(summaryJs, /restore-list-swimlanes-done/);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const text = en['restore-list-swimlanes-done'];
  assert.ok(text, 'the result string must exist');
  assert.match(text, /__restored__/);
  assert.match(text, /__remaining__/,
    'a count that cannot reach zero has to be explained, not left hanging');
});

// Every locale that was complete before must still be complete, with the
// placeholders intact - they are code, not words (CLAUDE.md).
test('the new string is translated everywhere, placeholders untouched', () => {
  const dir = path.join(ROOT, 'imports', 'i18n', 'data');
  let withKey = 0;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.i18n.json')) continue;
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const text = data['restore-list-swimlanes-done'];
    if (text === undefined) continue;
    withKey++;
    assert.ok(text.includes('__restored__'),
      `${file}: __restored__ was translated away`);
    assert.ok(text.includes('__remaining__'),
      `${file}: __remaining__ was translated away`);
  }
  assert.ok(withKey > 150, `expected the string in every complete locale, found ${withKey}`);
});

console.log(`listSwimlaneRestore: ${passed} tests passed`);
