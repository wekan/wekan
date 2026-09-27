'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { dailyChartGroups } = require('../models/lib/scrumDailyHistory');
const total = (estimate, unknown = 0) => ({ count: 2, estimate, unknown });
const row = (day, estimate, extras = {}) => ({ day, capturedAt: `${day}T10:00:00Z`, unit: 'points',
  scope: total(estimate, 1), remaining: total(estimate, 1), completed: total(0), ...extras });

test('daily bars preserve gaps, timestamps and unknowns with a common measured scale', () => {
  const rows = [row('2026-09-01', 6), row('2026-09-03', 3)];
  const before = JSON.stringify(rows);
  const [group] = dailyChartGroups(rows, 'estimate');
  assert.deepEqual(group.rows.map(value => value.day), ['2026-09-01', '2026-09-03']);
  assert.equal(group.rows[0].capturedAt, rows[0].capturedAt);
  assert.deepEqual(group.rows[1].series.map(value => value.width), [50, 50, 0]);
  assert.equal(group.rows[1].series[1].total.unknown, 1);
  assert.equal(JSON.stringify(rows), before);
  assert.deepEqual(dailyChartGroups(rows, 'count')[0].rows[1].series.map(value => value.value), [2, 2, 2]);
});

test('unlike units and partial observations never share a scale; zero stays finite', () => {
  const groups = dailyChartGroups([row('2026-09-01', 0),
    row('2026-09-02', 99, { unit: 'hours' }), row('2026-09-03', 42, { partial: true })], 'estimate');
  assert.equal(groups.length, 3);
  assert.equal(groups[0].rows[0].series[0].width, 0);
  assert.equal(groups[0].rows[0].series[0].total.unknown, 1);
  assert.equal(groups[2].partial, true);
  assert.deepEqual(dailyChartGroups([]), []);
});

test('daily exports retain measured instants, policy, unknowns and missing-day gaps', () => {
  const { chartExportRows } = require('../models/lib/chartExportRows');
  const data = { sprintName: 'Sprint A', partial: true, truncated: true,
    rows: [row('2026-09-01', 0, { partial: true, estimateSource: 'poker', completionPolicy: 'dueComplete' }), row('2026-09-03', 3)] };
  const table = chartExportRows('scrumDaily', data);
  assert.equal(table.headers.length, 16);
  assert.equal(table.rows.length, 2);
  assert.equal(table.rows[0].length, table.headers.length);
  assert.deepEqual(table.rows[0].slice(0, 7), ['Sprint A', '2026-09-01', '2026-09-01T10:00:00.000Z', 'points', 2, 0, 1]);
  assert.deepEqual(table.rows[0].slice(-3), ['poker', '', 'dueComplete']);
  assert.match(table.notices.join(' '), /missing days.*Unknown estimates.*assigned.*Partial.*366/);
  const empty = chartExportRows('scrumDaily', { rows: [] });
  assert.equal(empty.rows.length, 0);
  assert.equal(empty.notices.length, 1);
});
