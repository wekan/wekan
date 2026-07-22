'use strict';

// Unit tests for the #6484 board-wide-list repair helper
// (models/lib/listUnbindRepair.js) + the server method wiring.
// Run: node tests/listUnbindRepair.test.cjs
//
// #6484: nudging a board-wide list (swimlaneId null, shown under every swimlane)
// in swimlanes view wrongly bound it to one swimlane (set its swimlaneId), so it
// vanished from the other swimlanes. The code bug is fixed; this repair un-binds
// such lists (clears swimlaneId back to null) for boards already corrupted.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { listsToUnbind } = require('../models/lib/listUnbindRepair');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const L = (id, swimlaneId) => ({ _id: id, boardId: 'B', swimlaneId });

check('selects the swimlane-BOUND lists (non-empty swimlaneId) to un-bind', () => {
  const lists = [L('a', 'S1'), L('b', null), L('c', 'S2'), L('d', '')];
  assert.deepStrictEqual(listsToUnbind(lists), ['a', 'c']);
});

check('idempotent: already board-wide lists (null/""/missing) are left alone', () => {
  assert.deepStrictEqual(listsToUnbind([L('a', null), L('b', ''), { _id: 'c', boardId: 'B' }]), []);
  // running again on the repaired result yields nothing to do.
  const repaired = [L('a', null), L('c', null)];
  assert.deepStrictEqual(listsToUnbind(repaired), []);
});

check('negative: tolerates a non-array / invalid entries without throwing', () => {
  assert.deepStrictEqual(listsToUnbind(undefined), []);
  assert.deepStrictEqual(listsToUnbind(null), []);
  assert.deepStrictEqual(listsToUnbind('nope'), []);
  assert.deepStrictEqual(listsToUnbind([null, {}, { swimlaneId: 'x' } /* no _id */, L('', 'S')]), []);
  assert.deepStrictEqual(listsToUnbind([L('ok', 'S'), { _id: 5, swimlaneId: 'S' }]), ['ok']);
});

check('a numeric/non-string swimlaneId is not treated as bound', () => {
  assert.deepStrictEqual(listsToUnbind([{ _id: 'a', swimlaneId: 42 }, L('b', 'S')]), ['b']);
});

// ── source guard: the admin method exists, is board-admin-gated, uses the helper
check('server method repairBoardWideLists is admin-gated and clears swimlaneId', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'server', 'models', 'lists.js'), 'utf8');
  const start = src.indexOf('async repairBoardWideLists(');
  assert.ok(start > -1, 'repairBoardWideLists method must exist');
  const body = src.slice(start, start + 900);
  assert.ok(/board\.hasAdmin\(this\.userId\)/.test(body), 'must require a board admin');
  assert.ok(/listsToUnbind\(lists\)/.test(body), 'must pick lists via the tested helper');
  assert.ok(/\$set: \{ swimlaneId: null \}/.test(body), 'must clear swimlaneId to null (board-wide)');
  assert.ok(/\{ _id: \{ \$in: ids \}, boardId \}/.test(body),
    'must scope the update to this board only');
});

// ── detection method: board opens -> does it need repair? ───────────────────
check('server method boardListRepairNeeded is board-member gated, reports need + admin', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'server', 'models', 'lists.js'), 'utf8');
  const start = src.indexOf('async boardListRepairNeeded(');
  assert.ok(start > -1, 'boardListRepairNeeded method must exist');
  const body = src.slice(start, start + 800);
  assert.ok(/board\.hasMember\(this\.userId\)/.test(body), 'must require a board member');
  assert.ok(/needsRepair: listsToUnbind\(lists\)\.length/.test(body),
    'needsRepair must be the count from the tested helper');
  assert.ok(/canRepair: board\.hasAdmin\(this\.userId\)/.test(body),
    'canRepair must reflect board-admin so the client only auto-repairs when allowed');
});

// ── client: on board open, detect + repair with the migration-progress modal ─
// (The board-open path now runs the BROADER shared repair set — boardRepairNeeded
// / repairBoardData — which includes this #6484 list-unbind. The list-only
// repairBoardWideLists / boardListRepairNeeded methods above remain as valid
// standalone admin actions; the planner + broad path is covered by
// tests/boardRepair.test.cjs.)
check('the board detects + runs the shared repair on open and shows progress', () => {
  const js = fs.readFileSync(
    path.join(__dirname, '..', 'client', 'components', 'boards', 'boardBody.js'), 'utf8');
  assert.ok(/maybeRepairBoard\(currentBoardId\)/.test(js),
    'the board-ready autorun must run the repair check on open');
  const start = js.indexOf('this.maybeRepairBoard =');
  const body = js.slice(start, start + 1400);
  assert.ok(/Meteor\.call\('boardRepairNeeded', boardId/.test(body), 'must detect via the broad method');
  assert.ok(/res\.total.*res\.canRepair|res\.canRepair/.test(body),
    'must only proceed when a repair is needed AND the viewer may repair');
  assert.ok(/migrationProgressManager\.startMigration\(\)/.test(body),
    'must show the shared migration-progress modal');
  assert.ok(/Meteor\.call\('repairBoardData', boardId/.test(body), 'must run the broad repair');
  assert.ok(/completeMigration\(\)/.test(body) && /failMigration/.test(body),
    'must complete / fail the progress modal');
  assert.ok(/_listRepairChecked/.test(body), 'must check once per board (guarded)');
});

console.log(`\nlistUnbindRepair: ${passed} checks passed`);
