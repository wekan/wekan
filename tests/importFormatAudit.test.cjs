'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  const { adfPlainText } = await import('../models/lib/externalParsers.js');
  const { importedAttachmentsByCard } = await import('../models/lib/importedAttachmentsByCard.js');
  const { importedTableRows } = await import('../models/lib/importedTableRows.js');
  assert.deepEqual(importedTableRows([['Title'], ['card'], [''], ['  ', null], [], [0], ['', 'description']]),
    [['Title'], ['card'], [0], ['', 'description']]);
  const fixtures = path.join(__dirname, 'fixtures/import-formats');
  for (const source of ['trello', 'jira', 'kanboard', 'deck', 'openproject', 'github', 'gitlab', 'gitea', 'forgejo', 'asana', 'zenkit']) {
    const data = JSON.parse(fs.readFileSync(path.join(fixtures, `${source === 'zenkit' ? 'zenkit-adapter' : source}.json`)));
    assert.doesNotThrow(() => validateImportSourceShape(source, data));
    for (const invalid of [null, {}, { unrelated: [] }, 'not JSON']) {
      assert.throws(() => validateImportSourceShape(source, invalid), /import document shape/);
    }
  }
  const jira = JSON.parse(fs.readFileSync(path.join(fixtures, 'jira.json')));
  const expected = JSON.parse(fs.readFileSync(path.join(fixtures, 'expectations.json')));
  assert.equal(adfPlainText(jira.issues[0].fields.description), expected.description);
  assert.equal(adfPlainText(null), '');
  assert.equal(adfPlainText({ content: 'invalid' }), '');
  assert.equal(adfPlainText('legacy string'), 'legacy string');
  const file = { _id: 'file', meta: { cardId: 'card' }, file: 'AA==' };
  assert.deepEqual(importedAttachmentsByCard({ attachments: [file] }).card, [file]);
  const legacy = { _id: 'legacy', file: 'AA==' };
  const activity = { activityType: 'addAttachment', attachmentId: 'legacy', cardId: 'old' };
  assert.deepEqual(importedAttachmentsByCard({ attachments: [legacy, legacy], activities: [activity, activity] }).old, [legacy]);
  assert.equal(Object.keys(importedAttachmentsByCard({ attachments: [{ _id: 'gone', meta: { cardId: 'card' } }, { file: 'AA==' }] })).length, 0);
  assert.equal(Object.keys(importedAttachmentsByCard({ activities: [activity] })).length, 0);
  console.log('Import shape, Jira ADF and activity-independent attachment regressions passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
