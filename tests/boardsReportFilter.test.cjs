'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('boardsReportFilter:');

test('the dropdown offers every stored board permission plus All', () => {
  const ui = read('client/components/settings/adminProblems.js');
  assert.match(ui, /id: 'board-permission'/);
  for (const value of ['all', 'public', 'private']) {
    assert.match(ui, new RegExp(`value: '${value}'`));
  }
  assert.match(ui,
    /'report-boards': \{[^\n]*filter: tmpl\.boardsFilter/);
});

test('filter changes reset page and reload both rows and count', () => {
  const ui = read('client/components/settings/adminProblems.js');
  assert.match(ui,
    /'change \.js-table-page-filter'[\s\S]*cfg\.filter\.set[\s\S]*cfg\.page\.set\(1\)[\s\S]*loadReport\(reportId, \{ recount: true \}\)/);
});

test('publication and count share a validated server-side selector', () => {
  const server = read('server/publications/boards.js');
  assert.match(server, /function boardsReportQuery\(searchTerm = '', permission = 'all'\)/);
  assert.match(server,
    /permission === 'public' \|\| permission === 'private'[\s\S]*query\.permission = permission/);
  assert.match(server,
    /Meteor\.publish\('boardsReport', async function\(searchTerm = '', permission = 'all', limit, skip = 0\)/);
  assert.match(server, /async getBoardsReportCount\(searchTerm = '', permission = 'all'\)/);
  assert.strictEqual((server.match(/boardsReportQuery\(searchTerm, permission\)/g) || []).length, 2);
  assert.strictEqual((server.match(/check\(permission, Match\.OneOf\('all', 'public', 'private'\)\)/g) || []).length, 2,
    'forged filter values must be rejected in both endpoints');
});

console.log(`\nboardsReportFilter: ${passed} tests passed`);
