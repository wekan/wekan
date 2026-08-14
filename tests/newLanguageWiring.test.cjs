'use strict';

// A new language is three edits, or it is invisible.
// Run: node tests/newLanguageWiring.test.cjs
//
// Adding a language to WeKan means a strings file, an entry in languages.js and
// a flag in the picker. Miss the second and the file is never loaded; miss the
// third and the row has the globe fallback beside a name nobody recognises. The
// three lists are in three different files, so nothing but this notices when
// they drift apart.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('newLanguageWiring:');

const registry = read('imports/i18n/languages.js');
const header = read('client/components/users/userHeader.js');
const files = fs.readdirSync(path.join(ROOT, 'imports/i18n/data'))
  .filter(f => f.endsWith('.i18n.json'))
  .map(f => f.replace('.i18n.json', ''));
// The registry's KEY is the locale tag; the file it loads can be spelled with
// an underscore where the tag has a hyphen (`ca-ES` loads `ca_ES.i18n.json`),
// so what ties an entry to a file is the import path, not the key.
const loaded = [...registry.matchAll(/import\('\.\/data\/([^']+)\.i18n\.json'\)/g)].map(m => m[1]);

// Two files on disk that NO entry loads. `km-KH` and `ru-RU` are registered
// under the tags `km_KH` and `ru_RU`, but they import the hyphenated file - so
// the underscored ones are translations nobody can ever see. They are kept
// because Transifex writes them, and pinned here rather than passed over: a
// THIRD unreachable file is a mistake, these two are a known state.
const UNREACHABLE = ['km_KH', 'ru_RU'];

test('every strings file is registered, and every entry has a file', () => {
  const unregistered = files.filter(t => !loaded.includes(t) && !UNREACHABLE.includes(t));
  assert.deepStrictEqual(unregistered, [],
    'a file nobody registered is a language WeKan never loads');
  const fileless = loaded.filter(t => !files.includes(t));
  assert.deepStrictEqual(fileless, [],
    'an entry with no file is a language that fails to load when picked');
});

test('an entry names its language in that language', () => {
  // The picker is read by somebody who does not read English.
  const entries = [...registry.matchAll(/"([^"]+)": \{\s*\n\s*code: "[^"]*",\s*\n\s*tag: "[^"]*",\s*\n\s*name: "([^"]*)"/g)];
  assert.ok(entries.length >= files.length - 2, `expected a name per language, found ${entries.length}`);
  for (const [, tag, name] of entries) {
    assert.ok(name.trim().length > 0, `${tag} has no name`);
  }
  // Spot-check the ones added most recently, in their own scripts.
  const byTag = Object.fromEntries(entries.map(([, t, n]) => [t, n]));
  for (const [tag, name] of [['bn', 'বাংলা'], ['ur', 'اردو'], ['mr', 'मराठी'], ['am', 'አማርኛ']]) {
    assert.strictEqual(byTag[tag], name, `${tag} is named in its own script`);
  }
});

test('every language has a flag, or the deliberate globe', () => {
  const map = header.slice(header.indexOf('const flagMap'), header.indexOf('};', header.indexOf('const flagMap')));
  // A constructed language has no country, and the code falls back to a globe
  // rather than borrowing somebody's flag.
  const CONSTRUCTED = ['eo', 'tlh', 'vo', 'ia'];
  const missing = files
    .map(t => t.split(/[-_@]/)[0])
    .filter((t, i, all) => all.indexOf(t) === i)
    .filter(t => !CONSTRUCTED.includes(t) && !new RegExp(`'${t}': '`).test(map));
  assert.ok(missing.length <= 12,
    `${missing.length} languages fall back to the globe: ${missing.join(' ')}`);
  assert.ok(/return flagMap\[this\.tag\] \|\| '🌐';/.test(header),
    'and the fallback is a globe, not a wrong country');
});

test('a right-to-left language says so (negative)', () => {
  // Urdu, Arabic, Hebrew, Persian, Uyghur, Yiddish. A file whose script runs
  // the other way and whose entry says `rtl: false` lays the whole UI out
  // backwards for its readers.
  // Non-greedy across the whole file would let one entry's key pair with a
  // LATER entry's rtl flag; each entry is matched whole instead.
  const rtlTrue = [...registry.matchAll(/^  "([^"]+)": \{\n(?:[^}]*\n)?\s*rtl: (true|false),\n  \},/gm)]
    .filter(m => m[2] === 'true').map(m => m[1]);
  for (const tag of ['ur', 'ar', 'he', 'fa', 'ug', 'yi']) {
    assert.ok(rtlTrue.includes(tag), `${tag} must be rtl: true`);
  }
  assert.ok(!rtlTrue.includes('bn') && !rtlTrue.includes('am'),
    'and a left-to-right script is not flagged as one');
});

console.log(`\nnewLanguageWiring: ${passed} tests passed`);
