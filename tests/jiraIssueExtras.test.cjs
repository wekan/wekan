'use strict';

// Jira import: comments, sub-tasks, parents, custom fields, extra labels and
// pagination (models/lib/jiraIssueExtras.js, used by models/jiraCreator.js).
// Run: node tests/jiraIssueExtras.test.cjs
//
// JiraCreator mapped summary, ADF description, status, labels, assignee,
// reporter, dates, time tracking, estimates, issue type and links. Comments,
// sub-tasks, the parent hierarchy, priority, components, fix versions and
// ordinary custom fields were dropped, cards were all sorted -1, and a
// single page of a paginated search imported as if it were the whole result.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const { jiraIssueExtras, jiraPageWarnings } = await import('../models/lib/jiraIssueExtras.js');
  const { importedComment, importedChecklists, planImportedCustomFields, importedCustomFieldValues } =
    await import('../models/lib/importedTaskPlan.js');
  const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/import-formats/jira.json')));
  const expected = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/import-formats/expectations.json')));

  const [issue] = fixture.issues;
  const extra = jiraIssueExtras(issue, { names: fixture.names, importedKeys: new Set(['AUDIT-1']) });
  assert.deepEqual(extra.tags, ['priority:High', 'Audit component', 'version:1.0']);
  assert.deepEqual(extra.custom_fields, { 'Audit points': 5, 'Audit team': 'Blue' });
  assert.deepEqual(extra.checklists, [{ title: 'Sub-tasks', items: [{ title: '[AUDIT-9] Audit subtask', done: true }] }]);
  assert.equal(extra.parentKey, undefined);
  assert.deepEqual(extra.unsupported.map(u => u.path), ['/issues/AUDIT-1/attachment']);
  const comment = importedComment(extra.comments[0], {});
  assert.equal(comment.text, `jira-user: ${expected.comment}`, 'shown by display name, mapped by account id');
  assert.equal(comment.createdAt.toISOString(), '2026-09-30T12:34:56.000Z');
  assert.equal(importedComment(extra.comments[0], { 'jira-acc': 'uJ' }).userId, 'uJ');
  const fields = planImportedCustomFields([extra]).fields;
  assert.deepEqual(fields, [{ name: 'Audit points', type: 'number' }, { name: 'Audit team', type: 'text' }]);
  assert.deepEqual(importedCustomFieldValues(extra, fields).map(v => v.value), [5, 'Blue']);
  assert.equal(importedChecklists(extra.checklists)[0].items[0].isFinished, true);

  // Custom field value shapes; the mapped estimate field is not imported twice.
  const shapes = jiraIssueExtras({ key: 'X-1', fields: {
    customfield_1: [{ value: 'a' }, { value: 'b' }],
    customfield_2: { displayName: 'Ann', accountId: 'acc' },
    customfield_3: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'rich' }] }] },
    customfield_4: { value: 'Parent', child: { value: 'Child' } },
    customfield_5: [{ name: 'Sprint 7', id: 7 }],
    customfield_6: 3,
    customfield_7: { self: 'https://x' },
    customfield_8: [],
  } }, { skipFields: ['customfield_6'] });
  assert.deepEqual(shapes.custom_fields, {
    customfield_1: ['a', 'b'], customfield_2: 'Ann', customfield_3: 'rich', customfield_4: 'Parent', customfield_5: ['Sprint 7'],
  });

  // Sub-tasks imported alongside link to their parent instead of a checklist.
  const both = new Set(['P-1', 'P-2']);
  assert.deepEqual(jiraIssueExtras({ key: 'P-1', fields: { subtasks: [{ key: 'P-2', fields: { summary: 's' } }] } }, { importedKeys: both }).checklists, []);
  assert.equal(jiraIssueExtras({ key: 'P-2', fields: { parent: { key: 'P-1' } } }, { importedKeys: both }).parentKey, 'P-1');
  const orphan = jiraIssueExtras({ key: 'P-3', fields: { parent: { key: 'EPIC-9' } } }, { importedKeys: both });
  assert.equal(orphan.parentKey, undefined);
  assert.deepEqual(orphan.unsupported, [{ path: '/issues/P-3/parent', reason: 'parent EPIC-9 is not part of this import' }]);

  // Pagination: enhanced search and classic search.
  assert.deepEqual(jiraPageWarnings(fixture), []);
  assert.equal(jiraPageWarnings({ issues: [{}], isLast: false }).length, 1);
  assert.equal(jiraPageWarnings({ issues: [{}], nextPageToken: 'abc' }).length, 1);
  assert.equal(jiraPageWarnings({ issues: [{}], nextPageToken: 'abc', isLast: true }).length, 0);
  assert.match(jiraPageWarnings({ issues: [{}, {}], startAt: 0, total: 5 })[0].reason, /^3 issue/);
  assert.deepEqual(jiraPageWarnings({ issues: [{}, {}], startAt: 3, total: 5 }), []);
  assert.deepEqual(jiraPageWarnings([{}]), []);

  // Negative: an issue with nothing extra yields nothing.
  assert.deepEqual(jiraIssueExtras({ key: 'E-1', fields: {} }),
    { tags: [], comments: [], parentKey: undefined, checklists: [], custom_fields: {}, unsupported: [] });
  assert.deepEqual(jiraIssueExtras(null).tags, []);

  // The creator uses all of it, in search order.
  const creator = fs.readFileSync(path.join(__dirname, '../models/jiraCreator.js'), 'utf8');
  assert.match(creator, /sort: index,/);
  assert.doesNotMatch(creator, /sort: -1/);
  assert.match(creator, /\.\.\.extra\.tags/);
  assert.match(creator, /importedCustomFieldValues\(extra, fieldPlan\)/);
  assert.match(creator, /insertImportedChecklists\(importedChecklists\(extra\.checklists\)/);
  assert.match(creator, /insertImportedComments\(comments,/);
  assert.match(creator, /\$set: \{ parentId \}/);

  console.log('  ok - Jira comments, sub-tasks, parents, custom fields, labels and pagination import');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
