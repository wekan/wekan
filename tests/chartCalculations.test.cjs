'use strict';

// Pure calculations behind the board report charts - see
// models/lib/chartCalculations.js and docs/Features/Reports/charts.tsv.
//
// Run: node tests/chartCalculations.test.cjs

const assert = require('assert');
const {
  eachDay,
  computeCumulativeFlow,
  computeWipRun,
  computeControlChart,
  computeLeadCycleTime,
  computeBurndown,
  computeBurnup,
  computeThroughput,
  computeFlowEfficiency,
  computeDashboardGroups,
  computeTimeByGroup,
  computeTimeByCard,
  NO_ASSIGNEE_GROUP,
} = require('../models/lib/chartCalculations');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('chartCalculations:');

test('eachDay is inclusive of both ends', () => {
  assert.deepStrictEqual(eachDay('2026-01-01', '2026-01-03'), ['2026-01-01', '2026-01-02', '2026-01-03']);
});

test('eachDay on an empty board (single day) returns one day', () => {
  assert.deepStrictEqual(eachDay('2026-01-01', '2026-01-01'), ['2026-01-01']);
});

const lists = [{ _id: 'l1' }, { _id: 'l2' }, { _id: 'l3' }];

test('computeCumulativeFlow counts a card in and past its list', () => {
  const events = [
    { activityType: 'createCard', cardId: 'c1', listId: 'l1', createdAt: '2026-01-01T10:00:00Z' },
    { activityType: 'moveCard', cardId: 'c1', listId: 'l2', createdAt: '2026-01-02T10:00:00Z' },
  ];
  const series = computeCumulativeFlow(lists, events, '2026-01-01', '2026-01-03');
  assert.strictEqual(series[0].counts.l1, 1);
  assert.strictEqual(series[0].counts.l2, 0);
  // On day 2 the card is in l2 - "in or past" means l1's cumulative count still
  // includes it (l1 is earlier than l2), l2 counts it, l3 does not.
  assert.strictEqual(series[1].counts.l1, 1);
  assert.strictEqual(series[1].counts.l2, 1);
  assert.strictEqual(series[1].counts.l3, 0);
});

test('computeCumulativeFlow on an empty board has zero counts every day', () => {
  const series = computeCumulativeFlow(lists, [], '2026-01-01', '2026-01-02');
  series.forEach(day => lists.forEach(list => assert.strictEqual(day.counts[list._id], 0)));
});

test('computeCumulativeFlow drops an archived card from the count', () => {
  const events = [
    { activityType: 'createCard', cardId: 'c1', listId: 'l1', createdAt: '2026-01-01T10:00:00Z' },
    { activityType: 'archivedCard', cardId: 'c1', createdAt: '2026-01-02T10:00:00Z' },
  ];
  const series = computeCumulativeFlow(lists, events, '2026-01-01', '2026-01-03');
  assert.strictEqual(series[0].counts.l1, 1);
  assert.strictEqual(series[2].counts.l1, 0);
});

test('computeWipRun counts only cards in the WIP lists and carries the limit', () => {
  const events = [
    { activityType: 'createCard', cardId: 'c1', listId: 'l1', createdAt: '2026-01-01T10:00:00Z' },
    { activityType: 'moveCard', cardId: 'c1', listId: 'l2', createdAt: '2026-01-02T10:00:00Z' },
  ];
  const series = computeWipRun(['l2'], events, '2026-01-01', '2026-01-02', 3);
  assert.strictEqual(series[0].count, 0);
  assert.strictEqual(series[1].count, 1);
  assert.strictEqual(series[1].limit, 3);
});

test('computeWipRun with no WIP limit set carries a null limit, not a fabricated one', () => {
  const series = computeWipRun(['l2'], [], '2026-01-01', '2026-01-01', undefined);
  assert.strictEqual(series[0].limit, null);
});

