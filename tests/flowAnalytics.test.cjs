'use strict';
const assert = require('node:assert/strict');
const { computeFlowAnalytics: compute, stageHistory, blockerEpisodes, processBehavior,
  monteCarlo, flowOptions } = require('../models/lib/flowAnalytics');
const { chartExportRows } = require('../models/lib/chartExportRows');
const { flowDetailRows } = require('../models/lib/flowAnalyticsRows');
const { diffFields, contentForDirection } = require('../models/lib/changeHistoryGroups');
const { validDependencyRestore } = require('../models/lib/flowHistory');
const date = d => new Date(`2026-09-${String(d).padStart(2, '0')}T00:00:00Z`);
const now = date(26);
const lists = [{ _id: 'doing', title: 'Doing' }, { _id: 'review', title: 'Review' }];
const card = (id, overrides = {}) => ({ _id: id, boardId: 'board', title: id, listId: 'doing', createdAt: date(1), ...overrides });
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('ok -', name); }
const change = (id, at, field, before, after) => ({ entityId: id, entityType: 'card', createdAt: date(at),
  group: field === 'cardDependencies' ? 'dependencies' : 'dates',
  previousContent: { field, value: before }, newContent: { field, value: after } });
const dep = [{ cardId: 'b', type: 'blocks' }];

test('stage age uses entry, ignores same-list moves, flags p85 only with five samples', () => {
  const events = [];
  for (let i = 0; i < 5; i++) {
    events.push({ cardId: `sample${i}`, activityType: 'createCard', listId: 'doing', createdAt: date(1) });
    events.push({ cardId: `sample${i}`, activityType: 'moveCard', oldListId: 'doing', listId: 'review', createdAt: date(3) });
  }
  events.push({ cardId: 'a', activityType: 'moveCard', oldListId: 'backlog', listId: 'doing', createdAt: date(20) });
  events.push({ cardId: 'a', activityType: 'moveCard', oldListId: 'doing', listId: 'doing', createdAt: date(25) });
  const result = stageHistory([card('a'), card('unknown'), card('closed', { endAt: date(25) }), card('deleted', { deletedAt: now })], lists, events, now);
  assert.equal(result.length, 2);
  assert.equal(result[0].ageDays, 6);
  assert.equal(result[0].threshold, 2);
  assert.equal(result[0].unusual, true);
  assert.equal(result[1].ageDays, null);
});

test('repeated stage entry uses latest visit, duplicate activity/history move does not restart', () => {
  const events = [
    { activityType: 'createCard', cardId: 'a', listId: 'doing', createdAt: date(1) },
    { activityType: 'moveCard', cardId: 'a', oldListId: 'doing', listId: 'review', createdAt: date(4) },
    { activityType: 'moveCard', cardId: 'a', oldListId: 'review', listId: 'doing', createdAt: date(20) },
    { activityType: 'moveCard', cardId: 'a', oldListId: 'review', listId: 'doing', createdAt: date(21) },
  ];
  assert.equal(stageHistory([card('a')], lists, events, now)[0].ageDays, 6);
});

test('blocker history supports additions, removal, reopening and reverse-edge deduplication', () => {
  const cards = [card('a', { cardDependencies: dep }), card('b')];
  const history = [change('a', 2, 'cardDependencies', [], dep), change('a', 5, 'cardDependencies', dep, []),
    change('a', 7, 'cardDependencies', [], dep)];
  const episodes = blockerEpisodes(cards, history, now);
  assert.deepEqual(episodes.map(p => p.days), [3, 19]);
  assert.equal(episodes[0].endAt.getTime(), date(5).getTime());
  assert.equal(episodes[1].endAt, null);
  cards[1].cardDependencies = [{ cardId: 'a', type: 'is-blocked-by' }];
  // Both representations describe one edge; an old inverse keeps it blocked.
  assert.equal(blockerEpisodes(cards, [], now).length, 1);
  assert.equal(blockerEpisodes(cards, [], now)[0].days, null);
});

test('completion and list changes close/split episodes, unrelated edges do not block', () => {
  const cards = [card('a', { cardDependencies: dep, endAt: date(10) }), card('b', { listId: 'review' })];
  const history = [change('a', 2, 'cardDependencies', [], dep),
    { entityType: 'card', entityId: 'b', group: 'position', createdAt: date(5),
      previousContent: { listId: 'doing' }, newContent: { listId: 'review' } },
    change('a', 10, 'endAt', null, date(10))];
  const episodes = blockerEpisodes(cards, history, now);
  assert.deepEqual(episodes.map(p => [p.listId, p.days]), [['doing', 3], ['review', 5]]);
  for (const type of ['related-to', 'duplicates', 'is-duplicated-by']) {
    assert.equal(blockerEpisodes([card('a', { cardDependencies: [{ cardId: 'b', type }] }), card('b')], [], now).length, 0);
  }
  assert.equal(blockerEpisodes([card('a', { cardDependencies: dep }), card('b', { boardId: 'private' })], [], now).length, 0);
});

