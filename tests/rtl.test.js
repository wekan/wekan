/**
 * Test: right-to-left (RTL) language support.
 *
 * These are lightweight, dependency-free checks (Node `assert`, runnable both
 * standalone via `node tests/rtl.test.js` and under Mocha) that lock in the RTL
 * behaviour added for Arabic/Persian/Hebrew/etc.:
 *
 *   1. The set of languages flagged `rtl: true` in imports/i18n/languages.js is
 *      exactly the expected set (a guard against an accidental flag flip).
 *   2. The direction helper logic (mirrors TAPi18n.getLanguageDirection) maps
 *      each language to 'rtl' / 'ltr' correctly.
 *   3. The root <html> gets a reactive `dir`, and the client keeps it in sync.
 *   4. Component CSS stays RTL-safe: it uses CSS logical properties
 *      (margin-inline-start, inset-inline-start, text-align:start, …) instead of
 *      physical left/right longhands, so every page mirrors when `dir` flips.
 *      The only allowed physical offsets are `left/right: 50%` centering tricks
 *      (paired with transform: translate, which already work in both directions).
 *
 * The visual/placement behaviour ("text is visible and on the correct side on
 * every page") is covered by the browser test in
 * tests/playwright/specs/18-rtl-layout.e2e.js.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { parseLanguageMetadata } = require('./lib/languageRegistrySource.cjs');

// Find the repo root by walking up from process.cwd()/PWD, NOT from the bare `__dirname`
// global: this file is also loaded by `meteor test`, where referencing `__dirname` makes
// Meteor inject a `const __dirname` that collides with the one its CommonJS module wrapper
// already provides, crashing the whole server bundle at boot with "Identifier '__dirname'
// has already been declared" (same fix as server/lib/tests/dependencies.openapi.tests.js).
function findRepoRoot(marker) {
  const seeds = [process.cwd(), process.env.PWD, process.env.OLDPWD].filter(Boolean);
  for (const seed of seeds) {
    let dir = seed;
    for (let i = 0; i < 12; i += 1) {
      try { fs.accessSync(path.join(dir, marker)); return dir; } catch (e) { /* walk up */ }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  return process.cwd();
}
const repoRoot = findRepoRoot('imports/i18n/languages.js');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

// --- Parse the rtl flags straight out of languages.js -----------------------
function parseRtlFlags() {
  const src = read('imports/i18n/languages.js');
  const flags = {};
  // Compact rows are [key, code, tag, native name, rtl].
  for (const row of parseLanguageMetadata(src)) {
    flags[row[2]] = row[4];
  }
  return flags;
}

// Mirrors TAPi18n.getLanguageDirection(): rtl flag -> 'rtl' | 'ltr'.
const directionFor = isRtl => (isRtl ? 'rtl' : 'ltr');

// Recursively collect component .css files.
function cssFiles() {
  const out = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith('.css')) out.push(p);
    }
  };
  walk(path.join(repoRoot, 'client/components'));
  return out;
}

// CSS comments, blanked (line structure kept, so line numbers still point at the
// right line). A comment is prose: it explains WHY a rule is written the way it
// is, and prose that says "`left: 50%` + a -50% shift centres the same way in
// both directions" is not a physical offset - it was reported as one.
const withoutComments = css =>
  css.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

// Languages that must be written right-to-left.
const EXPECTED_RTL = [
  'ar-DZ', 'ar-EG', 'ar', 'ary', // Arabic + variants
  'fa-IR', 'fa', // Persian / Farsi
  'he-IL', 'he', // Hebrew
  'ckb', // Kurdish (Sorani)
  'ks', // Kashmiri
  'ps', // Pashto
  'sd', // Sindhi
  'ug', // Uyghur
  'ur', // Urdu
  'uz-AR', // Uzbek (Arabic script)
  'yi', // Yiddish
];

test('languages.js flags exactly the expected RTL languages', () => {
  const flags = parseRtlFlags();
  assert.ok(Object.keys(flags).length > 100, 'should parse the whole language table');

  const actualRtl = Object.keys(flags).filter(tag => flags[tag]).sort();
  assert.deepStrictEqual(
    actualRtl,
    [...EXPECTED_RTL].sort(),
    'set of rtl:true languages changed unexpectedly',
  );
});

