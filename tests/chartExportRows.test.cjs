'use strict';

// The chart-export table shape (models/lib/chartExportRows.js), shared by the
// chart PDF and Excel exporters (models/server/ExporterChartPDF.js,
// models/server/ExporterChartExcel.js).
//
// Run: node tests/chartExportRows.test.cjs

const assert = require('assert');
const { chartExportRows, chartTitle } = require('../models/lib/chartExportRows');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('chartExportRows:');

test('chartTitle falls back to English when no translator is given', () => {
  assert.strictEqual(chartTitle('burndown'), 'Burndown');
});

test('chartTitle calls the translator with the i18n key and fallback', () => {
  const title = chartTitle('burndown', (key, fallback) => `${key}/${fallback}`);
  assert.strictEqual(title, 'board-view-burndown/Burndown');
});

test('cumulativeFlow rows have one column per list, in list order', () => {
  const data = {
    lists: [{ _id: 'l1', title: 'Todo' }, { _id: 'l2', title: 'Done' }],
    series: [{ day: '2026-01-01', counts: { l1: 2, l2: 1 } }],
  };
  const { headers, rows } = chartExportRows('cumulativeFlow', data);
  assert.deepStrictEqual(headers, ['Date', 'Todo', 'Done']);
  assert.deepStrictEqual(rows[0], ['2026-01-01', 2, 1]);
});

test('wipRun rows show a dash when no WIP limit was set on the board', () => {
  const { rows } = chartExportRows('wipRun', { series: [{ day: '2026-01-01', count: 3, limit: null }] });
  assert.deepStrictEqual(rows[0], ['2026-01-01', 3, '-']);
});

test('burndown table has an empty-board row with zero remaining', () => {
  const { rows } = chartExportRows('burndown', { series: [{ day: '2026-01-01', remaining: 0, ideal: 0 }] });
  assert.deepStrictEqual(rows[0], ['2026-01-01', 0, 0]);
});

test('dashboard table groups sections with a blank separator row', () => {
  const { rows } = chartExportRows('dashboard', {
    byAssignee: [{ label: 'Alice', count: 2, percent: 100 }],
    byLabel: [],
    byList: [],
  });
  assert.strictEqual(rows[0][0], 'Assignees');
  assert.deepStrictEqual(rows[1], ['Alice', '2 (100%)']);
});

test('gantt rows carry the card title and its three dates', () => {
  const { headers, rows } = chartExportRows('gantt', {
    cards: [{ title: 'Task 1', startAt: '2026-01-01', dueAt: '2026-01-05', endAt: null }],
  });
  assert.strictEqual(headers.length, 4);
  assert.deepStrictEqual(rows[0], ['Task 1', '2026-01-01', '2026-01-05', '-']);
});

test('an unknown chart key returns an empty table rather than throwing', () => {
  const { headers, rows } = chartExportRows('notAChart', {});
  assert.deepStrictEqual(headers, []);
  assert.deepStrictEqual(rows, []);
});

console.log(`chartExportRows: ${passed} passed`);
