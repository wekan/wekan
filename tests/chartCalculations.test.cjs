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
  computeCompletionForecast,
  computeFlowEfficiency,
  computeActivityPulse,
  computeDashboardGroups,
  computeTimeByGroup,
  computeTimeByCard,
  computeRemainingTimeSum,
  formatRemainingTime,
  computeCardsByCustomFieldGroup,
  NO_ROADMAP_GROUP,
  translateGroupLabel,
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

// #1476 ("completion estimates based on velocity"): projects a completion
// date for the still-open cards from the recent weeks of the Throughput
// Histogram's own series, reused rather than recomputed.

test('computeCompletionForecast projects a date from remaining count / recent average velocity', () => {
  const cards = [
    { _id: 'c1', createdAt: '2026-01-01T00:00:00Z' }, // still open
    { _id: 'c2', createdAt: '2026-01-01T00:00:00Z' }, // still open
  ];
  // 2 completed per week, most recent 4 weeks.
  const series = [
    { bucket: '2026-01-05', count: 2 },
    { bucket: '2026-01-12', count: 2 },
  ];
  const forecast = computeCompletionForecast(cards, series, 7, 4);
  assert.strictEqual(forecast.remaining, 2);
  assert.strictEqual(forecast.averagePerBucket, 2);
  // 2 remaining / 2 per week = 1 week = 1 bucket needed.
  assert.strictEqual(forecast.bucketsNeeded, 1);
  assert.ok(forecast.projectedDate, 'a projected date is returned when velocity is positive');
});

test('computeCompletionForecast returns zero-remaining with no projected date when everything is done', () => {
  const cards = [{ _id: 'c1', createdAt: '2026-01-01T00:00:00Z', archivedAt: '2026-01-02T00:00:00Z' }];
  const forecast = computeCompletionForecast(cards, [{ bucket: '2026-01-05', count: 1 }]);
  assert.strictEqual(forecast.remaining, 0);
  assert.strictEqual(forecast.projectedDate, null);
});

