#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const {
  DASHBOARD_PAGE_SIZE,
  MAP_POINT_LIMIT,
  buildBoardDashboard,
  dashboardSelector,
  dueBucket,
  normalizeDashboardPage,
} = require('../models/lib/boardDashboard');
const { SAVED_SEARCH_LIMIT, normalizeSavedSearch } = require('../models/lib/savedSearch');

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('dashboard groups cards by list, member, label and due bucket', () => {
  const now = new Date(2026, 7, 17, 12, 0);
  const dashboard = buildBoardDashboard({
    now,
    lists: [{ _id: 'l1', title: 'Doing' }],
    members: [{ _id: 'u1', username: 'admin' }],
    labels: [{ _id: 'red', name: 'Urgent' }],
    cards: [
      { _id: 'c1', title: 'A', listId: 'l1', members: ['u1'], labelIds: ['red'], dueAt: new Date(2026, 7, 16) },
      { _id: 'c2', title: 'B', listId: 'l1', assignees: ['u1'], labelIds: ['red'], dueAt: new Date(2026, 7, 17, 16) },
    ],
  });
  assert.deepEqual(dashboard.dimensions.list[0], { key: 'l1', label: 'Doing', count: 2 });
  assert.equal(dashboard.dimensions.member[0].count, 2);
  assert.equal(dashboard.dimensions.label[0].label, 'Urgent');
  assert.deepEqual(dashboard.dimensions.due.map(bucket => bucket.key).sort(), ['overdue', 'today']);
});

test('map points use real card locations and cap rendering work', () => {
  const cards = Array.from({ length: MAP_POINT_LIMIT + 2 }, (_, index) => ({
    _id: `c${index}`,
    title: `Card ${index}`,
    listId: 'l1',
    locations: [{ _id: `p${index}`, latitude: 10 + index / 1000, longitude: 106 }],
  }));
  const dashboard = buildBoardDashboard({ cards, lists: [{ _id: 'l1', title: 'Map' }] });
  assert.equal(dashboard.mapPoints.length, MAP_POINT_LIMIT);
  assert.equal(dashboard.mapPointTotal, MAP_POINT_LIMIT + 2);
  assert.equal(dashboard.mapPointsTruncated, true);
});

test('due drill-down selectors are bounded to the requested bucket', () => {
  const now = new Date(2026, 7, 17, 12, 0);
  assert.equal(dueBucket({ dueAt: new Date(2026, 7, 16) }, now), 'overdue');
  assert.ok(dashboardSelector('due', 'today', now).dueAt.$gte instanceof Date);
  assert.equal(dashboardSelector('unknown', 'x', now), null);
});

test('dashboard pages clamp skip and limit', () => {
  assert.deepEqual(normalizeDashboardPage(-5, 999), { skip: 0, limit: 50 });
  assert.deepEqual(normalizeDashboardPage(undefined, undefined), {
    skip: 0,
    limit: DASHBOARD_PAGE_SIZE,
  });
});

test('saved searches validate and remain bounded per user', () => {
  assert.deepEqual(normalizeSavedSearch({ name: ' Urgent ', query: ' due:week ' }), {
    value: { name: 'Urgent', query: 'due:week' },
  });
  assert.equal(normalizeSavedSearch({ name: '', query: 'x' }).error, 'saved-search-invalid-name');
  assert.equal(normalizeSavedSearch({ name: 'x', query: '' }).error, 'saved-search-invalid-query');
  assert.equal(SAVED_SEARCH_LIMIT, 25);
});

test('product wiring scopes dashboard and saved searches to authenticated users', () => {
  const boardsServer = read('server/publications/boards.js');
  const savedServer = read('server/savedSearches.js');
  const users = read('models/users.js');
  const boardBody = read('client/components/boards/boardBody.jade');
  const stats = read('client/components/boards/statsView.jade');
  const map = read('client/components/boards/mapView.jade');
  const search = read('client/components/main/globalSearch.jade');
  assert.match(boardsServer, /board\.isVisibleBy\(\{ _id: this\.userId \}\)/);
  assert.match(boardsServer, /limit: page\.limit/);
  assert.match(boardsServer, /fields: \{ _id: 1, title: 1, boardId: 1, listId: 1, dueAt: 1 \}/);
  assert.match(savedServer, /_id: this\.userId/);
  assert.doesNotMatch(savedServer, /input\.userId|input\.ownerId/);
  assert.match(users, /profile\.savedSearches/);
  assert.match(boardBody, /\+statsView/);
  assert.match(boardBody, /\+mapView/);
  assert.match(stats, /js-dashboard-bucket/);
  assert.match(map, /map-view-world/);
  assert.match(search, /js-save-search/);
});

let failed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`  ok - ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  not ok - ${name}`);
    console.error(error.stack || error);
  }
}
console.log(`\nphase4 views/search: ${tests.length - failed}/${tests.length} passed`);
if (failed) process.exitCode = 1;
