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
labels = JSON.parse(read('imports/i18n/data/ve-PP.i18n.json'));
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
