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
// Reviewed native terms are locale-specific. Exercise the real list/apply CLI
// on fixtures so an exemption cannot silently hide prose or other locales.
const fs = require('fs');
fs.mkdirSync(path.join(ROOT, '.tools/tmp'), { recursive: true });
const fixture = fs.mkdtempSync(path.join(ROOT, '.tools/tmp/native-source-terms-'));
try {
  const data = path.join(fixture, 'imports/i18n/data');
  fs.mkdirSync(data, { recursive: true });
  const english = { server: 'Server', errors: 'Errors', sentence: 'The server failed' };
  for (const locale of ['en', 've-PP', 'ca@valencia', 'xx']) {
    fs.writeFileSync(path.join(data, `${locale}.i18n.json`), JSON.stringify(english));
  }
  const fixtureList = locale => JSON.parse(childProcess.execFileSync(node,
    [script, '--list', locale], { cwd: fixture, encoding: 'utf8' }));
  assert.deepStrictEqual(fixtureList('ve-PP'), { errors: 'Errors', sentence: 'The server failed' });
  assert.deepStrictEqual(fixtureList('ca@valencia'), { server: 'Server', sentence: 'The server failed' });
  assert.deepStrictEqual(fixtureList('xx'), english, 'no source-wide server/errors exemption');
  const proposed = path.join(fixture, 'proposed.json');
  fs.writeFileSync(proposed, JSON.stringify({ server: 'Incorrect replacement', sentence: 'Translated prose' }));
  childProcess.execFileSync(node, [script, '--apply', 've-PP', proposed], { cwd: fixture });
  const after = JSON.parse(fs.readFileSync(path.join(data, 've-PP.i18n.json'), 'utf8'));
  assert.strictEqual(after.server, 'Server', 'fill preserves the reviewed Veps noun');
  assert.strictEqual(after.sentence, 'Translated prose', 'ordinary prose still fills');
} finally { fs.rmSync(fixture, { recursive: true, force: true }); }
assert.ok(!Object.hasOwn(list('ve-PP'), 'server'));
assert.ok(!Object.hasOwn(list('ca@valencia'), 'errors'));
assert.deepStrictEqual(list('zgh'), {}, 'reviewed zgh search keywords are complete');
const syntaxFixture = fs.mkdtempSync(path.join(ROOT, '.tools/tmp/zgh-syntax-terms-'));
try {
  const syntaxData = path.join(syntaxFixture, 'imports/i18n/data');
  fs.mkdirSync(syntaxData, { recursive: true });
  const english = { 'operator-due': 'due', sentence: 'The board is unavailable' };
  for (const locale of ['en', 'zgh', 'xx']) {
    fs.writeFileSync(path.join(syntaxData, `${locale}.i18n.json`), JSON.stringify(english));
  }
  const syntaxList = locale => JSON.parse(childProcess.execFileSync(node,
    [script, '--list', locale], { cwd: syntaxFixture, encoding: 'utf8' }));
  assert.deepStrictEqual(syntaxList('zgh'), { sentence: english.sentence },
    'zgh syntax exemption does not hide ordinary untranslated prose');
  assert.deepStrictEqual(syntaxList('xx'), english,
    'the zgh parser keyword is not exempted in another locale');
  const proposed = path.join(syntaxFixture, 'proposed.json');
  fs.writeFileSync(proposed, JSON.stringify({ 'operator-due': 'Unreviewed alias', sentence: 'Native sentence' }));
  childProcess.execFileSync(node, [script, '--apply', 'zgh', proposed], { cwd: syntaxFixture });
  const after = JSON.parse(fs.readFileSync(path.join(syntaxData, 'zgh.i18n.json'), 'utf8'));
  assert.strictEqual(after['operator-due'], 'due', 'fill cannot overwrite reviewed parser code');
  assert.strictEqual(after.sentence, 'Native sentence', 'ordinary prose still fills');
} finally { fs.rmSync(syntaxFixture, { recursive: true, force: true }); }
const source = require('fs').readFileSync(script, 'utf8');
assert.doesNotMatch(source, /\/__[a-zA-Z]+__\/\.test/, 'sentences containing placeholders remain translatable');
console.log('fillTranslationsInvariantSources: native terms and zgh syntax checks passed');
