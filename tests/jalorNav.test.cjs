'use strict';

// Jalor's primary navigation, as arithmetic.
//
// WeKan's whole-application pages - My Cards, Due Cards, Search, the Admin
// Panel - were reachable only from the pop-over behind the avatar. They are on
// the header bar now. The rule that matters is the one this test exists for:
// EVERY entry must be a route the application already serves. A navigation bar
// that offers a page nobody wrote is worse than one that offers nothing.
//
// Run: node tests/jalorNav.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('jalorNav:');

// The module is ESM and has no Meteor in it, which is the point: evaluate it
// here the way the other pure-module guards in this repo do.
const src = read('models/lib/jalorNav.js')
  .replace(/^'use strict';/m, '')
  .replace(/export \{[^}]*\};\s*$/m, '');
// eslint-disable-next-line no-new-func
const { JALOR_NAV, jalorNavEntries } = new Function(
  `${src}\nreturn { JALOR_NAV, jalorNavEntries };`)();

test('every route it names is a route the application serves', () => {
  const router = read('config/router.js');
  const declared = new Set(
    [...router.matchAll(/name: '([a-z0-9-]+)'/g)].map(m => m[1]),
  );
  assert.ok(declared.size > 20, `only ${declared.size} routes parsed from the router`);

  const missing = [];
  for (const entry of JALOR_NAV) {
    if (!declared.has(entry.routeName)) missing.push(`${entry.id}: ${entry.routeName}`);
    if (entry.orgAdminRouteName && !declared.has(entry.orgAdminRouteName)) {
      missing.push(`${entry.id}: ${entry.orgAdminRouteName}`);
    }
    for (const r of entry.routes) {
      if (!declared.has(r)) missing.push(`${entry.id}: ${r}`);
    }
  }
  assert.deepStrictEqual(missing, [],
    'the navigation points at routes that do not exist');
});

test('every label it uses is a translated key', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const fr = JSON.parse(read('imports/i18n/data/fr.i18n.json'));
  for (const entry of JALOR_NAV) {
    assert.ok(en[entry.labelKey], `${entry.labelKey} is not in en.i18n.json`);
    assert.ok(fr[entry.labelKey], `${entry.labelKey} is not in fr.i18n.json`);
  }
  assert.ok(en['jalor-main-nav'] && fr['jalor-main-nav'],
    "the navigation's own accessible name is translated");
});

test('the Admin Panel is only for somebody who can open it', () => {
  const plain = jalorNavEntries({ currentRoute: 'home' }).map(e => e.id);
  assert.ok(!plain.includes('admin'), 'an ordinary user is not offered it');
  assert.deepStrictEqual(plain, ['boards', 'my-cards', 'due-cards', 'search']);

  const admin = jalorNavEntries({ isAdmin: true, currentRoute: 'home' });
  assert.ok(admin.some(e => e.id === 'admin'));
  assert.strictEqual(admin.find(e => e.id === 'admin').routeName, 'setting');
});

test('a per-tenant admin is sent where they actually have a pane', () => {
  // Their Admin Panel is the same one with only their Organization's panes in
  // it, and Settings is not one of them - so Settings would be a dead end.
  const org = jalorNavEntries({ isOrgAdmin: true, currentRoute: 'home' });
  const entry = org.find(e => e.id === 'admin');
  assert.ok(entry, 'an org admin is offered the panel');
  assert.strictEqual(entry.routeName, 'people');
  // A site admin who is ALSO an org admin still lands on Settings.
  const both = jalorNavEntries({ isAdmin: true, isOrgAdmin: true, currentRoute: 'home' });
  assert.strictEqual(both.find(e => e.id === 'admin').routeName, 'setting');
});

test('the current entry is the SECTION you are in, not only the exact page', () => {
  const current = route => (jalorNavEntries({ isAdmin: true, currentRoute: route })
    .find(e => e.isCurrent) || {}).id;
  // A board is the Boards section.
  assert.strictEqual(current('board'), 'boards');
  assert.strictEqual(current('card'), 'boards');
  assert.strictEqual(current('archive'), 'boards');
  assert.strictEqual(current('home'), 'boards');
  // The Admin Panel is a dozen routes that are all the Admin Panel.
  assert.strictEqual(current('people'), 'admin');
  assert.strictEqual(current('problems'), 'admin');
  assert.strictEqual(current('translation'), 'admin');
  assert.strictEqual(current('my-cards'), 'my-cards');
  assert.strictEqual(current('broken-cards'), 'my-cards');
});

test('exactly one entry is current, or none (negative)', () => {
  const routes = ['home', 'board', 'my-cards', 'due-cards', 'global-search',
    'setting', 'people', 'shortcuts', 'support', ''];
  for (const route of routes) {
    const n = jalorNavEntries({ isAdmin: true, currentRoute: route })
      .filter(e => e.isCurrent).length;
    assert.ok(n <= 1, `${route || '(none)'} marks ${n} entries current`);
  }
  // A page outside every section marks none - and that is correct, not a bug:
  // Keyboard shortcuts and Support belong to no section.
  assert.strictEqual(
    jalorNavEntries({ isAdmin: true, currentRoute: 'shortcuts' }).filter(e => e.isCurrent).length,
    0);
  // Junk input does not throw.
  assert.doesNotThrow(() => jalorNavEntries());
  assert.doesNotThrow(() => jalorNavEntries({ currentRoute: null }));
  assert.doesNotThrow(() => jalorNavEntries({ currentRoute: 42 }));
});

test('the header renders it, as a nav, with aria-current', () => {
  const jade = read('client/components/main/header.jade');
  assert.ok(/nav#jalor-main-nav\(aria-label="\{\{_ 'jalor-main-nav'\}\}"\)/.test(jade),
    'it is a <nav> with an accessible name');
  assert.ok(/each jalorNav/.test(jade), 'it is drawn from the helper');
  assert.ok(/aria-current="\{\{#if isCurrent\}\}page\{\{\/if\}\}"/.test(jade),
    'and the current entry says so to a screen reader, not only in colour');
  const js = read('client/components/main/header.js');
  assert.ok(/jalorNavEntries\(\{/.test(js) && /FlowRouter\.path\(entry\.routeName\)/.test(js),
    'the helper turns route names into hrefs');
  assert.ok(/if \(!user\) return \[\];/.test(js),
    'and draws nothing for somebody who is not signed in');
});

console.log(`\njalorNav: ${passed} tests passed`);
