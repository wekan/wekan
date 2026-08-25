'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'server/publications/boards.js'), 'utf8');
const client = fs.readFileSync(path.join(root, 'client/components/boards/boardsList.js'), 'utf8');
const start = server.indexOf('async getAllBoardsPage(params)');
const method = server.slice(start, server.indexOf('// #5174', start));

test('title-sorted pages use database count, sort, skip and limit', () => {
  assert.match(method, /Boards\.find\(selector\)\.countAsync\(\)/);
  assert.match(method, /sort: \{ title: sortBy === 'title-desc' \? -1 : 1, _id: 1 \}/);
  assert.match(method, /skip: \(page - 1\) \* perPage/);
  assert.match(method, /limit: perPage/);
  assert.doesNotMatch(method, /boards\.sort|boards\.slice/);
});

test('pagination uses the same relationship-only scope as the live publication', () => {
  assert.match(method, /includePublic: false/);
  assert.match(method, /clauses\.length === 1 \? clauses\[0\] : \{ \$or: clauses \}/);
  assert.doesNotMatch(method, /\$or: boardVisibilitySelectors/);
});

test('menu filters are encoded before the query', () => {
  assert.match(method, /selector\._id = \{ \$in: starred \}/);
  assert.match(method, /selector\.type = 'template-container'/);
  assert.match(method, /selector\._id = \{ \$nin: Object\.keys\(assignments\) \}/);
  assert.match(method, /Object\.keys\(assignments\)\.filter\(id => assignments\[id\] === menu\)/);
});

test('cross-category search also subscribes to template documents', () => {
  assert.match(
    client,
    /selectedMenu\.get\(\) !== 'templates' && !this\.boardSearchVar\.get\(\)/,
  );
});
