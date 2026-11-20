'use strict';
// The Board View reports added on 2026-11-20 (models/lib/boardReports.js):
// each one's numbers from known cards, and the one shape every report
// answers, which the chart view and the PDF and Excel exports read.
// Run: node --test tests/boardReports.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const r = require('../models/lib/boardReports');

const now = new Date('2026-11-20T12:00:00Z');
const d = s => new Date(`${s}T10:00:00Z`);
const lists = [{ _id: 'todo', title: 'To Do' }, { _id: 'doing', title: 'Doing' }, { _id: 'done', title: 'Done' }];
const cards = [
  { _id: 'a', title: 'A', listId: 'done', createdAt: d('2026-11-02'), endAt: d('2026-11-05'), dueAt: d('2026-11-06'), labelIds: ['l1'], assignees: ['u1'] },
  { _id: 'b', title: 'B', listId: 'done', createdAt: d('2026-11-03'), endAt: d('2026-11-12'), dueAt: d('2026-11-10'), labelIds: ['l1', 'l2'] },
  { _id: 'c', title: 'C', listId: 'doing', createdAt: d('2026-11-09'), labelIds: [], assignees: ['u1'], parentId: 'e',
    cardDependencies: [{ cardId: 'd', type: 'blocks' }] },
  { _id: 'd', title: 'D', listId: 'todo', createdAt: d('2026-11-16'), members: ['u2'], parentId: 'e', scrum: { releaseIds: ['r1'] },
    cardDependencies: [{ cardId: 'f', type: 'blocks' }] },
  { _id: 'e', title: 'Epic', listId: 'todo', createdAt: d('2026-11-01'), scrum: { releaseId: 'r1' } },
  { _id: 'f', title: 'F', listId: 'todo', createdAt: d('2026-11-17'), endAt: null, archivedAt: d('2026-11-18'), parentId: 'e' },
];

test('every report answers bars and a table, and is a Board View', () => {
  assert.strictEqual(r.BOARD_REPORTS.length, 12);
  for (const report of r.BOARD_REPORTS) {
    const out = r.computeBoardReport(report.key, { cards, lists, now, labels: [], releases: [{ _id: 'r1', name: 'R1' }], activities: [], history: [] });
    assert.ok(Array.isArray(out.bars) && Array.isArray(out.table.headers) && Array.isArray(out.table.rows), report.key);
    assert.ok(out.table.rows.every(row => row.length === out.table.headers.length), `${report.key}: every row has every column`);
    assert.match(report.view, /^board-view-[a-z-]+$/);
  }
  assert.strictEqual(r.computeBoardReport('nope', {}), null, 'negative: an unknown report is nothing');
  assert.strictEqual(r.weekOf('2026-11-20T00:00:00Z'), '2026-11-16', 'weeks start on Monday');
});

test('Created vs. Resolved and Net Flow count by week, open carried over', () => {
  const { table } = r.createdVsResolved({ cards, now });
  const byWeek = Object.fromEntries(table.rows.map(row => [row[0], row.slice(1)]));
  assert.deepStrictEqual(byWeek['2026-10-26'], [1, 0, 1], 'the Epic, created on Sunday 1 November');
  assert.deepStrictEqual(byWeek['2026-11-02'], [2, 1, 2]);
  assert.deepStrictEqual(byWeek['2026-11-09'], [1, 1, 2]);
  assert.deepStrictEqual(byWeek['2026-11-16'], [2, 1, 3]);
  const net = Object.fromEntries(r.netFlow({ cards, now }).table.rows.map(row => [row[0], row[3]]));
  assert.strictEqual(net['2026-11-02'], -1);
  assert.strictEqual(net['2026-11-16'], -1);
});

test('Time in List follows the moves in the change history', () => {
  const history = [
    { entityId: 'a', previousContent: { listId: 'todo' }, newContent: { listId: 'doing' }, createdAt: d('2026-11-03') },
    { entityId: 'a', previousContent: { listId: 'doing' }, newContent: { listId: 'done' }, createdAt: d('2026-11-05') },
  ];
  const { table } = r.timeInList({ cards: [cards[0]], lists, history, now });
  assert.deepStrictEqual(table.rows.map(row => [row[0], row[1], row[2]]), [['To Do', 1, 1], ['Doing', 1, 2], ['Done', 0, 0]]);
  // Negative: a card never moved stayed in its list, until now.
  const still = r.timeInList({ cards: [{ _id: 'x', listId: 'todo', createdAt: d('2026-11-18') }], lists, history: [], now });
  assert.ok(still.table.rows[0][2] > 2 && still.table.rows[1][1] === 0);
});

test('Average Age, Throughput Run and Due Date Performance', () => {
  const age = Object.fromEntries(r.averageAge({ cards, now }).table.rows.map(row => [row[0], row.slice(1)]));
  assert.strictEqual(age['2026-11-02'][0], 2, 'B and the Epic are open at the end of that week; A is done');
  const run = r.throughputRun({ cards, now }).table.rows;
  assert.deepStrictEqual(run.filter(row => row[1]).map(row => row[0]), ['2026-11-02', '2026-11-09', '2026-11-16']);
  const due = Object.fromEntries(r.dueDatePerformance({ cards, now }).table.rows.map(row => [row[0], row.slice(1)]));
  assert.deepStrictEqual(due['2026-11-02'], [1, 0, 0, 0], 'A done before its due date');
  assert.deepStrictEqual(due['2026-11-09'], [0, 1, 0, 2], 'B two days late');
  assert.deepStrictEqual(due['2026-11-16'], [0, 0, 1, 0], 'F had no due date');
});

