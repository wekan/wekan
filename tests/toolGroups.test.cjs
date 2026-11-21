'use strict';
// The Import page and the Export menu show the other tools grouped by kind,
// from one table (models/lib/toolGroups.js), so a tool is in the same group
// whether it is read or written.
// Run: node --test tests/toolGroups.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { TOOL_GROUPS, MEMBERS, toolGroupOf, groupTools, withoutCompany } = require('../models/lib/toolGroups');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));

test('every import source and every export tool is named in a group, once', () => {
  const importKeys = [...read('models/lib/importSources.js').matchAll(/\{ key: '([a-z]+)', (?:name|product)/g)].map(m => m[1]);
  const exportScope = read('client/components/boards/exportScope.js');
  const json = exportScope.slice(exportScope.indexOf("key: 'json',"), exportScope.indexOf('// Is this popup a whole board'));
  const exportKeys = [...json.matchAll(/key: '([a-z-]+)'/g), ...json.matchAll(/\['([a-z]+)', '[^']+'\]/g)].map(m => m[1])
    .filter(key => key !== 'json' || true);
  const named = Object.values(MEMBERS).flat();
  assert.strictEqual(new Set(named).size, named.length, 'no tool in two groups');
  const missing = [...new Set([...importKeys, ...exportKeys])].filter(key => !named.includes(key));
  assert.deepStrictEqual(missing, [], 'a tool no group names would fall into Kanban without anyone deciding');
  assert.ok(importKeys.length >= 58 && exportKeys.length >= 40);
});

test('the groups are in order, each with a heading in English', () => {
  assert.deepStrictEqual(TOOL_GROUPS.map(g => g.group), ['wekan', '37signals', 'atlassian', 'google', 'microsoft', 'sandstorm',
    'kanban', 'issues', 'tasks', 'spreadsheets', 'text', 'messages', 'website', 'api']);
  for (const g of TOOL_GROUPS.filter(t => t.labelKey)) assert.strictEqual(typeof en[g.labelKey], 'string', g.labelKey);
  assert.deepStrictEqual(['gitlab', 'mail', 'slack', 'csv', 'planka', 'wordpress', 'htmlsite', 'sandstormwordpress'].map(toolGroupOf),
    ['issues', 'messages', 'messages', 'spreadsheets', 'api', 'website', 'website', 'sandstorm']);
});

test('grouping keeps the order inside a group and heads only the first of each', () => {
  const out = groupTools([{ key: 'slack' }, { key: 'kanboard' }, { key: 'wekan' }, { key: 'mail' }, { key: 'gitlab' }, { key: 'deck' }]);
  assert.deepStrictEqual(out.map(t => t.key), ['wekan', 'kanboard', 'deck', 'gitlab', 'slack', 'mail']);
  assert.deepStrictEqual(out.map(t => t.groupStart), [true, true, false, true, true, false]);
  assert.deepStrictEqual(out.filter(t => t.groupStart).map(t => t.groupLabelKey), [null, 'tool-group-kanban', 'tool-group-issues', 'tool-group-messages']);
  assert.deepStrictEqual(groupTools([]), []);
});

// 2026-11-20: a company with more than one product is ONE heading with its
// products under it, without the company's name repeated in each.
test('a company with several products is headed by its name, which its products drop', () => {
  const out = groupTools([
    { key: 'slack', name: 'Slack' }, { key: 'mstodo', name: 'Microsoft To Do' }, { key: 'trello', name: 'Trello' },
    { key: 'planner', label: 'Microsoft Planner' }, { key: 'googlekeep', name: 'Google Keep' }, { key: 'fizzy', name: 'Fizzy' },
    { key: 'jira', name: 'Jira' }, { key: 'excel', name: 'Excel' }, { key: 'basecamp', name: 'Basecamp' },
    { key: 'googletakeout', name: 'Google Takeout' }, { key: 'github', name: 'GitHub' },
  ]);
  assert.deepStrictEqual(out.map(t => t.name || t.label),
    ['Fizzy', 'Basecamp', 'Trello', 'Jira', 'Keep', 'Takeout', 'To Do', 'Planner', 'Excel', 'GitHub', 'Slack']);
  assert.deepStrictEqual(out.filter(t => t.groupStart).map(t => t.groupLabel),
    ['37signals', 'Atlassian', 'Google', 'Microsoft', null]);
  assert.deepStrictEqual(out.filter(t => t.groupStart).map(t => t.groupLabelKey), [null, null, null, null, 'tool-group-messages']);
  // 2026-11-21: Lists, Project, Outlook, Teams, OneNote and Azure DevOps Boards
  // joined Microsoft's heading; a name without "Microsoft " stays whole.
  assert.deepStrictEqual(groupTools(['outlook', 'msproject', 'teams', 'onenote', 'mslists', 'azuredevops'].map(key => ({ key,
    name: { outlook: 'Microsoft Outlook (.msg)', msproject: 'Microsoft Project (XML)', teams: 'Microsoft Teams', onenote: 'Microsoft OneNote',
      mslists: 'Microsoft Lists', azuredevops: 'Azure DevOps Boards' }[key] }))).map(t => [t.group, t.name]),
  [['microsoft', 'Outlook (.msg)'], ['microsoft', 'Project (XML)'], ['microsoft', 'Teams'], ['microsoft', 'OneNote'],
    ['microsoft', 'Lists'], ['microsoft', 'Azure DevOps Boards']]);
});

test('negative: a company group needs two products, and only its own name is dropped', () => {
  const importNames = new Map([...read('models/lib/importSources.js')
    .matchAll(/\{ key: '([a-z]+)', name: '([^']+)'/g)].map(m => [m[1], m[2]]));
  for (const def of TOOL_GROUPS.filter(g => g.label)) {
    const keys = MEMBERS[def.group];
    assert.ok(keys.every(k => importNames.has(k) || k.startsWith('trello')), `${def.label}: a key that is not a tool`);
    // Trello's three ways out (file, .zip, API) are one product.
    const products = new Set(keys.map(k => k.replace(/^trello.*/, 'trello')));
    assert.ok(products.size >= 2, `${def.label} heads only one product`);
    assert.strictEqual(def.labelKey, undefined, 'a company name is not translated');
  }
  // A product somewhere else keeps its whole name, and a bare company name
  // stays rather than becoming empty.
  assert.deepStrictEqual(groupTools([{ key: 'slack', name: 'Microsoft Slack' }])[0].name, 'Microsoft Slack');
  assert.strictEqual(withoutCompany('Microsoft', 'Microsoft'), 'Microsoft');
  assert.strictEqual(withoutCompany('Microsoftish Tool', 'Microsoft'), 'Microsoftish Tool');
  assert.strictEqual(withoutCompany(undefined, 'Microsoft'), undefined);
  // No product name left in a kind group starts with a company that has a group.
  const companies = TOOL_GROUPS.filter(g => g.label).map(g => g.label);
  const loose = [...importNames].filter(([key, name]) => !TOOL_GROUPS.find(g => g.group === toolGroupOf(key)).label
    && companies.some(c => name.startsWith(`${c} `)));
  assert.deepStrictEqual(loose, [], 'a company product outside its company group');
});

test('both pages draw the headings', () => {
  assert.match(read('client/components/import/import.jade'), /each importSources\n\s*if groupHeading\n\s*li\.import-source-group \{\{groupHeading\}\}/);
  assert.match(read('client/components/import/import.js'), /groupTools\(IMPORT_SOURCES\.map/);
  assert.match(read('client/components/import/import.js'), /source\.groupLabel \|\| product/);
  assert.match(read('client/components/boards/exportScope.js'), /entry\.groupLabel \|\| group\.heading/);
  assert.match(read('client/components/boards/exportScope.js'), /if \(group\.key !== 'json'\) return \[group\];[\s\S]*groupTools\(group\.entries\)/);
});
