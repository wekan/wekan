'use strict';

// #6755: "Focus is accessibility feature. Is there anywhere to disable it?" The blue
// ring WeKan draws round the focused control (layouts.css, WCAG 2.4.7) stays on by
// default, and Member Settings / Change Settings has a per-member switch, "Show
// focus outline", stored in the member's profile (profile.hideFocusOutline), that
// hides it for that member only.
//
// Run: node tests/hideFocusOutline6755.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

test('a per-member profile field, off unless explicitly set, so the ring shows by default', () => {
  const users = read('models/users.js');
  assert.match(users, /'profile\.hideFocusOutline': \{[\s\S]{0,700}type: Boolean,\n\s+optional: true,/);
  assert.match(users, /hasHideFocusOutline\(\) \{\n\s+return \(this\.profile \|\| \{\}\)\.hideFocusOutline === true;/);
});

test('a method toggles it for the signed-in member only, and refuses an anonymous call', () => {
  const server = read('server/models/users.js');
  assert.match(server, /async toggleHideFocusOutline\(\) \{\n\s+if \(!this\.userId\) throw new Meteor\.Error\('not-logged-in'/);
  assert.match(server, /Users\.updateAsync\(this\.userId, \{ \$set: \{ 'profile\.hideFocusOutline': \(user\.profile \|\| \{\}\)\.hideFocusOutline !== true \} \}\)/);
  // negative: no method takes the user id from the client for this setting
  assert.doesNotMatch(server, /toggleHideFocusOutline\([a-zA-Z]/);
});

test('Member Settings / Change Settings has the row, checked while the ring is shown', () => {
  const jade = read('client/components/users/userHeader.jade');
  assert.match(jade, /a\.js-toggle-hide-focus-outline\n\s+i\.fa\.fa-square-o\n\s+\| \{\{_ 'show-focus-outline'\}\}\n\s+if isShowFocusOutline\n\s+i\.fa\.fa-check/);
  const js = read('client/components/users/userHeader.js');
  assert.match(js, /isShowFocusOutline\(\) \{\n\s+const currentUser = ReactiveCache\.getCurrentUser\(\);\n\s+return currentUser \? !currentUser\.hasHideFocusOutline\(\) : true;/);
  assert.match(js, /'click \.js-toggle-hide-focus-outline'\(\) \{\n\s+if \(ReactiveCache\.getCurrentUser\(\)\) Meteor\.call\('toggleHideFocusOutline'\);/);
});

test('the setting becomes a class on <body>, and the stylesheet hides the ring for it, and only for it', () => {
  assert.match(read('client/components/main/uiFont.js'), /classList\.toggle\('has-hide-focus-outline', !!\(user && user\.profile && user\.profile\.hideFocusOutline === true\)\)/);
  const css = read('client/components/main/layouts.css');
  assert.match(css, /body\.has-hide-focus-outline :focus-visible,\nbody\.has-hide-focus-outline a:focus,\nbody\.has-hide-focus-outline button:focus,\nbody\.has-hide-focus-outline \[tabindex\]:focus \{\n\s+outline: none !important;/);
  assert.match(css, /body\.has-hide-focus-outline :is\(a, button, input, select, textarea, summary, \[tabindex\], \[role="button"\], \[contenteditable="true"\]\):focus-visible \{\n\s+box-shadow: none !important;/);
  // negative: the ring itself is still there for everybody else, and no rule hides it without the class
  assert.match(css, /a:focus-visible,\nbutton:focus-visible[\s\S]{0,400}outline: 2px solid #1565c0;/);
  for (const file of ['client/components/main/layouts.css']) {
    const unguarded = read(file).split('\n').filter(line => /:focus(-visible)?\b/.test(line) && /outline:\s*none/.test(line));
    assert.deepEqual(unguarded, [], 'no unconditional outline: none on a focused element');
  }
});

test('the label is translated in every language, and is not left in English where a language has its own', () => {
  const dir = path.join(root, 'imports/i18n/data');
  const english = JSON.parse(read('imports/i18n/data/en.i18n.json'))['show-focus-outline'];
  assert.equal(english, 'Show focus outline');
  let translated = 0;
  for (const name of fs.readdirSync(dir).filter(n => n.endsWith('.i18n.json'))) {
    const value = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'))['show-focus-outline'];
    assert.equal(typeof value, 'string', `${name} has the key`);
    assert.ok(value.length > 0, name);
    if (!/^en[_.-]|^en\./.test(name)) { assert.notEqual(value, english, `${name} is not an English placeholder`); translated += 1; }
  }
  assert.ok(translated > 200, `${translated} languages translated`);
});
