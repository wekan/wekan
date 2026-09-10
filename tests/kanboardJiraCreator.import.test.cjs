/**
 * Test: Kanboard import date/column/swimlane derivation, and Jira import
 * issue-link dependency mapping.
 *
 * Covers models/kanboardCreator.js (KanboardCreator#_now, #_columnNames,
 * #_swimlaneNames) and models/jiraCreator.js (JiraCreator#createDependencies'
 * link-type mapping, #_issues normalization).
 *
 * Both modules import Meteor/model modules and can't run under plain Node, so
 * — following the convention of tests/trelloCreator.import.test.js and the
 * sibling wekanCreator.*.test.js files — this test re-implements the exact
 * pure logic being verified as a faithful copy of the production code.
 * Failures throw (assert), so a regression exits non-zero.
 */

const assert = require('assert');

// --- Faithful copy of KanboardCreator#_now ---------------------------------
function kanboardNow(dateString, nowDate) {
  if (dateString) {
    if (/^\d+$/.test(String(dateString))) {
      return new Date(parseInt(dateString, 10) * 1000);
    }
    return new Date(dateString);
  }
  return nowDate || new Date();
}

// --- Faithful copy of KanboardCreator#_tasks/_columnNames/_swimlaneNames ---
function tasksOf(data) {
  if (Array.isArray(data)) return data;
  return data.tasks || [];
}
function columnNames(data) {
  if (data.columns && data.columns.length) {
    return data.columns.map(c => c.title || c.name).filter(Boolean);
  }
  const names = [];
  for (const task of tasksOf(data)) {
    const name = task.column_name || task.column || 'Imported';
    if (!names.includes(name)) names.push(name);
  }
  return names.length ? names : ['Imported'];
}
function swimlaneNames(data) {
  if (data.swimlanes && data.swimlanes.length) {
    return data.swimlanes.map(s => s.name || s.title).filter(Boolean);
  }
  const names = [];
  for (const task of tasksOf(data)) {
    const name = task.swimlane_name || task.swimlane || 'Default';
    if (!names.includes(name)) names.push(name);
  }
  return names.length ? names : ['Default'];
}

// --- Faithful copy of JiraCreator's issue-link dependency mapping ---------
const DEFAULT_DEPENDENCY_TYPE = 'related-to';
function jiraDependenciesForIssue(issue, cardsByKey, fromId) {
  const links = (issue.fields || {}).issuelinks || [];
  const deps = [];
  for (const link of links) {
    const typeName = ((link.type && link.type.name) || '').toLowerCase();
    let targetKey = null;
    let depType = DEFAULT_DEPENDENCY_TYPE;
    if (link.outwardIssue) {
      targetKey = link.outwardIssue.key;
      if (typeName.includes('block')) depType = 'blocks';
    } else if (link.inwardIssue) {
      targetKey = link.inwardIssue.key;
      if (typeName.includes('block')) depType = 'is-blocked-by';
    }
    if (!targetKey) continue;
    const toId = cardsByKey[targetKey];
    if (!toId || toId === fromId) continue;
    if (deps.find(d => d.cardId === toId)) continue;
    deps.push({ cardId: toId, type: depType });
  }
  return deps;
}

// === Kanboard tests =========================================================

// 1. Unix-timestamp (seconds) date strings are converted correctly.
{
  const d = kanboardNow('1700000000');
  assert.strictEqual(d.getTime(), 1700000000 * 1000);
}

// 2. An ISO date string is parsed as a normal date, not mistaken for a timestamp.
{
  const d = kanboardNow('2024-01-15T00:00:00.000Z');
  assert.strictEqual(d.toISOString(), '2024-01-15T00:00:00.000Z');
}

// 3. No dateString falls back to "now".
{
  const now = new Date('2024-06-01T00:00:00.000Z');
  const d = kanboardNow(undefined, now);
  assert.strictEqual(d, now);
}

