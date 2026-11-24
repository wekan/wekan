'use strict';

// WP-6 (docs/Compliance/README.md): the legal pages - privacy notice, terms,
// cookie notice, imprint - and the privacy contacts. Published by a site
// administrator in Admin Panel / Settings / Legal pages, readable by
// everybody, signed in or not, from the login page and Member Settings /
// Privacy and my data.
// Run: node --test tests/legalPages.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const L = require('../models/lib/legalPages');

test('a published page is public; an unpublished one, or an unknown page, is not', () => {
  const page = L.publicPage({ _id: 'privacy', enabled: true, title: 'Privacy', body: '# Who we are', version: 3, secretNote: 'x' });
  assert.deepEqual(Object.keys(page).sort(), ['_id', 'body', 'modifiedAt', 'requireAcceptance', 'title', 'url', 'version']);
  assert.equal(page.version, 3);
  assert.equal(L.publicPage({ _id: 'privacy', enabled: false, body: 'draft' }), null);
  assert.equal(L.publicPage({ _id: 'secret', enabled: true }), null);
  assert.equal(L.publicPage(null), null);
});

test('the imprint shows only the fields that are filled, in their order', () => {
  const page = L.publicPage({ _id: 'imprint', enabled: true, name: 'Example Oy', email: 'info@example.com', vatId: ' ', address: 'Street 1' });
  assert.deepEqual(page.fields, [
    { key: 'name', value: 'Example Oy' }, { key: 'address', value: 'Street 1' }, { key: 'email', value: 'info@example.com' },
  ]);
});

test('negative: a link is only http or https, so no javascript: URL becomes a link', () => {
  for (const bad of ['javascript:alert(1)', 'data:text/html,x', 'https://x.example/"onmouseover=', ' ftp://x', '']) {
    assert.equal(L.safeUrl(bad), '', bad);
  }
  assert.equal(L.safeUrl('https://example.com/privacy'), 'https://example.com/privacy');
});

test('a save: unknown fields dropped, the version up only when what a reader sees changed', () => {
  const first = L.pageUpdate({ _id: 'terms' }, { enabled: true, title: 'Terms', body: 'v1', isAdmin: true, version: 99 });
  assert.equal(first.version, 1);
  assert.equal(first.isAdmin, undefined);
  const same = L.pageUpdate({ _id: 'terms', ...first }, { enabled: false, title: 'Terms', body: 'v1' });
  assert.equal(same.version, 1, 'publishing or hiding it is not a new version');
  const changed = L.pageUpdate({ _id: 'terms', ...first }, { enabled: true, title: 'Terms', body: 'v2' });
  assert.equal(changed.version, 2);
  const imprint = L.pageUpdate({ _id: 'imprint', version: 4, name: 'A' }, { enabled: true, name: 'B' });
  assert.equal(imprint.version, 5, 'an imprint field is what a reader sees too');
  assert.throws(() => L.pageUpdate({ _id: 'other' }, {}), /legal-page-unknown/);
});

test('the contacts: only the known ones, and only the filled ones public', () => {
  assert.deepEqual(L.contactsUpdate({ privacyContact: 'privacy@example.com', other: 'x' }),
    { privacyContact: 'privacy@example.com', dpoContact: '', euRepresentative: '', securityContact: '' });
  assert.deepEqual(L.publicContacts({ privacyContact: 'p@x', dpoContact: '' }), [{ key: 'privacyContact', value: 'p@x' }]);
});

test('the server: everybody reads only what is published; only a site administrator writes, and it is audited', () => {
  const m = read('server/methods/legalPages.js');
  const body = name => m.slice(m.indexOf(`async ${name}(`), m.indexOf('\n  },', m.indexOf(`async ${name}(`)));
  assert.match(body('getLegalPages'), /docs\.map\(publicPage\)\.filter\(Boolean\)/);
  assert.doesNotMatch(body('getLegalPages'), /assertSiteAdmin/, 'signed-out visitors read the published pages');
  for (const name of ['getLegalPagesForAdmin', 'saveLegalPage', 'saveLegalContacts']) {
    assert.match(body(name), /await assertSiteAdmin\(this\.userId\)/, name);
  }
  assert.match(m, /user\.loginDisabled \|\| !isSiteAdmin\(user\)/);
  assert.match(read('models/legalPages.js'), /LegalPages\.deny\(\{ insert: \(\) => true, update: \(\) => true, remove: \(\) => true \}\)/);
  const audit = require('../models/lib/adminAudit');
  assert.ok(audit.AUDITED_METHODS.includes('saveLegalPage') && audit.AUDITED_METHODS.includes('saveLegalContacts'));
});

test('the pages need no sign-in, and are linked from the login page and from Member Settings', () => {
  const router = read('config/router.js');
  const block = router.slice(router.indexOf("for (const page of ['privacy', 'terms', 'cookies', 'imprint'])"));
  assert.ok(block.length > 0);
  assert.doesNotMatch(block.slice(0, block.indexOf('\n}\n')), /triggersEnter/, 'no sign-in trigger');
  assert.match(read('client/components/main/layouts.jade'), /\+legalPageLinks/);
  const menu = read('client/components/users/userHeader.jade');
  assert.match(menu, /a\.js-privacy-and-my-data/);
  const popup = menu.slice(menu.indexOf('template(name="privacyAndMyDataPopup")'));
  assert.match(popup, /a\.js-download-my-data/);
  assert.match(popup, /\+legalPageLinks/);
});

test('negative: Matomo, when an operator turns it on, never sets a cookie', () => {
  const utils = read('client/lib/utils.js');
  const set = utils.slice(utils.indexOf('setMatomo(data) {'), utils.indexOf('manageMatomo() {'));
  const disable = set.indexOf("window._paq.push(['disableCookies'])");
  assert.ok(disable > 0, 'cookies are disabled');
  for (const call of ['trackPageView', 'setUserId', 'enableLinkTracking']) {
    assert.ok(disable < set.indexOf(call), `before ${call}`);
  }
});

test('the privacy notice draft names every kind of data WeKan keeps, and where each right is served', () => {
  const { draftPrivacyNotice, inventoryRows, CATEGORY_TEXT } = require('../models/lib/privacyNoticeDraft');
  const { INVENTORY } = require('../models/lib/personalDataInventory');
  const draft = draftPrivacyNotice();
  for (const c of new Set(INVENTORY.flatMap(e => e.categories).filter(c => c !== 'none'))) {
    assert.ok(draft.includes(CATEGORY_TEXT[c]), `category ${c}`);
  }
  assert.match(draft, /Download my data/);
  assert.match(draft, /fill in/, 'it says what the operator still has to write');
  const personal = INVENTORY.filter(e => !(e.categories.length === 1 && e.categories[0] === 'none'));
  assert.equal(inventoryRows().length, personal.length);
});

test('negative: the draft only fills an empty text, never over what the operator wrote', () => {
  const js = read('client/components/settings/legalPagesSettings.js');
  assert.match(js, /if \(!body\.value\.trim\(\)\) body\.value = draftPrivacyNotice\(\);/);
});
