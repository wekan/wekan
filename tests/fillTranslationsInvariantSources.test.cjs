'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const node = path.join(ROOT, '.tools/node-v24.19.0-linux-x64/bin/node');
const script = path.join(ROOT, 'releases/translations/fill-translations.mjs');
const list = language => JSON.parse(childProcess.execFileSync(
  node, [script, '--list', language], { cwd: ROOT, encoding: 'utf8' },
));
const cantonese = list('yue_CN');
assert.deepStrictEqual(cantonese, {}, 'invariant-only Cantonese values are not missing');
const fullLocale = list('ee');
assert.ok(!('act-withCardTitle' in fullLocale),
  'placeholder-only display formats are invariant');
assert.ok('no-boards-selected' in fullLocale, 'real English prose remains listed');
const finnish = list('fi');
assert.ok(!Object.values(finnish).includes('Meteor'));
assert.ok(!Object.values(finnish).includes('1'));
assert.ok(Object.values(finnish).some(value => /[A-Za-z]{4}/.test(value)),
  'real untranslated prose remains listed');
const source = require('fs').readFileSync(script, 'utf8');
assert.doesNotMatch(source, /\/__[a-zA-Z]+__\/\.test/, 'sentences containing placeholders remain translatable');
console.log('fillTranslationsInvariantSources: 6 tests passed');
