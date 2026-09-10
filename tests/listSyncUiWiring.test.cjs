'use strict';

// UI wiring for list sync (docs/Features/ImportExport/Sync.md,
// client/components/lists/listHeader.jade/.js): source checks, not a
// reimplementation of the reconcile logic already covered by
// tests/listSyncReconcile.test.cjs. Three things this pins:
//
//   1. the credential field (js-list-sync-token) is write-only - it never
//      loads a value from the list document or any Meteor.call result, the
//      same discipline as the LDAP Admin Panel override's bind password
//      (see tests/ldapAdminOverrideSecurity.test.cjs).
//   2. the sync-status display reads syncSource.lastSyncedAt/lastSyncError/
//      enabled off the list document, which is already published without a
//      credential (models/lists.js).
//   3. the popup's Meteor.call()s match the EXISTING method names/argument
//      shapes defined in server/methods/listSync.js, so the UI cannot have
//      silently drifted from the backend it is wired to.
//
// Run: node tests/listSyncUiWiring.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('listSyncUiWiring:');

const jade = read('client/components/lists/listHeader.jade');
const js = read('client/components/lists/listHeader.js');
const methods = read('server/methods/listSync.js');
const listsModel = read('models/lists.js');

test('listSyncPopup exists and opens from the list hamburger menu', () => {
  assert.ok(/template\(name="listSyncPopup"\)/.test(jade), 'listSyncPopup template must exist');
  assert.ok(/a\.js-list-sync\b/.test(jade), 'menu item js-list-sync must exist');
  assert.ok(/'click \.js-list-sync':\s*Popup\.open\('listSync'\)/.test(js),
    'js-list-sync must open the listSync popup');
});

test('the credential input never receives a value from the list or a method result '
  + '(write-only, like the LDAP bind password)', () => {
  // The markup itself: js-list-sync-token must always render with a
  // hard-coded empty value, never a Handlebars/Blaze binding.
  const inputLine = jade.match(/input\.list-sync-token\.js-list-sync-token\([^)]*\)/);
  assert.ok(inputLine, 'js-list-sync-token input must exist');
  assert.ok(/value=""/.test(inputLine[0]),
    'js-list-sync-token must start empty, never pre-filled from list.syncSource or a credential');
  assert.ok(!/currentSync(Token|Credential)/.test(inputLine[0]),
    'js-list-sync-token must not bind to any per-list token/credential helper');

  // The source: no helper name suggesting the real secret is read back, and
  // the only thing shown about the credential is a status STRING (boolean-
  // derived), never the token itself.
  assert.ok(!/hasCredential\.get\(\)\.token/.test(js), 'must never read a raw token value');
  assert.ok(/hasListSyncCredential/.test(js),
    'status must come from the existing hasListSyncCredential method (boolean-only)');
  assert.ok(/listSyncCredentialStatusText/.test(js) && /listSyncCredentialStatusText/.test(jade),
    'a boolean-derived status string, not the token, must be what the popup shows');
});

test('negative: no other list-sync helper accidentally exposes a token value', () => {
  // Same "search the whole shape, not just the reported spot" discipline as
  // the LDAP security tests: nowhere in the two files may `.token` be
  // written into a template value= attribute or a helper's return value in
  // a way that could show the real secret.
  assert.ok(!/value="\{\{\s*\S*[Tt]oken\S*\s*\}\}"/.test(jade),
    'no input may bind value="{{...token...}}" anywhere in listHeader.jade');
  assert.ok(!/return\s+\S*\.token\b/.test(js),
    'no helper in listHeader.js may return a raw .token field');
});

test('sync-status display reads syncSource.lastSyncedAt/lastSyncError/enabled '
  + 'off the list document (already published, credential-free)', () => {
  assert.ok(/list\.syncSource\.lastSyncedAt/.test(js), 'must read lastSyncedAt from the list');
  assert.ok(/list\.syncSource\.lastSyncError/.test(js), 'must read lastSyncError from the list');
  assert.ok(/list\.syncSource\.enabled/.test(js) || /syncSource\.enabled/.test(jade),
    'must read enabled from the list');
  assert.ok(/listSyncLastSyncedText/.test(jade) && /listSyncLastError/.test(jade),
    'the popup must render the last-synced and last-error state');
  // models/lists.js: these three fields must actually exist in the schema
  // this UI reads - if they were ever renamed there, this test must fail
  // rather than silently reading undefined.
  assert.ok(/'syncSource\.lastSyncedAt'/.test(listsModel), 'schema must still define syncSource.lastSyncedAt');
  assert.ok(/'syncSource\.lastSyncError'/.test(listsModel), 'schema must still define syncSource.lastSyncError');
  assert.ok(/'syncSource\.enabled'/.test(listsModel), 'schema must still define syncSource.enabled');
});

