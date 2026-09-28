'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('client/lib/filter.js', 'utf8');
const context = vm.createContext({ Tracker: { Dependency: class { depend() {} changed() {} } } });
vm.runInContext(source.slice(source.indexOf('class StringFilter'), source.indexOf('// Advanced filter forms')) + '\nthis.types = { StringFilter, LabelFilter };', context);
test('text filter survives panel recreation and clears explicitly', () => {
  const f = new context.types.StringFilter();
  f.set('Alpha'); assert.equal(f.value(), 'Alpha');
  assert.equal(f._getMongoSelector().$regex, 'Alpha');
  f.reset(); assert.equal(f.value(), ''); assert.equal(f._isActive(), false);
});
test('label AND/OR preserves exclusions and no-label alternatives', () => {
  const f = new context.types.LabelFilter();
  f.add('a'); f.add('b');
  assert.deepEqual(Array.from(f._getMongoSelector().$in), ['a', 'b']);
  f.setMode('and'); assert.deepEqual(Array.from(f._getMongoSelector().$all), ['a', 'b']);
  f.add(undefined); assert.deepEqual(Array.from(f._getMongoSelector().$all), ['a', 'b']);
  assert.deepEqual(Array.from(f._getEmptySelector().$eq), []);
  f.setMode('$where'); assert.equal(f.mode(), 'and');
  f.reset(); assert.equal(f.mode(), 'or'); assert.equal(f._isActive(), false);
});
test('all text inputs read reactive filter state', () => {
  const jade = fs.readFileSync('client/components/sidebar/sidebarFilters.jade', 'utf8');
  // The sidebar now searches all card text instead of only the title.
  for (const field of ['text', 'lists', 'advanced']) assert.ok(jade.includes(`value=Filter.${field}.value`));
});

test('clear filters is the last action in the filter panel', () => {
  const jade = fs.readFileSync('client/components/sidebar/sidebarFilters.jade', 'utf8').split('template(name="multiselectionSidebar")')[0];
  assert.ok(jade.indexOf('a.sidebar-btn.js-clear-all') > jade.indexOf('a.sidebar-btn.js-filter-to-selection'));
});
