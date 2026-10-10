'use strict';

// Who the people of an imported file become, the same for every source
// (models/lib/importMembersMode.js): existing users chosen on the import page,
// placeholder users keeping their names, or the person importing.
// Run: node tests/importMembersMode.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

async function main() {
  const mode = await import('../models/lib/importMembersMode.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

  test('the mode is map, placeholder or me; anything else is placeholder', () => {
    assert.equal(mode.membersMode({ membersMode: 'me' }), 'me');
    assert.equal(mode.membersMode({ membersMode: 'map' }), 'map');
    assert.equal(mode.membersMode({}), 'placeholder');
    assert.equal(mode.membersMode({ membersMode: 'everyone-admin' }), 'placeholder');
    assert.equal(mode.membersMode(null), 'placeholder');
  });

  test('a chosen mapping keeps only string ids, never prototype keys', () => {
    const mapping = mode.membersMappingFor({ membersMapping: JSON.parse('{"ann":"u1","bob":5,"__proto__":"x","constructor":"y","cy":""}') }, () => 'me');
    assert.deepEqual(Object.keys(mapping), ['ann']);
    assert.equal(mapping.ann, 'u1');
    assert.equal(mapping.bob, undefined, 'placeholder mode: an unmapped person is not the importer');
    assert.equal(({}).polluted, undefined);
  });

  test('me: every person resolves to the person importing, read when looked up', () => {
    let current = 'first';
    const mapping = mode.membersMappingFor({ membersMode: 'me', membersMapping: { ann: 'u1' } }, () => current);
    assert.equal(mapping.ann, 'u1', 'an explicit choice still wins');
    assert.equal(mapping.anyone, 'first');
    current = 'second';
    assert.equal(mapping['some one'], 'second', 'the importer is whoever runs the import');
    assert.ok('nobody' in mapping);
    assert.equal(typeof mapping.hasOwnProperty, 'function', 'object methods are not people');
    mapping.cy = 'u3';
    assert.equal(mapping.cy, 'u3');
    assert.equal(mode.membersMappingFor({ membersMode: 'me' }, () => null).x, undefined, 'negative: no importer, no mapping');
  });

  test('the people of a generalized-import document: owners, assignees, watchers, comment authors', () => {
    const people = mode.importedPeople([
      { title: 'A', owner_username: 'ann', assignees: ['bob', 'ann'], watchers: ['cy'], comments: [{ author: 'dee', authorName: 'Dee Dee', text: 'x' }] },
      { title: 'B', owner_id: 42, owner_name: 'Eve' },
      null, 'junk',
    ]);
    assert.deepEqual(people, [
      { key: 'ann', name: 'ann' }, { key: 'bob', name: 'bob' }, { key: 'cy', name: 'cy' },
      { key: 'dee', name: 'Dee Dee' }, { key: '42', name: 'Eve' },
    ]);
    assert.deepEqual(mode.importedPeople(undefined), []);
    // A person first seen without a name (an owner given only as an address)
    // takes the name a later mention gives, as Taiga's comment author does.
    assert.deepEqual(mode.importedPeople([
      { owner_username: 'ann@example.com', comments: [{ author: 'ann@example.com', authorName: 'Ann' }] },
    ]), [{ key: 'ann@example.com', name: 'Ann' }]);
    // Negative: a name once known is not replaced by a later different one.
    assert.deepEqual(mode.importedPeople([
      { owner_id: 'u1', owner_name: 'Ann Lee', comments: [{ author: 'u1', authorName: 'Someone Else' }] },
    ]), [{ key: 'u1', name: 'Ann Lee' }]);
  });

  test('every creator reads the same mapping, and the generalized one makes placeholders', () => {
    for (const file of ['models/wekanCreator.js', 'models/trelloCreator.js', 'models/csvCreator.js', 'models/jiraCreator.js', 'models/kanboardCreator.js']) {
      const src = read(file);
      assert.match(src, /this\.members = membersMappingFor\(data, \(\) => Meteor\.userId\(\)\);/, file);
      assert.doesNotMatch(src, /this\.members = data(?: && data)?\.membersMapping/, `${file}: negative - no creator reads the raw mapping`);
    }
    const kanboard = read('models/kanboardCreator.js');
    assert.match(kanboard, /if \(Meteor\.isServer && this\.membersMode !== 'me'\) \{[\s\S]*?createImportPlaceholders\(importedPeople\(this\._tasks\(board\)\), this\.members/);
    assert.match(kanboard, /for \(const userId of this\.placeholderIds \|\| \[\]\) \{\s*boardToCreate\.members\.push\(\{ userId, wekanId: userId, isActive: false, isAdmin: false,/);
    assert.match(read('models/wekanCreator.js'), /if \(boardToImport\.members && this\.membersMode !== 'me'\) \{/);
    const placeholders = read('server/lib/importPlaceholderUsers.js');
    assert.match(placeholders, /loginDisabled: true,\s*isActive: false,\s*importUsernames: \[person\.key\],/);
    assert.match(placeholders, /if \(!person \|\| !person\.key \|\| mapping\[person\.key\]\) continue;/);
  });

  test('the mode reaches every import path, and the page asks once for every source', () => {
    assert.match(read('models/import.js'), /if \(data\.previewPeople === true && creator instanceof KanboardCreator\) \{[\s\S]*?return importedPeople\(/);
    assert.ok(read('models/import.js').indexOf('data.previewPeople === true') < read('models/import.js').indexOf('trackImport({ userId: this.userId, source: importSource, creator,'),
      'a preview returns before anything is created');
    assert.match(read('server/models/boards.js'), /if \(\['map', 'placeholder', 'me'\]\.includes\(body\.membersMode\)\) additionalData\.membersMode = body\.membersMode;/);
    assert.match(read('models/importZip.js'), /new WekanCreator\(\{ membersMode: req\.query && req\.query\.membersMode, importFields: fields \}\)/);
    assert.match(read('server/routes/importTrelloZip.js'), /new TrelloCreator\(\{ membersMapping, membersMode \}\)/);
    const page = read('client/components/import/import.js');
    assert.match(page, /this\.membersMode = chosenMembersMode\(skipMapping\);/);
    assert.match(page, /\{ previewPeople: true, importFields: selectedFields\(\) \}, source, null\);/);
    assert.match(page, /membersMode: this\.membersMode \|\| 'map',/);
    assert.match(read('client/components/import/import.jade'), /each membersModes\s*\n\s*a\.flex\.js-import-members-mode\(data-mode="\{\{mode\}\}" href="#"\)/);
    const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
    for (const key of ['import-members-mode-heading', 'import-members-mode-map', 'import-members-mode-placeholder', 'import-members-mode-me']) assert.ok(en[key], key);
  });

  console.log(`\nimportMembersMode: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