test('computeControlChart computes cycle time and a rolling average/stddev', () => {
  const cards = [
    { _id: 'c1', createdAt: '2026-01-01T00:00:00Z', archivedAt: '2026-01-03T00:00:00Z' },
    { _id: 'c2', createdAt: '2026-01-02T00:00:00Z', archivedAt: '2026-01-06T00:00:00Z' },
  ];
  const points = computeControlChart(cards, 2);
  assert.strictEqual(points.length, 2);
  assert.strictEqual(points[0].cycleDays, 2);
  assert.strictEqual(points[1].cycleDays, 4);
  assert.strictEqual(points[1].average, 3);
  assert.ok(points[1].stddev > 0);
});

test('computeControlChart excludes cards with no completion date', () => {
  const points = computeControlChart([{ _id: 'c1', createdAt: '2026-01-01T00:00:00Z' }]);
  assert.strictEqual(points.length, 0);
});

test('computeLeadCycleTime uses startAt for cycle time and createdAt for lead time', () => {
  const cards = [{
    _id: 'c1',
    createdAt: '2026-01-01T00:00:00Z',
    startAt: '2026-01-02T00:00:00Z',
    endAt: '2026-01-05T00:00:00Z',
  }];
  const [point] = computeLeadCycleTime(cards);
  assert.strictEqual(point.leadDays, 4);
  assert.strictEqual(point.cycleDays, 3);
});

test('computeLeadCycleTime falls back to createdAt when startAt is unset', () => {
  const cards = [{ _id: 'c1', createdAt: '2026-01-01T00:00:00Z', archivedAt: '2026-01-04T00:00:00Z' }];
  const [point] = computeLeadCycleTime(cards);
  assert.strictEqual(point.leadDays, point.cycleDays);
});

test('computeBurndown remaining count drops as cards complete, ideal line reaches zero', () => {
  const cards = [
    { _id: 'c1', createdAt: '2026-01-01T00:00:00Z', archivedAt: '2026-01-02T00:00:00Z' },
    { _id: 'c2', createdAt: '2026-01-01T00:00:00Z' },
  ];
  const series = computeBurndown(cards, '2026-01-01', '2026-01-03');
  assert.strictEqual(series[0].remaining, 2);
  assert.strictEqual(series[1].remaining, 1);
  assert.strictEqual(series[2].ideal, 0);
});

test('computeBurndown on an empty board stays at zero remaining', () => {
  const series = computeBurndown([], '2026-01-01', '2026-01-02');
  series.forEach(day => assert.strictEqual(day.remaining, 0));
});

test('computeBurnup shows scope growth and completed work separately', () => {
  const cards = [
    { _id: 'c1', createdAt: '2026-01-01T00:00:00Z', archivedAt: '2026-01-02T00:00:00Z' },
    { _id: 'c2', createdAt: '2026-01-03T00:00:00Z' },
  ];
  const series = computeBurnup(cards, '2026-01-01', '2026-01-03');
  assert.strictEqual(series[0].total, 1);
  assert.strictEqual(series[0].completed, 0);
  assert.strictEqual(series[1].completed, 1);
  assert.strictEqual(series[2].total, 2);
});

test('computeThroughput buckets completed cards by week', () => {
  const cards = [
    { _id: 'c1', archivedAt: '2026-01-05T00:00:00Z' },
    { _id: 'c2', archivedAt: '2026-01-06T00:00:00Z' },
    { _id: 'c3', archivedAt: '2026-01-13T00:00:00Z' },
  ];
  const series = computeThroughput(cards, 'week');
  assert.strictEqual(series.length, 2);
  assert.strictEqual(series[0].count, 2);
  assert.strictEqual(series[1].count, 1);
});

test('computeThroughput ignores cards that never completed', () => {
  const series = computeThroughput([{ _id: 'c1', createdAt: '2026-01-01T00:00:00Z' }], 'day');
  assert.strictEqual(series.length, 0);
});

test('computeFlowEfficiency is active hours over total elapsed hours, capped at 100', () => {
  const cards = [{
    _id: 'c1', startAt: '2026-01-01T00:00:00Z', endAt: '2026-01-01T10:00:00Z', spentTime: 5,
  }];
  const [point] = computeFlowEfficiency(cards);
  assert.strictEqual(point.efficiency, 50);
});

