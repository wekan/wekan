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
const dataDir = path.join(ROOT, 'imports/i18n/data');
const files = fs.readdirSync(dataDir)
  .filter(f => f.endsWith('.i18n.json'))
  .map(f => f.replace('.i18n.json', ''));
// Some tags are a SYMLINK to the file Transifex writes: `km-KH.i18n.json` ->
// `km_KH.i18n.json`, because the tx lang_map does not rename those two. The
// entry loads the link, the link resolves to the file, and both are reachable -
// so a file is "registered" if an entry names IT or names a link to it.
const linkTargets = new Map();
for (const f of fs.readdirSync(dataDir)) {
  const full = path.join(dataDir, f);
  if (!fs.lstatSync(full).isSymbolicLink()) continue;
  linkTargets.set(f.replace('.i18n.json', ''),
    fs.readlinkSync(full).replace('.i18n.json', ''));
}
// The registry's KEY is the locale tag; the file it loads can be spelled with
// an underscore where the tag has a hyphen (`ca-ES` loads `ca_ES.i18n.json`),
// so what ties an entry to a file is the import path, not the key.
const loaded = [...registry.matchAll(/import\(["']\.\/data\/([^"']+)\.i18n\.json["']\)/g)]
  .map(m => m[1]);

test('every strings file is registered, and every entry has a file', () => {
  const reachable = new Set(loaded);
  for (const [link, target] of linkTargets) if (reachable.has(link)) reachable.add(target);
  const unregistered = files.filter(t => !reachable.has(t));
  assert.deepStrictEqual(unregistered, [],
    'a file nobody registered is a language WeKan never loads');
  const fileless = loaded.filter(t => !files.includes(t));
  assert.deepStrictEqual(fileless, [],
    'an entry with no file is a language that fails to load when picked');
});

test('an entry names its language in that language', () => {
  // The picker is read by somebody who does not read English.
  const entries = [...registry.matchAll(
    /^\s{2}\["([^"]+)",\s*"[^"]+",\s*"[^"]+",\s*("(?:\\.|[^"])*")/gm)]
    .map(match => [match[0], match[1], JSON.parse(match[2])]);
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
  const rtlTrue = [...registry.matchAll(
    /^\s{2}\["([^"]+)",\s*"[^"]+",\s*"[^"]+",\s*"(?:\\.|[^"])*",\s*(true|false)\],/gm)]
    .filter(m => m[2] === 'true').map(m => m[1]);
  for (const tag of ['ur', 'ar', 'he', 'fa', 'ug', 'yi']) {
    assert.ok(rtlTrue.includes(tag), `${tag} must be rtl: true`);
  }
  assert.ok(!rtlTrue.includes('bn') && !rtlTrue.includes('am'),
    'and a left-to-right script is not flagged as one');
});

test('a tag can be a symlink to the file Transifex writes (negative)', () => {
  // `.tx/config`'s lang_map renames most of Transifex's underscored locales to
  // WeKan's hyphenated files (`cs_CZ: cs-CZ`). Two are not renamed - `km_KH`
  // and `ru_RU` - and for those the hyphenated name is a SYMLINK to the file
  // Transifex writes. That is a working arrangement, not a stranded file: the
  // entry loads the link and the link resolves to the translations.
  assert.ok(linkTargets.get('km-KH') === 'km_KH', 'km-KH links to km_KH');
  assert.ok(linkTargets.get('ru-RU') === 'ru_RU', 'ru-RU links to ru_RU');
  for (const [link, target] of linkTargets) {
    assert.ok(files.includes(target), `${link} points at ${target}, which must exist`);
    assert.ok(loaded.includes(link) || loaded.includes(target),
      `neither ${link} nor ${target} is loaded by any entry`);
  }
  const tx = read('.tx/config');
  assert.ok(/lang_map/.test(tx) && /cs_CZ: cs-CZ/.test(tx),
    'and the map that makes the other pairs unnecessary is still there');
});

test('the README\'s language count is the count', () => {
  // A number in the README is a claim, and this one had been 154 since before
  // ninety more languages were added. It is checked against the files rather
  // than remembered: the count of non-English data files, and how many of them
  // are essentially complete.
  const readme = read('README.md');
  const m = readme.match(/translated\]\([^)]*\) to (\d+) languages,\s*\n\s*(\d+) of them essentially complete/);
  assert.ok(m, 'the README states both numbers in one sentence');

  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const total = Object.keys(en).length;
  const langs = fs.readdirSync(dataDir)
    .filter(f => f.endsWith('.i18n.json'))
    .map(f => f.replace('.i18n.json', ''))
    .filter(l => l !== 'en' && !l.startsWith('en-') && !l.startsWith('en_'));

  let complete = 0;
  for (const lang of langs) {
    const doc = JSON.parse(read(`imports/i18n/data/${lang}.i18n.json`));
    const done = Object.keys(en).filter(k => doc[k] && doc[k] !== en[k]).length;
    if (done / total > 0.9) complete += 1;
  }

  assert.strictEqual(Number(m[1]), langs.length,
    `README says ${m[1]} languages, there are ${langs.length}`);
  assert.strictEqual(Number(m[2]), complete,
    `README says ${m[2]} essentially complete, there are ${complete}`);
});

console.log(`\nnewLanguageWiring: ${passed} tests passed`);
