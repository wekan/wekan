'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = filename => fs.readFileSync(path.join(root, filename), 'utf8');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
let labels = { ...en, 'operator-user': "lo'wI'", 'operator-title': "pong’le'" };
const context = { TAPi18n: { __: key => labels[key] || key }, Boards: { colorMap: () => ({}) }, console };
vm.createContext(context);
vm.runInContext(read('config/search-const.js').replace(/export /g, '') + '\n' +
  read('config/query-classes.js').replace(/import[\s\S]*?from ['"][^'"]+['"];\s*/g, '').replace(/export /g, '') +
  '\nthis.Query = Query;', context);
function query(text) {
  const result = new context.Query();
  result.buildParams(text);
  return result;
}
assert.equal(query("lo'wI':Alice").getQueryParams().getPredicate('user'), 'Alice');
assert.equal(query("pong’le':\"two words\"").getQueryParams().getPredicate('title'), 'two words');
assert.equal(query('board:Roadmap').getQueryParams().getPredicate('board'), 'Roadmap');
assert.equal(query('board:"two words"').getQueryParams().getPredicate('board'), 'two words');
assert.equal(query("unknown'operator:value").hasErrors(), true);
assert.equal(query("'plain words'").getQueryParams().text, 'plain words');
labels = JSON.parse(read('imports/i18n/data/tlh.i18n.json'));
for (const [key, operator] of [
  ['operator-user', 'user'], ['operator-member', 'members'],
  ['operator-assignee', 'assignees'], ['operator-creator', 'userId'],
  ['operator-board', 'board'], ['operator-swimlane', 'swimlane'],
  ['operator-list', 'list'], ['operator-title', 'title'],
  ['operator-description', 'description'], ['operator-attachment-text', 'attachment-text'], ['operator-checklist-text', 'checklist-text'],
]) {
  const parsed = query(`${labels[key]}:"two words"`);
  assert.equal(parsed.hasErrors(), false, key);
  assert.equal(parsed.getQueryParams().getPredicate(operator), 'two words', key);
}
labels = JSON.parse(read('imports/i18n/data/ca@valencia.i18n.json'));
const valencianChecklist = query(`${labels['operator-checklist-text']}:"two words"`);
assert.equal(valencianChecklist.hasErrors(), false);
assert.equal(valencianChecklist.getQueryParams().getPredicate('checklist-text'), 'two words');
for (const absent of [false, true]) {
  const parsed = query(`${labels['operator-has']}:${absent ? '-' : ''}${labels['predicate-checklist']}`);
  assert.equal(parsed.hasErrors(), false);
  assert.deepEqual(JSON.parse(JSON.stringify(parsed.getQueryParams().getPredicate('has'))), { field: 'checklist', exists: !absent });
}
assert.equal(query(`${labels['operator-has']}:nonexistent-field`).hasErrors(), true);
labels = JSON.parse(read('imports/i18n/data/ve-PP.i18n.json'));
assert.equal(labels['operator-title'], 'nimi');
for (const text of ['nimi:"Demo card"', 'nimi:Demo']) {
  const parsed = query(text);
  assert.equal(parsed.hasErrors(), false);
  assert.equal(parsed.getQueryParams().getPredicate('title'), text.includes('"') ? 'Demo card' : 'Demo');
}
assert.equal(query('unknownoperator:Demo').hasErrors(), true);
assert.equal(query('lugetiž:Blocked').getQueryParams().getPredicate('list'), 'Blocked');
assert.equal(query('lugetiž:"Kodvi"').getQueryParams().getPredicate('list'), 'Kodvi');
context.now = () => new Date('2026-09-14T00:00:00Z');
context.formatDate = date => date.toISOString();
const overdue = query(`${labels['operator-due']}:${labels['predicate-overdue']}`);
assert.equal(overdue.hasErrors(), false);
assert.equal(overdue.getQueryParams().getPredicate('dueAt').operator, '$lt');
assert.equal(overdue.getQueryParams().getPredicate('dueAt').value, '2026-09-14T00:00:00.000Z');
assert.equal(query(`${labels['operator-due']}:overdue`).hasErrors(), false);
assert.equal(query(`${labels['operator-due']}:unknown-predicate`).hasErrors(), true);
assert.equal(query(`${labels['operator-created']}:${labels['predicate-overdue']}`).hasErrors(), true);
console.log('localizedSearchApostrophes: localized operators, quoted values, ordinary operators and unknown names verified');

labels = JSON.parse(read('imports/i18n/data/zgh.i18n.json'));
assert.equal(labels['operator-customfield'], 'ⵉⴳⵔⵉⵥⵍⵉⵏ');
assert.doesNotMatch(labels['operator-customfield'], /\s|Champ/);
for (const value of ['Priority', '"two words"']) {
  const parsed = query(`${labels['operator-customfield']}:${value}`);
  assert.equal(parsed.hasErrors(), false);
  assert.equal(parsed.getQueryParams().getPredicate('customfield'), value.replaceAll('"', ''));
}

// The real parser must preserve the offending limit for translated %s output.
for (const value of ['abc', '-2']) {
  const parsed = query(`${labels['operator-limit']}:${value}`);
  assert.equal(parsed.hasErrors(), true);
  assert.deepEqual(JSON.parse(JSON.stringify(parsed.errors())), [
    { tag: 'operator-limit-invalid', value },
  ]);
  assert.equal((labels['operator-limit-invalid'].match(/%s/g) || []).length, 1);
}
for (const value of ['0', '12']) {
  const parsed = query(`${labels['operator-limit']}:${value}`);
  assert.equal(parsed.hasErrors(), false);
  assert.equal(parsed.errors().length, 0);
  if (value === '12') assert.equal(parsed.getQueryParams().getPredicate('limit'), 12);
}

for (const [key, field] of [['predicate-start', 'startAt'], ['predicate-end', 'endAt']]) {
  for (const absent of [false, true]) {
    const parsed = query(`${labels['operator-has']}:${absent ? '-' : ''}${labels[key]}`);
    assert.equal(parsed.hasErrors(), false, key);
    assert.deepEqual(JSON.parse(JSON.stringify(parsed.getQueryParams().getPredicate('has'))),
      { field, exists: !absent });
  }
  // These existence predicates must not become valid sort predicates.
  assert.equal(query(`${labels['operator-sort']}:${labels[key]}`).hasErrors(), true);
}

context.subtract = (date, days, unit) => {
  assert.equal(unit, 'days');
  return new Date(date.getTime() - days * 86400000);
};
const createdFilter = query(`${labels['operator-created']}:3`);
assert.equal(createdFilter.hasErrors(), false);
assert.deepEqual(JSON.parse(JSON.stringify(createdFilter.getQueryParams().getPredicate('createdAt'))),
  { operator: '$gte', value: '2026-09-11T00:00:00.000Z' });
assert.equal(query(`${labels['operator-created']}:invalid-period`).hasErrors(), true);
for (const [prefix, order] of [['', 'asc'], ['-', 'des']]) {
  const parsed = query(`${labels['operator-sort']}:${prefix}${labels['predicate-created']}`);
  assert.equal(parsed.hasErrors(), false);
  assert.deepEqual(JSON.parse(JSON.stringify(parsed.getQueryParams().getPredicate('sort'))),
    { name: 'createdAt', order });
}