test('Meteor.call sites match the EXISTING listSync method names and arities '
  + '(server/methods/listSync.js)', () => {
  // The three methods actually defined server-side.
  assert.ok(/async setListSyncSource\(listId, config\)/.test(methods), 'setListSyncSource(listId, config) must still be the signature');
  assert.ok(/async hasListSyncCredential\(listId\)/.test(methods), 'hasListSyncCredential(listId) must still be the signature');
  assert.ok(/async syncListNow\(listId\)/.test(methods), 'syncListNow(listId) must still be the signature');

  // The UI calls each by name, with a call that carries the same number of
  // positional arguments before the Meteor.call callback (listId[, config]).
  assert.ok(/Meteor\.call\('setListSyncSource',\s*list\._id,\s*config,/.test(js),
    "UI must call Meteor.call('setListSyncSource', listId, config, cb)");
  assert.ok(/Meteor\.call\('hasListSyncCredential',\s*list\._id,/.test(js),
    "UI must call Meteor.call('hasListSyncCredential', listId, cb)");
  assert.ok(/Meteor\.call\('syncListNow',\s*list\._id,/.test(js),
    "UI must call Meteor.call('syncListNow', listId, cb)");
  // Clearing the source calls setListSyncSource with `null`, per the
  // documented contract ("pass config: null to clear").
  assert.ok(/Meteor\.call\('setListSyncSource',\s*list\._id,\s*null,/.test(js),
    "clearing must call setListSyncSource(listId, null, cb) per the existing contract");
});

test('the source-type picker only offers SYNC_CAPABLE_SOURCES '
  + '(models/lib/externalParsers.js), not an invented list', () => {
  assert.ok(/import\s*\{\s*SYNC_CAPABLE_SOURCES\s*\}\s*from\s*'\/models\/lib\/externalParsers'/.test(js),
    'must import the existing SYNC_CAPABLE_SOURCES rather than hard-coding a duplicate list');
  assert.ok(/listSyncSourceTypes\(\)\s*\{\s*return SYNC_CAPABLE_SOURCES;/.test(js.replace(/\s+/g, ' ')),
    'the picker helper must return SYNC_CAPABLE_SOURCES directly');
});

test('setListSyncSource is called only after the existing write-access-gated '
  + 'method, not a new bypass (config write access is enforced server-side)', () => {
  assert.ok(/assertWriteAccess\(this\.userId, list\.boardId\)/.test(methods),
    'server method must still assert write access - the UI adds no extra client-side authority check to replace it');
});

test('en.i18n.json has all new list-sync-* keys, and no locale file is '
  + 'missing any of them (each has SOME value, even if a placeholder)', () => {
  const dataDir = path.join(ROOT, 'imports/i18n/data');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const newKeys = Object.keys(en).filter(k => k.startsWith('list-sync-'));
  assert.ok(newKeys.length >= 20, 'expected at least 20 new list-sync-* keys in en.i18n.json');

  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.i18n.json') && f !== 'en.i18n.json');
  const missing = [];
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8'));
    for (const k of newKeys) {
      if (typeof data[k] !== 'string' || data[k].length === 0) missing.push(`${f}:${k}`);
    }
  }
  assert.strictEqual(missing.length, 0,
    `every locale file must have a non-empty value for every new key; missing: ${missing.slice(0, 10).join(', ')}`);
});

test('placeholder tokens (%s) in list-sync-now-error are preserved across '
  + 'every locale that customized it (no translation may drop/rename %s)', () => {
  const dataDir = path.join(ROOT, 'imports/i18n/data');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.i18n.json') && f !== 'en.i18n.json');
  const broken = [];
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8'));
    const v = data['list-sync-now-error'];
    if (typeof v === 'string' && !v.includes('%s')) broken.push(f);
  }
  assert.strictEqual(broken.length, 0,
    `list-sync-now-error must keep the %s placeholder in every locale; broken: ${broken.slice(0, 10).join(', ')}`);
  assert.ok(en['list-sync-now-error'].includes('%s'), 'English source must contain %s');
});

console.log(`listSyncUiWiring: ${passed} passed`);
