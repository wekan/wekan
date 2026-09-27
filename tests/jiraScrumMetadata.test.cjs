'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { jiraScrumMetadata, jiraScrumListCategories, jiraScrumMetadataExport } = require('../models/lib/jiraScrumMetadata');

test('Jira issue types and stable category keys map to existing Scrum metadata', () => {
  for (const [key, category] of [['new','todo'], ['indeterminate','doing'], ['done','done']]) {
    const fields = { issuetype: { name: 'Story' }, status: { name: 'Localized name', statusCategory: { key } } };
    const value = jiraScrumMetadata(fields);
    assert.deepEqual(value, { card: { issueType: 'Story' }, list: { category } });
    const exported = jiraScrumMetadataExport({ scrum: value.card }, { scrum: value.list });
    assert.deepEqual(exported, { issuetype: fields.issuetype, statusCategory: { key } });
  }
});
test('missing or unknown categories never infer completion from titles', () => {
  assert.deepEqual(jiraScrumMetadata(), { card: {}, list: {} });
  for (const key of [undefined, 'unknown', 'constructor', 'Done']) {
    assert.deepEqual(jiraScrumMetadata({ status: { name: 'Done', statusCategory: { key } } }).list, {});
  }
  assert.deepEqual(jiraScrumMetadataExport({}, { scrum: { category: 'backlog' } }), {});
});
test('issue type validation and whole-file category validation happen before import writes', () => {
  for (const name of [42, {}, [], 'a'.repeat(101), 'bad\0type']) {
    assert.throws(() => jiraScrumListCategories([{ fields: { issuetype: { name } } }]));
  }
  const issue = key => ({ fields: { status: { name: 'Shared name', statusCategory: { key } } } });
  assert.throws(() => jiraScrumListCategories([issue('new'), issue('done')]), /conflicting/);
  assert.equal(jiraScrumListCategories([issue(undefined), issue('done'), issue('done')]).get('Shared name'), 'done');
});
test('Scrum export selection excludes both mappings', () => {
  assert.deepEqual(jiraScrumMetadataExport({ scrum: { issueType: 'Story' } }, { scrum: { category: 'done' } }, new Set(['dates'])), {});
});
test('imported categories affect completion only under the existing done-list policy', () => {
  const { isScrumCardDone } = require('../models/lib/scrum');
  const list = { _id: 'list', scrum: jiraScrumMetadata({ status: { statusCategory: { key: 'done' } } }).list };
  const card = { listId: 'list', dueComplete: false };
  assert.equal(isScrumCardDone(card, { completionPolicy: 'doneLists' }, [list]), true);
  assert.equal(isScrumCardDone(card, { completionPolicy: 'dueComplete' }, [list]), false);
});
test('Scrum import selection prunes Jira fields before validation without removing status names', async () => {
  const fs = require('node:fs');
  const source = fs.readFileSync('models/lib/importParts.js', 'utf8');
  const { pruneImportDocument } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  const input = () => ({ issues: [{ fields: { issuetype: { name: 'Story' }, status: { name: 'Done', statusCategory: { key: 'done' } } } }] });
  const included = input();
  pruneImportDocument(included, ['scrum']);
  assert.equal(jiraScrumMetadata(included.issues[0].fields).card.issueType, 'Story');
  const excluded = input();
  pruneImportDocument(excluded, ['dates']);
  assert.deepEqual(excluded.issues[0].fields, { status: { name: 'Done' } });
});
