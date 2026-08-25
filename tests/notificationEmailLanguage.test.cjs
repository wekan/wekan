'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const english = JSON.parse(read('imports/i18n/data/en.i18n.json'));
const french = JSON.parse(read('imports/i18n/data/fr.i18n.json'));
const notification = read('server/notifications/email.js');
const localization = read('server/lib/emailLocalization.js');
const tap = read('imports/i18n/tap.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('#5438 representative notification prose exists in French', () => {
  assert.strictEqual(english['activity-added'], 'added %s to %s');
  assert.strictEqual(french['activity-added'], 'a ajouté %s à %s');
  assert.notStrictEqual(french['activity-added'], english['activity-added']);
  assert.deepStrictEqual(
    french['activity-added'].match(/%s/g),
    english['activity-added'].match(/%s/g),
  );
});

test('#5438 notification preparation loads the recipient language first', () => {
  const load = notification.indexOf(
    'await TAPi18n.ensureLanguageLoaded(user.getLanguage())',
  );
  const language = notification.indexOf('const lan = user.getLanguage()');
  const subject = notification.indexOf('TAPi18n.__(title, params, lan)');
  const body = notification.indexOf(
    'TAPi18n.__(description, quoteParams, lan)',
  );
  assert.ok(load >= 0 && load < language && language < subject && subject < body);
});

test('the buffered email keeps the same recipient language at send time', () => {
  assert.match(
    notification,
    /EmailLocalization\.sendEmail\(\{[\s\S]*?language: user\.getLanguage\(\),[\s\S]*?userId: user\._id/,
  );
});

test('the shared email sender also loads before translating', () => {
  const load = localization.indexOf('await TAPi18n.ensureLanguageLoaded(lang)');
  const translate = localization.indexOf(
    'TAPi18n.__(options.subject, options.params || {}, lang)',
  );
  assert.ok(load >= 0 && load < translate);
});

test('negative: unsupported or already-loaded languages do not load again', () => {
  assert.match(tap, /if \(!language \|\| !this\.i18n\) return/);
  assert.match(tap, /const key = this\.resolveTag\(language\)/);
  assert.match(tap, /if \(!key\) return/);
  assert.match(
    tap,
    /if \(this\.i18n\.hasResourceBundle\(this\.toI18nCode\(key\), DEFAULT_NAMESPACE\)\) return/,
  );
});

test('negative: notification translation does not use the server default', () => {
  assert.doesNotMatch(notification, /TAPi18n\.getLanguage\(\)/);
  assert.doesNotMatch(notification, /TAPi18n\.__\(title, params\)(?!,)/);
  assert.doesNotMatch(notification, /TAPi18n\.__\(description, quoteParams\)(?!,)/);
});

console.log(`\nnotificationEmailLanguage: all ${passed} tests passed`);
