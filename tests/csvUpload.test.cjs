'use strict';
// A CSV/TSV file chosen on the Import page is uploaded to the server's disk
// (server/lib/importUpload.js) like the other sources, and its header, rows and
// people are read there (server/methods/csvImportMapping.js), so the page never
// holds the whole file.
// Run: node --test tests/csvUpload.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

test('the people of the file: the chosen people columns, or a column named Members', async () => {
  const { csvPeopleNames } = await import('../models/lib/csvPeople.js');
  const rows = [['Title', 'Members', 'Owner'], ['a', 'ann bob', 'cid'], ['b', 'bob', ''], ['c', '', 'cid']];
  assert.deepStrictEqual(csvPeopleNames(rows), ['ann', 'bob'], 'Members, split on spaces');
  assert.deepStrictEqual(csvPeopleNames(rows, { owner: 2 }), ['cid']);
  // Negative: no people column, no rows - nobody.
  assert.deepStrictEqual(csvPeopleNames(rows, { title: 0 }), []);
  assert.deepStrictEqual(csvPeopleNames([], { owner: 0 }), []);
  assert.deepStrictEqual(csvPeopleNames(null), []);
});

test('the page uploads the file and asks the server for its preview and people', () => {
  const page = read('client/components/import/import.js');
  assert.match(page, /dataSource === 'jira' \|\| dataSource === 'csv'\)\)/);
  assert.match(page, /await startCsvMapping\(this, \{ uploadId: this\.upload\.uploadId, membersStep: !skipMapping \}\);/);
  const mapping = read('client/components/import/csvMapping.js');
  assert.match(mapping, /preview = await Meteor\.callAsync\('csvUploadPreview', uploadId\);/);
  assert.match(mapping, /Meteor\.callAsync\('csvUploadPeople', state\.uploadId, chosen\.columns\)/);
  assert.match(read('client/components/import/csvMembersMapper.js'), /csvPeopleNames\(data, columns\)/, 'one way to read the people');
});

test('the server reads an upload only for its sender, and never removes it in the preview', () => {
  const methods = read('server/methods/csvImportMapping.js');
  assert.match(methods, /takeUpload\(uploadId, userId, 'csv'\)/);
  assert.doesNotMatch(methods, /removeUpload/, 'the import that follows reads it');
  for (const name of ['csvUploadPreview', 'csvUploadPeople']) {
    const body = methods.slice(methods.indexOf(`async ${name}(`), methods.indexOf('\n  },', methods.indexOf(`async ${name}(`)));
    assert.match(body, /check\(uploadId, uploadIdPattern\);/, `${name} checks the id`);
    assert.match(body, /if \(!this\.userId\) throw new Meteor\.Error\('error-notAuthorized'\);/, `${name} needs a signed-in user`);
    assert.match(body, /await assertImportEnabled\(\);/, `${name} only while import is enabled`);
  }
  assert.match(read('server/lib/importUploadSource.js'), /if \(source === 'csv'\) \{[\s\S]{0,120}readCsvUploadRows\(file\)/);
  assert.match(read('server/lib/csvUpload.js'), /delimiter: csvSeparatorOf\(text\)/, 'tab-separated when the first line has a tab, as the page');
});
