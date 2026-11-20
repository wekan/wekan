'use strict';
// The Import page and the Export menu show the other tools grouped by kind,
// from one table (models/lib/toolGroups.js), so a tool is in the same group
// whether it is read or written.
// Run: node --test tests/toolGroups.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { TOOL_GROUPS, MEMBERS, toolGroupOf, groupTools } = require('../models/lib/toolGroups');

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
  assert.deepStrictEqual(TOOL_GROUPS.map(g => g.group), ['wekan', 'kanban', 'issues', 'tasks', 'spreadsheets', 'text', 'messages', 'api']);
  for (const g of TOOL_GROUPS.filter(t => t.labelKey)) assert.strictEqual(typeof en[g.labelKey], 'string', g.labelKey);
  assert.deepStrictEqual(['jira', 'github', 'mail', 'slack', 'csv', 'planka'].map(toolGroupOf),
    ['issues', 'issues', 'messages', 'messages', 'spreadsheets', 'api']);
});

test('grouping keeps the order inside a group and heads only the first of each', () => {
  const out = groupTools([{ key: 'slack' }, { key: 'trello' }, { key: 'wekan' }, { key: 'mail' }, { key: 'jira' }, { key: 'deck' }]);
  assert.deepStrictEqual(out.map(t => t.key), ['wekan', 'trello', 'deck', 'jira', 'slack', 'mail']);
  assert.deepStrictEqual(out.map(t => t.groupStart), [true, true, false, true, true, false]);
  assert.deepStrictEqual(out.filter(t => t.groupStart).map(t => t.groupLabelKey), [null, 'tool-group-kanban', 'tool-group-issues', 'tool-group-messages']);
  assert.deepStrictEqual(groupTools([]), []);
});

test('both pages draw the headings', () => {
  assert.match(read('client/components/import/import.jade'), /each importSources\n\s*if groupHeading\n\s*li\.import-source-group \{\{groupHeading\}\}/);
  assert.match(read('client/components/import/import.js'), /groupTools\(IMPORT_SOURCES\.map/);
  assert.match(read('client/components/boards/exportScope.js'), /if \(group\.key !== 'json'\) return \[group\];[\s\S]*groupTools\(group\.entries\)/);
});
