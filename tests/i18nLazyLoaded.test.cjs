'use strict';

// Guard: every language is loaded on DEMAND, never bundled into the main client.
// Run: node tests/i18nLazyLoaded.test.cjs
//
// WeKan ships 246 languages, 37 MB of JSON in imports/i18n/data. The only reason
// that is affordable is the shape of every entry in imports/i18n/languages.js:
//
//   load: () => import('./data/ace.i18n.json'),
//
// A dynamic import() is a SPLIT POINT. rspack emits each language as its own
// chunk - measured on a built bundle: 238 chunks, 34 MiB of JS - and a browser
// fetches exactly one, about 145 KB for the language in use. Adding the 247th
// language costs one more chunk that only speakers of it ever request.
//
// Written as `import data from './data/ace.i18n.json'`, or `require(...)`, the
// same line stops being a split point and 34 MiB lands in the main bundle for
// every user. It is one character of difference in a file of 246 near-identical
// blocks, added by hand each time a language is added - exactly the edit that
// gets made by copy-paste at the end of a long session.
//
// So this suite is about the SHAPE of those lines, and about nothing else
// referring to the data files at all.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const LANGUAGES = 'imports/i18n/languages.js';
const src = read(LANGUAGES);
const DATA_DIR = path.join(ROOT, 'imports', 'i18n', 'data');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Every `load:` line, whatever its shape, so a wrong one is caught rather than
// skipped by a regex that only matches the right shape.
const loadLines = src.split('\n')
  .map((line, i) => [i + 1, line.trim()])
  .filter(([, line]) => /^load\s*:/.test(line));

test('every language entry has a load:', () => {
  // A `tag:` with no `load:` is a language the picker offers and cannot open.
  const tags = [...src.matchAll(/^\s*tag:\s*["']([^"']+)["']/gm)].map(m => m[1]);
  assert.ok(tags.length > 200, `expected the whole language list, found ${tags.length}`);
  assert.strictEqual(loadLines.length, tags.length,
    `${tags.length} languages but ${loadLines.length} load: lines - one of them cannot be opened`);
});