// 4. Explicit columns win over task-derived ones.
{
  const cols = columnNames({ columns: [{ title: 'Backlog' }, { name: 'Doing' }] });
  assert.deepStrictEqual(cols, ['Backlog', 'Doing']);
}

// 5. Columns derived from tasks, in first-seen order, deduplicated.
{
  const cols = columnNames({
    tasks: [
      { column_name: 'Backlog' },
      { column: 'Doing' },
      { column_name: 'Backlog' },
      {},
    ],
  });
  assert.deepStrictEqual(cols, ['Backlog', 'Doing', 'Imported']);
}

// 6. No tasks/columns at all still yields a usable default.
{
  assert.deepStrictEqual(columnNames({}), ['Imported']);
  assert.deepStrictEqual(swimlaneNames({}), ['Default']);
}

// 7. Swimlanes derived from tasks similarly.
{
  const sl = swimlaneNames({
    tasks: [{ swimlane_name: 'Team A' }, { swimlane: 'Team B' }, {}],
  });
  assert.deepStrictEqual(sl, ['Team A', 'Team B', 'Default']);
}

// === Jira tests =============================================================

// 8. "blocks" link type, outward issue => depType "blocks".
{
  const issue = {
    key: 'PROJ-1',
    fields: {
      issuelinks: [
        { type: { name: 'Blocks' }, outwardIssue: { key: 'PROJ-2' } },
      ],
    },
  };
  const deps = jiraDependenciesForIssue(issue, { 'PROJ-2': 'card2' }, 'card1');
  assert.deepStrictEqual(deps, [{ cardId: 'card2', type: 'blocks' }]);
}

// 9. "blocks" link type, inward issue => depType "is-blocked-by".
{
  const issue = {
    key: 'PROJ-1',
    fields: {
      issuelinks: [
        { type: { name: 'Blocks' }, inwardIssue: { key: 'PROJ-3' } },
      ],
    },
  };
  const deps = jiraDependenciesForIssue(issue, { 'PROJ-3': 'card3' }, 'card1');
  assert.deepStrictEqual(deps, [{ cardId: 'card3', type: 'is-blocked-by' }]);
}

// 10. Unrecognized link type falls back to "related-to".
{
  const issue = {
    key: 'PROJ-1',
    fields: {
      issuelinks: [
        { type: { name: 'Relates' }, outwardIssue: { key: 'PROJ-4' } },
      ],
    },
  };
  const deps = jiraDependenciesForIssue(issue, { 'PROJ-4': 'card4' }, 'card1');
  assert.deepStrictEqual(deps, [{ cardId: 'card4', type: 'related-to' }]);
}

// 11. A link to an issue that wasn't imported (no card) is skipped, not fatal.
{
  const issue = {
    key: 'PROJ-1',
    fields: {
      issuelinks: [
        { type: { name: 'Blocks' }, outwardIssue: { key: 'PROJ-UNKNOWN' } },
      ],
    },
  };
  const deps = jiraDependenciesForIssue(issue, {}, 'card1');
  assert.deepStrictEqual(deps, []);
}

// 12. A self-referencing link is skipped.
{
  const issue = {
    key: 'PROJ-1',
    fields: {
      issuelinks: [
        { type: { name: 'Blocks' }, outwardIssue: { key: 'PROJ-1' } },
      ],
    },
  };
  const deps = jiraDependenciesForIssue(issue, { 'PROJ-1': 'card1' }, 'card1');
  assert.deepStrictEqual(deps, []);
}

// 13. Duplicate links to the same target only produce one dependency.
{
  const issue = {
    key: 'PROJ-1',
    fields: {
      issuelinks: [
        { type: { name: 'Blocks' }, outwardIssue: { key: 'PROJ-2' } },
        { type: { name: 'Relates' }, outwardIssue: { key: 'PROJ-2' } },
      ],
    },
  };
  const deps = jiraDependenciesForIssue(issue, { 'PROJ-2': 'card2' }, 'card1');
  assert.strictEqual(deps.length, 1);
}

console.log('ok - kanboard/jira creator import tests passed');