test('direction helper maps rtl flag to the html dir value', () => {
  const flags = parseRtlFlags();
  // A few representatives from each script + a sanity LTR check.
  assert.strictEqual(directionFor(flags['ar']), 'rtl');
  assert.strictEqual(directionFor(flags['he']), 'rtl');
  assert.strictEqual(directionFor(flags['fa-IR']), 'rtl');
  assert.strictEqual(directionFor(flags['yi']), 'rtl');
  assert.strictEqual(directionFor(flags['en']), 'ltr');
  assert.strictEqual(directionFor(flags['zh-CN']), 'ltr');
  // Unknown language defaults to ltr (languages[x] is undefined -> falsy).
  assert.strictEqual(directionFor(flags['does-not-exist']), 'ltr');
});

test('tap.js exposes isRTL + getLanguageDirection', () => {
  const src = read('imports/i18n/tap.js');
  assert.ok(/isRTL\s*\(/.test(src), 'isRTL() missing from tap.js');
  assert.ok(/getLanguageDirection\s*\(/.test(src), 'getLanguageDirection() missing from tap.js');
});

test('root <html> template carries a reactive dir attribute', () => {
  // The attribute is fed by a template helper now - `dir="{{htmlDir}}"` with
  // htmlDir() in layouts.js - rather than by a global TAPi18n path in the
  // template. Both are reactive; only the helper can also give a fallback when
  // the language has no direction yet.
  const src = read('client/components/main/layouts.jade');
  assert.ok(
    /html\([^)]*dir="\{\{htmlDir\}\}"/.test(src),
    'layouts.jade <html> is missing dir="{{htmlDir}}"',
  );
  const js = read('client/components/main/layouts.js');
  assert.ok(
    /htmlDir\(\) \{\s*\n\s*return TAPi18n\.getLanguageDirection\(\) \|\| 'ltr';/.test(js),
    'htmlDir() must answer from the language direction, defaulting to ltr',
  );
});

test('client keeps document dir in sync with the language', () => {
  const src = read('client/lib/i18n.js');
  assert.ok(
    /document\.documentElement\.dir\s*=/.test(src),
    'client/lib/i18n.js does not set document.documentElement.dir',
  );
  assert.ok(
    /getLanguageDirection\s*\(/.test(src),
    'client/lib/i18n.js should derive dir from getLanguageDirection()',
  );
});

test('component CSS uses logical properties, not physical left/right longhands', () => {
  const physical = /(^|[^-\w])(margin|padding|border)-(left|right)\b|text-align\s*:\s*(left|right)\b|float\s*:\s*(left|right)\b/;
  const offenders = [];
  for (const file of cssFiles()) {
    const lines = withoutComments(read(path.relative(repoRoot, file))).split('\n');
    lines.forEach((line, i) => {
      if (physical.test(line)) {
        offenders.push(`${path.relative(repoRoot, file)}:${i + 1}: ${line.trim()}`);
      }
    });
  }
  assert.deepStrictEqual(
    offenders,
    [],
    `physical directional CSS found (use *-inline-start/-end, text-align:start/end, float:inline-start/end):\n${offenders.join('\n')}`,
  );
});

test('bare left:/right: offsets are only the allowed 50% centering tricks', () => {
  // Everything else was converted to inset-inline-start/-end. A leftover
  // `left:`/`right:` is only acceptable as a 50% centering anchor (it pairs with
  // transform: translate(-50%, …) and centers identically in LTR and RTL).
  const offsetRe = /(^|[^-\w])(left|right)\s*:\s*([^;]+);/g;
  const offenders = [];
  for (const file of cssFiles()) {
    const css = withoutComments(read(path.relative(repoRoot, file)));
    let m;
    while ((m = offsetRe.exec(css))) {
      // `!important` is not part of the value for this purpose, and `auto` is the
      // initial value: it only ever CANCELS a physical offset (the centred admin
      // popups pair `left: 50%` with `right: auto`), so it cannot be a direction
      // bug by itself.
      const value = m[3].replace(/\s*!important\s*$/, '').trim();
      if (value !== '50%' && value !== 'auto') {
        offenders.push(`${path.relative(repoRoot, file)}: ${m[2]}: ${value}`);
      }
    }
  }
  assert.deepStrictEqual(
    offenders,
    [],
    `unexpected physical left/right offsets (convert to inset-inline-start/-end):\n${offenders.join('\n')}`,
  );
});

if (typeof describe === 'function') {
  describe('RTL language support', () => {
    tests.forEach(([name, fn]) => it(name, fn));
  });
} else {
  console.log('RTL language support tests\n');
  let failed = 0;
  tests.forEach(([name, fn]) => {
    try {
      fn();
      console.log(`✓ ${name}`);
    } catch (e) {
      failed++;
      console.log(`✗ ${name}\n    ${e.message}`);
    }
  });
  console.log(`\n${tests.length - failed}/${tests.length} passed`);
  if (failed > 0) process.exitCode = 1;
}