test('every load: is a DYNAMIC import(), which is what splits the chunk', () => {
  const wrong = loadLines.filter(([, line]) =>
    !/^load:\s*\(\)\s*=>\s*import\('\.\/data\/[^']+\.i18n\.json'\),?$/.test(line));
  assert.deepStrictEqual(wrong, [],
    'these load: lines are not `() => import(...)`, so their language is bundled into '
    + 'the main client instead of split into its own chunk:\n'
    + wrong.map(([n, l]) => `  ${LANGUAGES}:${n}  ${l}`).join('\n'));
});

test('no load: uses require(), which is not a split point either (negative)', () => {
  const req = loadLines.filter(([, line]) => /require\s*\(/.test(line));
  assert.deepStrictEqual(req, [],
    'require() is resolved eagerly by the bundler:\n'
    + req.map(([n, l]) => `  ${LANGUAGES}:${n}  ${l}`).join('\n'));
});

test('the file has no STATIC import of a data file (negative)', () => {
  // `import x from './data/fi.i18n.json'` at the top of the file would pull that
  // language in eagerly no matter how the load: below it is written.
  const statics = src.split('\n')
    .map((line, i) => [i + 1, line.trim()])
    .filter(([, line]) => /^import\s+[^(]/.test(line) && /i18n\.json/.test(line));
  assert.deepStrictEqual(statics, [],
    'a top-level import of a language file is eager:\n'
    + statics.map(([n, l]) => `  ${LANGUAGES}:${n}  ${l}`).join('\n'));
});

test('nothing else in the tree reaches into imports/i18n/data', () => {
  // languages.js is the one door. A second reference somewhere else - a helper
  // that reads every file to build a list, say - would bundle them all.
  const dirs = ['client', 'imports', 'models', 'server', 'config'];
  const offenders = [];
  const walk = dir => {
    let ents;
    try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'data') walk(p); continue; }
      if (!/\.(js|jsx|ts)$/.test(e.name)) continue;
      const rel = path.relative(ROOT, p);
      if (rel === LANGUAGES) continue;
      for (const [i, line] of fs.readFileSync(p, 'utf8').split('\n').entries()) {
        if (!/i18n\/data\//.test(line)) continue;
        // A path in a string used at RUNTIME (the migration scripts name files
        // inside a built bundle) is not a bundler reference; an import or a
        // require is.
        if (/\b(?:import|require)\s*\(/.test(line) || /^\s*import\s+[^(]/.test(line)) {
          offenders.push(`  ${rel}:${i + 1}  ${line.trim()}`);
        }
      }
    }
  };
  for (const d of dirs) walk(path.join(ROOT, d));
  assert.deepStrictEqual(offenders, [],
    'only languages.js may import a language file:\n' + offenders.join('\n'));
});

test('every load: points at a data file that exists, and each file is claimed', () => {
  // The two ways this list and that directory drift apart: an entry whose file
  // was never added (the language is offered and 404s), and a file no entry
  // names (37 MB of JSON nothing can reach).
  //
  // SYMLINKS COUNT AS CLAIMING THEIR TARGET. `.tx/config`'s lang_map renames most
  // of Transifex's underscored locales to WeKan's hyphenated files, and for the
  // two it does not - km_KH and ru_RU - the hyphenated name is a SYMLINK to the
  // file Transifex writes. The entry loads the link, the link resolves to the
  // translations, and the underscored file is not stranded. See
  // tests/newLanguageWiring.test.cjs, which pins that arrangement from the other
  // side. Reading it as two copies is a mistake worth not making twice: it
  // deletes a language's real translations.
  const named = new Set([...src.matchAll(/import\('\.\/data\/([^']+)'\)/g)].map(m => m[1]));
  const onDisk = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.i18n.json'));
  const missing = [...named].filter(f => !fs.existsSync(path.join(DATA_DIR, f)));
  assert.deepStrictEqual(missing, [],
    `languages.js offers these, and the file is not there: ${missing.join(', ')}`);

  const claimed = new Set(named);
  for (const f of named) {
    const p = path.join(DATA_DIR, f);
    try {
      if (fs.lstatSync(p).isSymbolicLink()) claimed.add(path.basename(fs.readlinkSync(p)));
    } catch { /* the missing check above already reported it */ }
  }
  const orphans = onDisk.filter(f => !claimed.has(f));
  assert.deepStrictEqual(orphans, [],
    'these translation files exist and no language entry loads them, directly or '
    + `through a symlink: ${orphans.join(', ')}`);
});

test('a Transifex pull writes the file the app loads, for every language', () => {
  // A pull that writes a name languages.js does not load means every new
  // translation for that language lands where WeKan never opens it. Two things
  // make the name match, and both are legitimate: a lang_map entry in
  // .tx/config renaming the locale (`te_IN: te-IN`, and 60-odd more), or a
  // SYMLINK from the loaded name to the file the pull writes (km_KH, ru_RU).
  //
  // So the comparison is made through symlinks - two names for one file are one
  // file. Only a mismatch with a SEPARATE file on disk is asserted, because that
  // is the shape that proves a pull really landed somewhere unread; whether a
  // locale exists on Transifex at all is something only a pull can answer, and
  // this suite makes no network calls.
  const cfg = read('.tx/config');
  const lm = /lang_map\s*=\s*(.+)/.exec(cfg);
  assert.ok(lm, '.tx/config must have a lang_map');
  const mapping = Object.fromEntries(lm[1].split(',')
    .map(p => p.trim().split(': ')).filter(p => p.length === 2));

  const entries = [...src.matchAll(
    /"[^"]+":\s*\{\s*code:[^,]+,\s*tag:\s*"([^"]+)",\s*name:[^,]+,\s*load:\s*\(\)\s*=>\s*import\('\.\/data\/([^']+)\.i18n\.json'\)/g)];
  assert.ok(entries.length > 200, `expected the language list, parsed ${entries.length}`);

  const real = name => {
    try { return fs.realpathSync(path.join(DATA_DIR, `${name}.i18n.json`)); } catch { return null; }
  };
  const proven = [];
  for (const [, tag, file] of entries) {
    const written = mapping[tag] || tag;
    if (written === file) continue;
    const a = real(written);
    // Only a real, separate file proves the pull lands somewhere unread. A
    // symlink makes both names the same file, and a name with no file at all
    // says nothing about what Transifex has.
    if (a && a !== real(file)) {
      proven.push(`  tag ${tag}: a pull writes ${written}.i18n.json, the app loads ${file}.i18n.json`);
    }
  }
  assert.deepStrictEqual(proven, [],
    'a translation pulled from Transifex lands in a file WeKan never loads. Give the '
    + 'locale a lang_map entry in .tx/config, the way te_IN: te-IN does, or symlink '
    + 'the loaded name to the file the pull writes:\n' + proven.join('\n'));
});

console.log(`\ni18nLazyLoaded: ${passed} tests passed`);
