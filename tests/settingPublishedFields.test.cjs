'use strict';

// Every settings field a template RENDERS must be PUBLISHED.
//
// This is the bug behind "I cannot tick that checkbox". Admin Panel / Settings /
// Visibility draws "Support page enabled" from `currentSetting.supportPageEnabled`.
// That field was not in the `setting` publication, so on the client it was always
// undefined: the box drew unchecked, ticking it wrote the setting to the server, and
// the next re-render drew it unchecked again. The setting was saved and the checkbox
// said it was not.
//
// Announcement's checkbox never had the problem - it reads the Announcements
// collection, which is published whole - which is exactly why that one "works" and
// the Settings-backed ones did not.
//
// The same trap catches a plain field just as easily (it renders empty and saving
// looks like it did nothing), so this walks EVERY `currentSetting.<field>` in every
// client template and fails if the publication does not carry it.
//
// Run: node tests/settingPublishedFields.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(rel, out);
    else if (rel.endsWith('.jade')) out.push(rel);
  }
  return out;
}

const pub = read('server/publications/settings.js');
const fieldsBlock = pub.slice(pub.indexOf('const SETTING_FIELDS = {'),
  pub.indexOf('};', pub.indexOf('const SETTING_FIELDS = {')));
const published = new Set([...fieldsBlock.matchAll(/^\s*([A-Za-z][\w]*): 1,/gm)].map(m => m[1]));

// The one deliberate exception: the SMTP settings are admin-only and carry a
// password, so they have their own admin-gated publication ('mailServer') instead of
// going to every client with the rest.
const ADMIN_ONLY = new Set(['mailServer']);

console.log('settingPublishedFields:');

test('the publication is not empty and holds the obvious ones', () => {
  assert.ok(published.size > 30, 'the field list must be found and parsed');
  for (const field of ['productName', 'hideLogo', 'customHelpLinkUrl']) {
    assert.ok(published.has(field), `${field} must be published`);
  }
});

test('every currentSetting.<field> a template renders is published', () => {
  const missing = [];
  for (const file of walk('client/components')) {
    const src = read(file);
    for (const m of src.matchAll(/currentSetting\.([A-Za-z][\w]*)/g)) {
      const field = m[1];
      if (published.has(field) || ADMIN_ONLY.has(field)) continue;
      missing.push(`${field} (${file})`);
    }
  }
  assert.deepStrictEqual([...new Set(missing)], [],
    'a field a template reads but the publication does not send is always undefined: '
    + 'the control renders empty/unchecked, and saving it looks like it did nothing');
});

test('the checkboxes that were broken by this are covered by name', () => {
  // Named so the reason survives: each of these is a checkbox whose state comes
  // from the settings document and which could not be ticked before.
  for (const field of ['supportPageEnabled', 'supportPagePublic',
    'hideBoardActivitiesOnAllBoards', 'boardMembersFromSameOrgOnly',
    'boardMembersFromSameTeamOnly', 'enablePermanentDelete']) {
    assert.ok(published.has(field), `${field} must be published`);
  }
});

test('the permanent-delete checkbox receives the value it writes (negative)', () => {
  const js = read('client/components/settings/adminProblems.js');
  assert.ok(/enablePermanentDelete\(\)[\s\S]{0,100}\.enablePermanentDelete/.test(js),
    'the checkbox helper reads enablePermanentDelete');
  assert.ok(/toggleSettingField\('enablePermanentDelete'\)/.test(js),
    'and its handler writes that same field');
  assert.ok(published.has('enablePermanentDelete'),
    'the publication must return the stored value or the checkmark reverts');
});

test('the SMTP settings stay admin-only, in their own publication', () => {
  assert.ok(!published.has('mailServer'), 'they carry a password: not for every client');
  assert.ok(/Meteor\.publish\('mailServer'/.test(pub), 'they have their own publication');
  const mail = pub.slice(pub.indexOf("Meteor.publish('mailServer'"));
  assert.ok(/user && user\.isAdmin/.test(mail), 'which is admin-gated');
  assert.ok(!/['"]mailServer\.(?:password|passwords)['"]\s*:/.test(mail),
    'and never sends password values');
  assert.ok(/mailServer\.passwordSet/.test(mail),
    'but tells the form whether a password is already stored');
});

test('a checkbox that writes the settings document reads it back from the same field', () => {
  // The pattern that hid the bug: toggle the class, write the field, and let the
  // re-render draw the stored value. That only works when the field comes back.
  const js = read('client/components/settings/settingBody.js');
  const jade = read('client/components/settings/settingBody.jade');
  const toggles = [...js.matchAll(/'click a\.(js-toggle-[\w-]+)'/g)].map(m => m[1]);
  assert.ok(toggles.length > 3, 'the pane has several such toggles');
  for (const toggle of toggles) {
    const at = jade.indexOf(`a.flex.${toggle}`);
    if (at === -1) continue;   // rendered by another template
    const row = jade.slice(at, jade.indexOf('\n', jade.indexOf('materialCheckBox', at)));
    const field = /currentSetting\.([A-Za-z][\w]*)/.exec(row);
    if (!field) continue;      // reads something other than the settings document
    // The SMTP block (js-toggle-tls) reads mailServer, which has its own admin-only
    // publication - and is commented out in the pane at the moment besides.
    if (ADMIN_ONLY.has(field[1])) continue;
    assert.ok(published.has(field[1]),
      `${toggle} draws itself from currentSetting.${field[1]}, which must be published`);
  }
});

console.log(`\n${passed} tests passed`);
