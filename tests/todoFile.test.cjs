'use strict';
// TODO.md holds what is not done yet, with why. It was the TODO Later block in
// `# Status` of CHANGELOG-big.md until 2026-11-18. When an item is done it is
// removed here and its entry goes into the changelog's Upcoming section.
// Run: node --test tests/todoFile.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const todo = read('TODO.md');
const items = todo.split('\n').filter(line => line.startsWith('- '));
const categories = todo.split(/^## /m).slice(1);

test('TODO.md says what it is, and every category holds an item', () => {
  assert.match(todo, /^# TODO\n/);
  assert.match(todo, /REMOVE it from this file and write its entry/);
  assert.ok(categories.length > 0, 'at least one category');
  for (const category of categories) {
    assert.ok(/^- /m.test(category), `an emptied category is removed: ${category.split('\n')[0]}`);
  }
});

test('negative: nothing in TODO.md is done - no thanks, no commit links, no bare issue numbers', () => {
  assert.doesNotMatch(todo, /Thanks to /);
  assert.doesNotMatch(todo, /wekan\/commit\//);
  assert.doesNotMatch(todo, /<details>|<summary>/, 'plain Markdown');
  const body = todo.replace(/\[#\d+\]\(https:\/\/github\.com\/wekan\/wekan\/issues\/\d+\)/g, '')
    // GHSA ids and the per-list issue number (#4527) named as context are text.
    .replace(/#4527\b/g, '');
  const bare = /(^|[^\[\/\w])#\d{3,5}\b/.exec(body);
  assert.ok(!bare, `an issue named without its link: ${bare && bare[0]}`);
});

test('the changelog keeps no TODO Later of its own and points to TODO.md', () => {
  const changelog = read('CHANGELOG-big.md');
  const status = changelog.slice(0, changelog.search(/^# (?:v\d|Upcoming WeKan)/m));
  assert.doesNotMatch(status, /<summary>TODO Later<\/summary>/);
  assert.match(status, /\[TODO\.md\]\(TODO\.md\)/);
});

test('an issue fixed in the Upcoming release is no longer in TODO.md', () => {
  const changelog = read('CHANGELOG-big.md');
  const start = changelog.indexOf('# Upcoming WeKan ® release');
  if (start < 0) return;
  const end = changelog.indexOf('\n# v', start);
  const upcoming = changelog.slice(start, end < 0 ? undefined : end);
  const listed = new Set([...todo.matchAll(/issues\/(\d+)\)/g)].map(m => m[1]));
  const fixed = [...upcoming.matchAll(/Fixes #(\d+)|issues\/(\d+)\)\s*\(fixed/g)].map(m => m[1] || m[2]);
  assert.deepStrictEqual(fixed.filter(n => listed.has(n)), []);
  assert.ok(items.length > 0);
});
