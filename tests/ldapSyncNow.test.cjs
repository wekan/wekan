'use strict';
// Admin Panel / People / LDAP / Sync now (maintainer decision of 2026-10-08).
// ldap_sync_now existed in packages/wekan-ldap/server/syncUser.js but nothing
// imported that file, so the method was never defined, and it imported every
// directory user regardless of the sync settings. Now it is loaded, admin-only,
// runs the background sync once with the settings in effect, and shares one
// lock with the scheduled job.
//
// Run: node tests/ldapSyncNow.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('ldapSyncNow:');

const method = read('packages/wekan-ldap/server/syncUser.js');
const sync = read('packages/wekan-ldap/server/sync.js');

test('the method is loaded by the package', () => {
  assert.match(read('packages/wekan-ldap/server/index.js'), /^import '\.\/syncUser';$/m);
});

test('only an active site administrator may run it', () => {
  assert.match(method, /if \(user\.isAdmin !== true \|\| user\.loginDisabled === true\) \{\s*throw new Meteor\.Error\('error-notAuthorized'/);
  assert.ok(method.indexOf("'error-notAuthorized'") < method.indexOf('runLdapSync()'),
    'refused before any LDAP work');
});

test('it runs the background sync with the settings in effect, not a blanket import', () => {
  assert.match(method, /LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS/);
  assert.match(method, /LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED/);
  assert.match(method, /if \(!importNew && !updateExisting\) \{\s*throw new Meteor\.Error\('LDAP_sync_nothing_to_do'\)/);
  assert.match(method, /await runLdapSync\(\)/);
  assert.doesNotMatch(method, /importNewUsers/, 'the old unconditional import is gone');
  // sync() returns its error instead of throwing it; the button must see it.
  assert.match(method, /if \(result instanceof Error\) \{\s*throw new Meteor\.Error\('LDAP_sync_failed'/);
});

test('the button and the scheduled job share one run at a time', () => {
  assert.match(sync, /export function runLdapSync\(\) \{\s*if \(!runningSync\) \{\s*runningSync = sync\(\)\.finally\(\(\) => \{ runningSync = null; \}\);/);
  assert.match(sync, /job: async function\(\) \{\s*await runLdapSync\(\);/);
  assert.doesNotMatch(sync, /await sync\(\);/, 'nothing calls sync() around the lock');
});

test('the LDAP pane has the button and reports each outcome', () => {
  const jade = read('client/components/settings/authProviderSettings.jade');
  assert.match(jade, /button\.js-ldap-sync-now\.primary\(disabled=syncing\.get\) \{\{_ 'ldap-sync-now'\}\}/);
  const js = read('client/components/settings/authProviderSettings.js');
  assert.match(js, /Meteor\.call\('ldap_sync_now'/);
  for (const key of ['ldap-sync-now-done', 'ldap-sync-now-nothing', 'ldap-sync-now-error']) {
    assert.ok(js.includes(`'${key}'`), key);
  }
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const key of ['ldap-sync-now', 'ldap-sync-now-done', 'ldap-sync-now-nothing', 'ldap-sync-now-error']) {
    assert.equal(typeof en[key], 'string', key);
  }
  assert.ok(en['ldap-sync-now-error'].includes('%s'));
});

// Negative, whole package: the fault was a methods file nothing imported. Every
// file under packages/wekan-ldap/server that defines Meteor methods must be
// reachable from index.js.
test('negative: no wekan-ldap methods file is left unloaded', () => {
  const dir = path.join(ROOT, 'packages/wekan-ldap/server');
  const imported = new Set();
  const visit = file => {
    if (imported.has(file)) return;
    imported.add(file);
    const src = fs.readFileSync(path.join(dir, file), 'utf8');
    for (const [, spec] of src.matchAll(/(?:from |import |require\()\s*['"]\.\/([\w.-]+)['"]/g)) {
      const name = spec.endsWith('.js') ? spec : `${spec}.js`;
      if (fs.existsSync(path.join(dir, name))) visit(name);
    }
  };
  visit('index.js');
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
    if (/Meteor\.methods\(/.test(fs.readFileSync(path.join(dir, file), 'utf8'))) {
      assert.ok(imported.has(file), `${file} defines Meteor methods but index.js never loads it`);
    }
  }
});

console.log(`\nldapSyncNow: ${passed} tests passed`);
