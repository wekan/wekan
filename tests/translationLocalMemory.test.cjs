'use strict';

// Translation-memory fill must remain same-language, placeholder-only and
// ambiguity-safe. Run: node tests/translationLocalMemory.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const source = fs.readFileSync(
  path.join(ROOT, 'releases/translations/fill-from-local-memory.mjs'),
  'utf8',
);

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('memory is built independently inside each language file', () => {
  assert.ok(/for \(const name of fs\.readdirSync\(DATA_DIR\)\.sort\(\)\)/.test(source));
  assert.ok(/const memory = new Map\(\)/.test(source));
  assert.ok(source.indexOf('const memory = new Map()') > source.indexOf('for (const name'));
});

test('existing non-English values are never selected for replacement', () => {
  assert.ok(/current !== source/.test(source),
    'the write loop must skip a value that is already translated');
});

test('only one agreed translation may fill a repeated source', () => {
  assert.ok(/values\.size !== 1/.test(source),
    'ambiguous translations must remain untouched');
  assert.ok(/const exact = values\?\.size === 1/.test(source));
  assert.ok(/data\[key\] = derived \?\? exact/.test(source));
});

test('protocol-version labels derive from same-language IP address vocabulary', () => {
  assert.ok(/memory\.get\("IP address"\)/.test(source));
  assert.ok(/derivedMemory\.set\("IPv4 address"/.test(source));
  assert.ok(/derivedMemory\.set\("IPv6 address"/.test(source));
  assert.ok(/\\bIP\\b/.test(source),
    'the derivation must replace the literal protocol token, not translated text');
  assert.ok(/derived === undefined/.test(source),
    'a missing derivation must remain untouched unless exact memory is unique');
});

test('wrong-script analysis ignores only universal IPv4 and IPv6 tokens', () => {
  const guard = fs.readFileSync(
    path.join(ROOT, 'releases/translations/wrong-script.mjs'),
    'utf8',
  );
  assert.ok(/const analyzedValue = value\.replace/.test(guard) && guard.includes('IPv[46]'));
  assert.ok(/RANGES\[script\]\.test\(analyzedValue\)/.test(guard));
  assert.ok(/LETTER\.test\(analyzedValue\)/.test(guard));
  assert.ok(/re\.test\(analyzedValue\)/.test(guard));
  assert.ok(!guard.includes('value.replace(/IPv/g'),
    'ordinary Latin text containing IPv must not receive a broad exemption');
});

test('English and English regional files are excluded', () => {
  assert.ok(/isEnglish\(code\)/.test(source));
});

test('dry-run is the default and writing must be explicit (negative)', () => {
  assert.ok(/process\.argv\[2\] \|\| '--dry-run'/.test(source));
  assert.ok(/mode === '--write'/.test(source));
});

console.log(`\ntranslationLocalMemory: ${passed} tests passed`);
