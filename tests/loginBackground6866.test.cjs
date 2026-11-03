'use strict';

// #6866: the login page stayed grey whatever the Admin Panel said, and the text
// under the login logo and the support page had no layout. Admin Panel / Lay-out
// has a "Login page background color" (loginBackgroundColor): a hex colour only,
// with a readable foreground, put on <body> while the sign-in layout is shown.
//
// Run: node tests/loginBackground6866.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { loginBackgroundStyle } = require('../models/lib/loginBackground');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

test('a hex colour gives the background and a readable foreground', () => {
  assert.deepEqual(loginBackgroundStyle('#1b365d'), { background: '#1b365d', foreground: '#ffffff' });
  assert.deepEqual(loginBackgroundStyle('#FFF'), { background: '#fff', foreground: '#000000' });
  assert.deepEqual(loginBackgroundStyle('  #f0e68c '), { background: '#f0e68c', foreground: '#000000' });
});

test('anything but a hex colour is "not set" - it can never carry CSS (negative)', () => {
  for (const value of ['', '   ', 'red', 'rgb(1,2,3)', '#12', '#12345', '#1234567', '#ggg',
    '#fff; background: url(//evil)', 'red;}body{display:none', '#fff #000', null, undefined, 5, {}]) {
    assert.equal(loginBackgroundStyle(value), null, JSON.stringify(value));
  }
});

test('the setting is stored, published, saved from Lay-out and writable over REST', () => {
  assert.match(read('models/settings.js'), /loginBackgroundColor: \{\n\s+type: String,\n\s+optional: true,/);
  assert.match(read('server/publications/settings.js'), /loginBackgroundColor: 1,/);
  assert.match(read('server/publications/customUI.js'), /loginBackgroundColor: 1,/);
  assert.match(read('server/models/settings.js'), /'loginBackgroundColor',/);
  assert.match(read('client/components/settings/settingBody.js'), /\['#login-background-color', 'loginBackgroundColor'\]/);
  assert.match(read('client/components/settings/settingBody.jade'), /input\.wekan-form-control#login-background-color\(type="text"/);
});

test('only the sign-in layout is coloured, only through the validated value, and it is undone', () => {
  const js = read('client/components/main/layouts.js');
  assert.match(js, /loginBackgroundStyle\(setting && setting\.loginBackgroundColor\)/);
  assert.match(js, /style\.setProperty\('--login-background', style\.background\)/);
  assert.match(js, /Template\.userFormsLayout\.onDestroyed\(clearLoginBackground\)/);
  assert.match(js, /classList\.remove\('has-login-background'\)/);
  // negative: the raw setting never reaches the DOM except through the validator
  assert.doesNotMatch(js, /setProperty\('--login-background', (?!style\.background)/);
  assert.doesNotMatch(js, /loginBackgroundColor[^;\n]*(innerHTML|cssText|setAttribute\('style')/);
});

test('the page background applies only under the class; the grey stays otherwise', () => {
  const css = read('client/components/main/layouts.css');
  assert.match(css, /body\.has-login-background \{\n\s+background: var\(--login-background\);/);
  assert.match(css, /body\.has-login-background \.textBelowCustomLoginLogo a \{\n\s+color: var\(--login-foreground\);/);
  assert.match(css, /\nbody \{\n\s+background: #dedede;/);
});

test('the support page is a readable column with real headings', () => {
  const css = read('client/components/main/layouts.css');
  assert.match(css, /\.support-page \{\n\s+padding: 24px 16px;/);
  assert.match(css, /\.support-page-content \{[^}]*max-width: 860px;[^}]*margin: 0 auto;[^}]*background: #fff;/);
  assert.match(css, /\.support-page-content h1 \{ font-size: 1\.8em; \}/);
  assert.match(css, /\.support-page-content p,[\s\S]{0,120}margin: 0 0 1em;/);
});

test('the text under the login logo is the same column, with no card of its own', () => {
  const css = read('client/components/main/layouts.css');
  assert.match(css, /\.textBelowCustomLoginLogo > \* \{\n\s+width: 100%;\n\s+max-width: 860px;/);
  assert.match(css, /\.textBelowCustomLoginLogo h2,/);
  assert.doesNotMatch(css, /\.textBelowCustomLoginLogo\s*\{[^}]*background:/);
});

test('the label exists in every locale and is translated, not English', () => {
  const dir = path.join(root, 'imports/i18n/data');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'))['login-background-color'];
  assert.equal(en, 'Login page background color');
  let translated = 0;
  for (const file of fs.readdirSync(dir)) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    assert.ok(data['login-background-color'], `${file} lacks the label`);
    if (data['login-background-color'] !== en) translated++;
  }
  assert.ok(translated > 200, `only ${translated} locales translated`);
  assert.equal(JSON.parse(read('imports/i18n/data/nl.i18n.json'))['login-background-color'], 'Achtergrondkleur aanmeldpagina');
});
