'use strict';

// Unit tests for the shared board-repair planner (models/lib/boardRepair.js) and
// the wiring that runs it BOTH on board open and during the MongoDB <-> FerretDB
// v1 (SQLite) text migration.
// Run: node tests/boardRepair.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { planBoardRepair, repairCounts } = require('../models/lib/boardRepair');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const S = id => ({ _id: id, boardId: 'B' });
const L = (id, swimlaneId) => ({ _id: id, boardId: 'B', swimlaneId });
const C = (id, swimlaneId) => ({ _id: id, boardId: 'B', swimlaneId });

check('#6515: per-swimlane lists are NOT auto-unbound (a set swimlaneId is legitimate)', () => {
  // A list with a swimlaneId is a legitimate per-swimlane list, indistinguishable
  // from #6484 corruption at the data level, so the automatic repair must never
  // clear it (that silently unbound every per-swimlane list on upgrade).
  const plan = planBoardRepair([S('s1')], [L('a', 's1'), L('b', null)], []);
  assert.deepStrictEqual(plan.listsUnbind, []);
});

check('missing-swimlane cards (null / "" / missing) are collected', () => {
  const plan = planBoardRepair(
    [S('s1')], [],
    [C('c1', null), C('c2', ''), { _id: 'c3', boardId: 'B' }, C('c4', 's1')],
  );
  assert.deepStrictEqual(plan.cardsMissing, ['c1', 'c2', 'c3']);
  assert.deepStrictEqual(plan.cardsOrphaned, []);
});

check('orphaned cards (swimlaneId points at a swimlane not on the board)', () => {
  const plan = planBoardRepair(
    [S('s1'), S('s2')], [],
    [C('c1', 's1'), C('c2', 'deleted'), C('c3', 's2')],
  );
  assert.deepStrictEqual(plan.cardsOrphaned, ['c2']);
  assert.deepStrictEqual(plan.cardsMissing, []);
});

check('a card on an existing (even archived) swimlane is NOT orphaned', () => {
  // archived swimlane still exists in the swimlanes array -> not orphaned.
  const archived = { _id: 's1', boardId: 'B', archived: true };
  const plan = planBoardRepair([archived], [], [C('c1', 's1')]);
  assert.deepStrictEqual(plan.cardsOrphaned, []);
  assert.deepStrictEqual(plan.cardsMissing, []);
});

check('repairCounts flattens a plan and totals it (lists never auto-unbound, #6515)', () => {
  const plan = planBoardRepair(
    [S('s1')],
    [L('a', 's1')], // a per-swimlane list — NOT unbound
    [C('c1', null), C('c2', 'gone'), C('c3', 's1')],
  );
  assert.deepStrictEqual(repairCounts(plan), {
    listsUnbound: 0, cardsAssigned: 1, cardsRescued: 1, total: 2,
  });
});

check('negative: tolerates non-arrays / junk without throwing', () => {
  assert.deepStrictEqual(planBoardRepair(undefined, undefined, undefined),
    { listsUnbind: [], cardsMissing: [], cardsOrphaned: [] });
  assert.deepStrictEqual(repairCounts({}), { listsUnbound: 0, cardsAssigned: 0, cardsRescued: 0, total: 0 });
  const plan = planBoardRepair([null, S('s1')], ['nope'], [null, {}, C('', 's1'), C('ok', 'gone')]);
  assert.deepStrictEqual(plan.cardsOrphaned, ['ok']);
});

check('idempotent: a clean board plans nothing', () => {
  const plan = planBoardRepair([S('s1')], [L('a', null)], [C('c1', 's1')]);
  assert.deepStrictEqual(repairCounts(plan).total, 0);
});

// ── source guard: server lib applies the plan the way the planner intends ──────
check('server lib repairBoardData clears lists + reassigns cards, idempotent', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'server', 'lib', 'repairBoardData.js'), 'utf8');
  assert.ok(/planBoardRepair\(swimlanes, lists, cards\)/.test(src), 'must use the planner');
  assert.ok(!/\$set: \{ swimlaneId: null \}/.test(src),
    '#6515: the automatic repair must NOT clear list swimlaneIds (per-swimlane lists are legitimate)');
  assert.ok(/cardsMissing\.concat\(plan\.cardsOrphaned\)/.test(src),
    'must fix both missing and orphaned cards');
  assert.ok(/firstSwimlaneId\(boardId\)/.test(src), 'must reassign fixed cards to the first swimlane');
  assert.ok(/export async function repairAllBoards\(/.test(src),
    'must expose repairAllBoards for the DB migration');
  assert.ok(/if \(counts\.total === 0\) return counts/.test(src), 'idempotent: no writes when nothing to fix');
});

// ── source guard: the DB migration runs the shared repairs on the live DB ──────
check('migrateTextDatabase runs repairAllBoards before copying', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'server', 'methods', 'migrateTextDatabase.js'), 'utf8');
  assert.ok(/from '\/server\/lib\/repairBoardData'/.test(src), 'must import the shared repair');
  const repairAt = src.indexOf('repairAllBoards(');
  const copyAt = src.indexOf("progress.phase = 'migrating'");
  assert.ok(repairAt > -1 && copyAt > -1 && repairAt < copyAt,
    'repairAllBoards must run before the collection copy so the copy carries clean data');
  assert.ok(/progress\.phase = 'repairing'/.test(src), 'must report a repairing phase for the dashboard');
});

// ── source guard: the DB migration UI drives the shared progress dashboard ─────
check('attachments.js mirrors DB-migration status into the progress dashboard', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'client', 'components', 'settings', 'attachments.js'), 'utf8');
  assert.ok(/from '\/client\/components\/settings\/migrationProgress'/.test(src),
    'must import the shared migration-progress manager');
  assert.ok(/driveMigrationDashboard\(tpl, status\)/.test(src),
    'the poll must feed the dashboard');
  assert.ok(/migrationProgressManager\.startMigration\(\)/.test(src)
    && /migrationProgressManager\.completeMigration\(\)/.test(src)
    && /migrationProgressManager\.failMigration/.test(src),
    'must start / complete / fail the dashboard');
});

// ── source guard: the dashboard is mounted app-wide (Admin Panel + boards) ─────
check('migrationProgress is mounted in the app-wide layout, not just a board', () => {
  const layout = fs.readFileSync(
    path.join(__dirname, '..', 'client', 'components', 'main', 'layouts.jade'), 'utf8');
  assert.ok(/\+migrationProgress/.test(layout),
    'defaultLayout must render +migrationProgress so it shows on the Admin Panel too');
});

console.log(`\nboardRepair: ${passed} checks passed`);