test('computeFlowEfficiency skips a card with no logged time rather than guessing', () => {
  const points = computeFlowEfficiency([{ _id: 'c1', archivedAt: '2026-01-01T00:00:00Z', spentTime: 0 }]);
  assert.strictEqual(points.length, 0);
});

test('computeDashboardGroups groups and percentages sum to the total', () => {
  const cards = [{ _id: 'c1' }, { _id: 'c2' }, { _id: 'c3' }];
  const groups = computeDashboardGroups(cards, card =>
    card._id === 'c3' ? [{ key: 'bob', label: 'Bob' }] : [{ key: 'alice', label: 'Alice' }]);
  const total = groups.reduce((sum, group) => sum + group.count, 0);
  assert.strictEqual(total, 3);
  const alice = groups.find(group => group.key === 'alice');
  assert.strictEqual(alice.count, 2);
});

test('computeDashboardGroups on an empty board returns no groups', () => {
  assert.deepStrictEqual(computeDashboardGroups([], () => []), []);
});

// #812 ("reporting total hours by resource and task type"): the Time view's
// by-assignee/by-card breakdown, shared by the live view and its PDF/Excel
// export (models/lib/chartExportRows.js's 'time' branch).

test('computeTimeByGroup sums spentTime per group, not card counts', () => {
  const cards = [
    { _id: 'c1', spentTime: 2, assignees: ['alice'] },
    { _id: 'c2', spentTime: 3, assignees: ['alice'] },
    { _id: 'c3', spentTime: 5, assignees: ['bob'] },
  ];
  const groups = computeTimeByGroup(cards, card =>
    (card.assignees || []).map(id => ({ key: id, label: id })));
  const alice = groups.find(g => g.key === 'alice');
  const bob = groups.find(g => g.key === 'bob');
  assert.strictEqual(alice.hours, 5, 'alice logged 2 + 3 hours, not a count of 2 cards');
  assert.strictEqual(alice.cards, 2);
  assert.strictEqual(bob.hours, 5);
  const total = groups.reduce((sum, g) => sum + g.hours, 0);
  assert.strictEqual(total, 10);
});

test('computeTimeByGroup skips cards with no logged time entirely (negative)', () => {
  const cards = [
    { _id: 'c1', spentTime: 0, assignees: ['alice'] },
    { _id: 'c2', assignees: ['alice'] }, // no spentTime field at all
  ];
  const groups = computeTimeByGroup(cards, card =>
    (card.assignees || []).map(id => ({ key: id, label: id })));
  assert.deepStrictEqual(groups, [], 'a card with nothing logged must not appear as a zero-hour group');
});

test('computeTimeByGroup falls back to the supplied emptyGroup, not a hardcoded "none"', () => {
  const cards = [{ _id: 'c1', spentTime: 4, assignees: [] }];
  const groups = computeTimeByGroup(cards, card => (card.assignees || []).map(id => ({ key: id, label: id })),
    NO_ASSIGNEE_GROUP);
  assert.strictEqual(groups.length, 1);
  assert.strictEqual(groups[0].key, '__no_assignee__');
  assert.strictEqual(groups[0].hours, 4);
});

test('computeTimeByCard returns one row per card with logged time, largest first', () => {
  const cards = [
    { _id: 'c1', title: 'Small', spentTime: 1 },
    { _id: 'c2', title: 'Big', spentTime: 9, isOvertime: true },
    { _id: 'c3', title: 'Untouched', spentTime: 0 },
  ];
  const rows = computeTimeByCard(cards);
  assert.strictEqual(rows.length, 2, 'the untouched card (no time logged) is excluded');
  assert.strictEqual(rows[0].title, 'Big');
  assert.strictEqual(rows[0].hours, 9);
  assert.strictEqual(rows[0].isOvertime, true);
  assert.strictEqual(rows[1].title, 'Small');
  assert.strictEqual(rows[1].isOvertime, false);
});

console.log(`chartCalculations: ${passed} passed`);
