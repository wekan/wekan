'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const node = process.execPath;
const script = path.join(ROOT, 'releases/translations/fill-translations.mjs');
const list = language => JSON.parse(childProcess.execFileSync(
  node, [script, '--list', language], { cwd: ROOT, encoding: 'utf8' },
));
const cantonese = list('yue_CN');
assert.deepStrictEqual(cantonese, {}, 'invariant-only Cantonese values are not missing');
const fullLocale = list('ee');
assert.deepStrictEqual(fullLocale, {},
  'completed Ewe contains only translations and invariant values');
const hebrew = list('he');
assert.deepStrictEqual(hebrew, {}, 'date-format masks are invariant');
const finnish = list('fi');
assert.deepStrictEqual(finnish, {},
  'a completed locale contains only translations and invariant values');
const bosnian = list('bs');
assert.deepStrictEqual(bosnian, {},
  'the Bosnian technical loanword Server is invariant, not untranslated');
assert.ok(!Object.hasOwn(list('sq'), 'color-indigo'));
assert.ok(!Object.hasOwn(list('sq'), 'color-magenta'),
  'international color names are invariant, not untranslated');
assert.ok(!Object.hasOwn(list('sq'), 'email'),
  'the Albanian technical loanword Email is invariant');
assert.ok(!Object.hasOwn(list('sq'), 'normal'));
assert.ok(!Object.hasOwn(list('sq'), 'private'),
  'correct Albanian loanwords are locale-specific invariants');
assert.deepStrictEqual(list('ak'), {},
  'completed Akan contains no placeholders after its own email translation');
const source = require('fs').readFileSync(script, 'utf8');
assert.doesNotMatch(source, /\/__[a-zA-Z]+__\/\.test/, 'sentences containing placeholders remain translatable');
console.log('fillTranslationsInvariantSources: 13 tests passed');