test('XmR matches the NIST worked example, rejects insufficient observations', () => {
  const values = [49.6, 47.6, 49.9, 51.3, 47.8, 51.2, 52.6, 52.4, 53.6, 52.1];
  const { limits, points } = processBehavior(values.map(cycleDays => ({ cycleDays })));
  assert.ok(Math.abs(limits.average - 50.81) < 1e-9);
  assert.ok(Math.abs(limits.upper - 55.8041) < 0.0001);
  assert.equal(points[0].movingRange, null);
  assert.equal(processBehavior([{ cycleDays: 2 }]).limits, null);
  assert.equal(processBehavior([{ cycleDays: 2 }, { cycleDays: 2 }]).limits.mrUpper, 0);
});

test('Monte Carlo includes quiet days, excludes partial today, is reproducible and uses conservative counts', () => {
  const cards = Array.from({ length: 25 }, (_, i) => card(`c${i}`, { endAt: date(i + 1) }));
  const options = flowOptions({ targetCount: 10, targetDate: '2026-10-06' }, now);
  const forecast = monteCarlo(cards, options, now);
  assert.equal(forecast.history.length, 25);
  assert.deepEqual(forecast.forecasts.map(p => [p.days, p.count]), [[10, 10], [10, 10], [10, 10], [10, 10]]);
  assert.deepEqual(forecast, monteCarlo(cards, options, now));
  const sparse = monteCarlo([card('a', { endAt: date(2) }), card('today', { endAt: now })], options, now);
  assert.equal(sparse.history.filter(row => row.count === 0).length, 24);
  assert.ok(sparse.forecasts[3].count <= sparse.forecasts[0].count);
  assert.ok(sparse.forecasts[3].days >= sparse.forecasts[0].days);
  assert.equal(monteCarlo([card('a')], options, now).forecasts.length, 0);
  const today = monteCarlo(cards, flowOptions({ targetDate: '2026-09-26' }, now), now);
  assert.ok(today.forecasts.every(p => p.count === 0));
});

test('bad forecast inputs are rejected and unfinishable work has no fabricated date', () => {
  for (const input of [{ targetCount: -1 }, { targetCount: 1.2 }, { targetCount: [] }, { historyDays: 100000 },
    { targetDate: '2026-02-30' }, { targetDate: '2026-09-25' }, { sizeField: {} }, []]) {
    assert.throws(() => flowOptions(input, now), /Invalid/);
  }
  const result = monteCarlo([card('a', { endAt: date(2) })], flowOptions({ targetCount: 10000 }, now), now);
  assert.ok(result.forecasts.every(p => p.days === null && p.date === null));
});

test('scatter retains zero estimates, separates selected units, ignores bad dates and missing values', () => {
  const cards = [card('zero', { startAt: date(1), endAt: date(5), poker: { estimation: 0 } }),
    card('field', { endAt: date(4), customFields: [{ _id: 'hours', value: 3 }] }),
    card('negative-cycle', { startAt: date(6), endAt: date(5), poker: { estimation: 5 } }),
    card('missing', { endAt: date(5) }), card('future', { endAt: '2099-01-01', poker: { estimation: 8 } })];
  const fields = [{ _id: 'hours', type: 'number', name: 'Estimated hours' }];
  const data = compute('sizeCycleTime', cards, lists, [], fields, {}, now);
  assert.deepEqual(data.points.map(p => [p.cardId, p.size, p.cycleDays]), [['zero', 0, 4]]);
  assert.equal(compute('sizeCycleTime', cards, lists, [], fields, { sizeField: 'hours' }, now).points[0].size, 3);
  assert.throws(() => compute('sizeCycleTime', cards, lists, [], fields, { sizeField: 'private-field' }, now));
  assert.equal(chartExportRows('sizeCycleTime', data).rows[0][2], 0);
});

test('dependency history has reversible empty baselines and rejects stale/cross-board restore targets', () => {
  const [addition] = diffFields('card', {}, { cardDependencies: dep }, ['cardDependencies']);
  assert.equal(addition.group, 'dependencies');
  assert.deepEqual(addition.previousContent, { field: 'cardDependencies', value: [] });
  const [removal] = diffFields('card', { cardDependencies: dep }, {}, ['cardDependencies']);
  assert.deepEqual(contentForDirection(removal, 'undo').value, dep);
  assert.deepEqual(contentForDirection(removal, 'redo').value, []);
  assert.equal(validDependencyRestore(card('a'), dep, [card('b')]), true);
  assert.equal(validDependencyRestore(card('a'), dep, [card('b', { boardId: 'secret' })]), false);
  assert.equal(validDependencyRestore(card('a'), dep, []), false);
  assert.equal(validDependencyRestore(card('a'), [], []), true);
});

test('every report exports matching summary and detail rows, without coercing unknown times', () => {
  const data = compute('blockerAnalysis', [card('a', { cardDependencies: dep }), card('b')], lists, [], [], {}, now);
  assert.equal(chartExportRows('blockerAnalysis', data).rows[0][4], 1);
  const details = flowDetailRows('blockerAnalysis', data);
  assert.equal(details.rows[0][3], 'Unknown');
  assert.equal(details.rows[0][5], 'Unknown');
  for (const key of ['agingWip', 'blockerAnalysis', 'monteCarlo', 'processBehavior', 'sizeCycleTime']) {
    const empty = compute(key, [], lists, [], [], {}, now);
    assert.ok(chartExportRows(key, empty).headers.length);
    assert.equal(chartExportRows(key, empty).rows.length, 0);
  }
});
console.log(`flowAnalytics: ${passed} tests passed`);