test('Workload, Distribution and Epic Progress', () => {
  const work = r.workload({ cards, lists, nameOf: id => ({ u1: 'Ann', u2: 'Bob' }[id] || id) });
  assert.deepStrictEqual(work.table.rows.find(row => row[0] === 'Ann'), ['Ann', 1, 0, 1, 0], 'only open cards, by list');
  assert.deepStrictEqual(work.table.rows.find(row => row[0] === 'Bob'), ['Bob', 1, 1, 0, 0], 'members when nobody is assigned');
  assert.deepStrictEqual(work.table.rows.find(row => row[0] === '-'), ['-', 1, 1, 0, 0], 'the Epic has nobody');
  const dist = r.distribution({ cards, labels: [{ _id: 'l1', name: 'Bug' }, { _id: 'l2', name: 'UI' }] });
  assert.deepStrictEqual(dist.table.rows.find(row => row[0] === 'Bug'), ['Bug', 0, 2, 0]);
  assert.deepStrictEqual(dist.table.rows.find(row => row[0] === '-'), ['-', 3, 1, 100]);
  const epic = r.epicProgress({ cards });
  assert.deepStrictEqual(epic.table.rows, [['Epic', 3, 1, 2, 33.3]]);
  assert.deepStrictEqual(r.epicProgress({ cards: [cards[0]] }).table.rows, [], 'negative: no subtasks, no rows');
});

test('Release Burndown, Dependency Map and Activity Heatmap', () => {
  const rel = r.releaseBurndown({ cards, releases: [{ _id: 'r1', name: 'R1' }, { _id: 'r2', name: 'R2' }], now });
  assert.deepStrictEqual(rel.table.rows[0].slice(0, 4), ['R1', 2, 0, 2], 'releaseId and releaseIds both count');
  assert.match(rel.table.rows[0][4], /^\d{4}-\d{2}-\d{2}$/, 'projected from the recent weekly rate');
  assert.deepStrictEqual(rel.table.rows[1], ['R2', 0, 0, 0, ''], 'negative: an empty release has nothing left');
  const deps = r.dependencyMap({ cards });
  // C waits on D, which waited on F - but F is done, so C's chain is 1.
  assert.deepStrictEqual(deps.table.rows.map(row => [row[0], row[2], row[3], row[4]]), [['C', 'D', 'open', 1], ['D', 'F', 'done', 0]]);
  const cyclic = r.dependencyMap({ cards: [{ _id: 'x', title: 'X', cardDependencies: [{ cardId: 'y' }] }, { _id: 'y', title: 'Y', cardDependencies: [{ cardId: 'x' }] }] });
  assert.ok(cyclic.table.rows.every(row => Number.isFinite(row[4])), 'negative: a cycle does not loop');
  const heat = r.activityHeatmap({ activities: [{ createdAt: '2026-11-16T09:30:00Z' }, { createdAt: '2026-11-16T09:59:00Z' }, { createdAt: '2026-11-22T23:00:00Z' }, { createdAt: 'bad' }] });
  assert.strictEqual(heat.table.rows[0][10], 2, 'Monday at 09');
  assert.strictEqual(heat.table.rows[6][24], 1, 'Sunday at 23');
  assert.deepStrictEqual(heat.bars.map(b => b.value), [2, 0, 0, 0, 0, 0, 1]);
  assert.strictEqual(r.labelText(['monday', 'Monday'], (k, f) => `${k}:${f}`), 'monday:Monday');
});

test('the chart view and the PDF and Excel exports read each report through one table', () => {
  const { chartExportRows } = require('../models/lib/chartExportRows');
  const fs = require('node:fs');
  const path = require('node:path');
  const en = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'imports/i18n/data/en.i18n.json'), 'utf8'));
  const tr = (key, fallback) => (key in en ? `[${en[key]}]` : fallback);
  for (const report of r.BOARD_REPORTS) {
    const data = r.computeBoardReport(report.key, { cards, lists, now, labels: [], releases: [], activities: [], history: [] });
    const out = chartExportRows(report.key, data, tr);
    assert.strictEqual(out.title, `[${en[report.view]}]`, `${report.key} is titled by its view's label`);
    assert.strictEqual(out.headers.length, data.table.headers.length);
    for (const [key] of data.table.headers.filter(([key]) => key)) assert.ok(key in en, `${report.key}: ${key} is in English`);
    assert.ok(out.rows.every(row => row.every(cell => !Array.isArray(cell))), 'every cell is text or a number');
  }
  // Negative: a chart that is not a report keeps its own table.
  assert.notStrictEqual(chartExportRows('burndown', { series: [] }, tr).headers, undefined);
  const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  assert.match(read('models/exportCharts.js'), /\.\.\.require\('\/models\/lib\/boardReports'\)\.REPORT_KEYS/);
  assert.match(read('server/lib/boardChartData.js'), /if \(report\) return loadBoardReport\(/);
  assert.match(read('models/lib/exportAccess.js'), /return \['scrumVelocity', 'scrumSprint', 'scrumDaily'\]\.includes\(chartKey\);/,
    'an assigned-only member gets none of the reports: they read every card');
});