test('computeCompletionForecast (negative) gives no projected date when recent velocity is zero', () => {
  const cards = [{ _id: 'c1', createdAt: '2026-01-01T00:00:00Z' }]; // still open
  const forecast = computeCompletionForecast(cards, [{ bucket: '2026-01-05', count: 0 }]);
  assert.strictEqual(forecast.remaining, 1);
  assert.strictEqual(forecast.averagePerBucket, 0);
  assert.strictEqual(forecast.bucketsNeeded, null);
  assert.strictEqual(forecast.projectedDate, null);
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

// #1121 ("show the SUM of remaining time until due date"): sums the time
// between `now` and each open card's dueAt, across the board's/list's still-
// open cards. `now` is fixed at midnight so a whole-day due date lands on an
// exact hour boundary rather than depending on wall-clock time.
const NOW_1121 = new Date('2026-01-10T00:00:00.000Z');

test('computeRemainingTimeSum sums remaining time for open cards with a due date', () => {
  const cards = [
    { _id: 'c1', dueAt: '2026-01-13T00:00:00.000Z' }, // 3 days from now
    { _id: 'c2', dueAt: '2026-01-13T09:00:00.000Z' }, // 3 days 9 hours from now
  ];
  const result = computeRemainingTimeSum(cards, NOW_1121);
  assert.strictEqual(result.cardCount, 2);
  assert.strictEqual(result.totalHours, 153); // 72 + 81
  assert.strictEqual(result.days, 6);
  assert.strictEqual(result.hours, 9);
});

test('computeRemainingTimeSum excludes archived and already-completed cards (negative)', () => {
  const cards = [
    { _id: 'archived', dueAt: '2026-01-20T00:00:00.000Z', archived: true },
    { _id: 'done-endAt', dueAt: '2026-01-20T00:00:00.000Z', endAt: '2026-01-09T00:00:00.000Z' },
    { _id: 'done-archivedAt', dueAt: '2026-01-20T00:00:00.000Z', archivedAt: '2026-01-09T00:00:00.000Z' },
  ];
  const result = computeRemainingTimeSum(cards, NOW_1121);
  assert.strictEqual(result.cardCount, 0, 'archived/completed cards must not count toward the sum');
  assert.strictEqual(result.totalHours, 0);
});

test('computeRemainingTimeSum excludes open cards with no due date set (negative)', () => {
  const cards = [
    { _id: 'no-due' },
    { _id: 'with-due', dueAt: '2026-01-11T00:00:00.000Z' },
  ];
  const result = computeRemainingTimeSum(cards, NOW_1121);
  assert.strictEqual(result.cardCount, 1, 'a card with no dueAt is not part of "remaining time until due"');
  assert.strictEqual(result.totalHours, 24);
});

test('computeRemainingTimeSum counts an overdue card as NEGATIVE remaining time, not zero', () => {
  // Decision: an overdue open card (dueAt already in the past, no end date
  // yet) contributes its negative remaining time to the total instead of
  // being floored at 0 - the running total should shrink, and go negative,
  // once cards slip past their due date, rather than silently ignoring them.
  const cards = [
    { _id: 'overdue', dueAt: '2026-01-09T00:00:00.000Z' }, // 1 day ago
  ];
  const result = computeRemainingTimeSum(cards, NOW_1121);
  assert.strictEqual(result.cardCount, 1);
  assert.strictEqual(result.totalHours, -24);
  assert.strictEqual(result.days, -1);
  assert.strictEqual(result.hours, 0);
});

test('computeRemainingTimeSum mixes overdue and upcoming cards into one signed total', () => {
  const cards = [
    { _id: 'overdue', dueAt: '2026-01-09T00:00:00.000Z' }, // -24h
    { _id: 'upcoming', dueAt: '2026-01-11T06:00:00.000Z' }, // +30h
  ];
  const result = computeRemainingTimeSum(cards, NOW_1121);
  assert.strictEqual(result.totalHours, 6);
  assert.strictEqual(result.days, 0);
  assert.strictEqual(result.hours, 6);
});

test('formatRemainingTime renders "X days, Y hours" per #1121\'s own example format', () => {
  const result = computeRemainingTimeSum(
    [{ _id: 'c1', dueAt: '2026-01-16T09:00:00.000Z' }], // 6 days 9 hours
    NOW_1121,
  );
  assert.strictEqual(formatRemainingTime(result), '6 days, 9 hours');
});

test('formatRemainingTime shows a single leading minus for an overdue total', () => {
  const result = computeRemainingTimeSum(
    [{ _id: 'c1', dueAt: '2026-01-08T15:00:00.000Z' }], // -1 day 9 hours
    NOW_1121,
  );
  assert.strictEqual(formatRemainingTime(result), '-1 days, 9 hours');
});

// #1292 ("GitHub Pulse-like graph"): total board activity per day/week.
test('computeActivityPulse buckets activity documents by day, zero-filled', () => {
  const activities = [
    { createdAt: '2026-01-01T08:00:00Z' },
    { createdAt: '2026-01-01T20:00:00Z' },
    { createdAt: '2026-01-03T12:00:00Z' },
  ];
  const series = computeActivityPulse(activities, '2026-01-01', '2026-01-03', 'day');
  assert.deepStrictEqual(series, [
    { day: '2026-01-01', count: 2 },
    { day: '2026-01-02', count: 0 },
    { day: '2026-01-03', count: 1 },
  ]);
});

test('computeActivityPulse on a board with no activity in the window returns all-zero buckets (negative)', () => {
  const series = computeActivityPulse([], '2026-01-01', '2026-01-02', 'day');
  assert.deepStrictEqual(series, [
    { day: '2026-01-01', count: 0 },
    { day: '2026-01-02', count: 0 },
  ]);
});

test('computeActivityPulse ignores activity outside the from/to window', () => {
  const activities = [
    { createdAt: '2025-12-31T23:59:59Z' }, // before window
    { createdAt: '2026-01-01T00:00:00Z' }, // in window
    { createdAt: '2026-01-04T00:00:00Z' }, // after window
  ];
  const series = computeActivityPulse(activities, '2026-01-01', '2026-01-02', 'day');
  const total = series.reduce((sum, day) => sum + day.count, 0);
  assert.strictEqual(total, 1, 'only the in-window activity is counted');
});

test('computeActivityPulse buckets by week (Monday start) when asked', () => {
  const activities = [
    { createdAt: '2026-01-05T00:00:00Z' }, // Monday
    { createdAt: '2026-01-08T00:00:00Z' }, // Thursday, same week
    { createdAt: '2026-01-12T00:00:00Z' }, // next Monday
  ];
  const series = computeActivityPulse(activities, '2026-01-05', '2026-01-12', 'week');
  assert.deepStrictEqual(series, [
    { day: '2026-01-05', count: 2 },
    { day: '2026-01-12', count: 1 },
  ]);
});

// Roadmap board view (#627: "a Roadmap view organizing cards by version/
// release milestone") - groups cards by the VALUE of one custom field,
// keeping the actual cards per group (not just a count) so the Roadmap view
// can plot each row as its own Gantt timeline.
test('computeCardsByCustomFieldGroup groups cards by a custom field value, keeping the cards', () => {
  const cards = [
    { _id: 'c1', title: 'Card 1' },
    { _id: 'c2', title: 'Card 2' },
    { _id: 'c3', title: 'Card 3' },
  ];
  const valueByCard = { c1: 'v1.0', c2: 'v1.0', c3: 'v2.0' };
  const groups = computeCardsByCustomFieldGroup(cards, card => valueByCard[card._id]);
  assert.deepStrictEqual(groups.map(g => [g.key, g.cards.length]), [
    ['v1.0', 2],
    ['v2.0', 1],
  ]);
  assert.deepStrictEqual(groups[0].cards.map(c => c._id), ['c1', 'c2']);
});

test('computeCardsByCustomFieldGroup (negative) puts cards with no value in the empty group, sorted last', () => {
  const cards = [
    { _id: 'c1' },
    { _id: 'c2' },
  ];
  const valueByCard = { c2: 'v1.0' };
  const groups = computeCardsByCustomFieldGroup(cards, card => valueByCard[card._id]);
  assert.deepStrictEqual(groups.map(g => g.key), ['v1.0', NO_ROADMAP_GROUP.key]);
  assert.strictEqual(groups[groups.length - 1].cards[0]._id, 'c1');
});

test('computeCardsByCustomFieldGroup sorts real groups alphabetically by label', () => {
  const cards = [{ _id: 'c1' }, { _id: 'c2' }, { _id: 'c3' }];
  const valueByCard = { c1: 'v2.0', c2: 'v1.0', c3: 'v1.5' };
  const groups = computeCardsByCustomFieldGroup(cards, card => valueByCard[card._id]);
  assert.deepStrictEqual(groups.map(g => g.key), ['v1.0', 'v1.5', 'v2.0']);
});

test('translateGroupLabel translates the Roadmap "no value" sentinel, like the assignee/label ones', () => {
  const translate = (key, fallback) => (key === 'roadmap-no-value' ? 'Ei arvoa' : fallback);
  assert.strictEqual(translateGroupLabel(NO_ROADMAP_GROUP.label, translate), 'Ei arvoa');
  assert.strictEqual(translateGroupLabel('v1.0', translate), 'v1.0');
});

console.log(`chartCalculations: ${passed} passed`);
