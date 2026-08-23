'use strict';

// Every `fr-icon-<name>` the source names has to be in the vendored icon sheet,
// with its SVG file beside it.
//
// The DSFR ships 1088 icons and Jalor embarks only the ones it uses, so an icon
// class written in a template after the last vendoring run renders an empty
// square - and an empty square in a button is invisible in review. This is the
// reminder to re-run `node scripts/vendor-dsfr.mjs`.
//
// Run: node tests/jalorDsfrIcons.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('jalorDsfrIcons:');

// The same scan the vendoring script does, kept here rather than imported: a
// test that calls the code it is checking cannot catch the script drifting.
const SCAN_DIRS = ['client', 'imports', 'models', 'server', 'config', 'packages'];
const SCAN_EXT = new Set(['.jade', '.js', '.mjs', '.cjs', '.css', '.html']);

function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    // The vendored sheets name every icon they carry; scanning them would make
    // this test tautological.
    if (e.name === 'vendor' && path.basename(dir) === 'jalor') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (SCAN_EXT.has(path.extname(e.name))) out.push(full);
  }
  return out;
}

const used = new Set();
for (const d of SCAN_DIRS) {
  for (const file of walk(path.join(root, d))) {
    for (const m of fs.readFileSync(file, 'utf8').matchAll(/fr-icon-[a-z0-9-]+/g)) {
      used.add(m[0]);
    }
  }
}
used.delete('fr-icon-');

const sheet = read('client/jalor/vendor/dsfr.icons.css');

test('every icon class the source uses is in the vendored sheet', () => {
  const missing = [...used].filter(name => !sheet.includes(`.${name}:`)).sort();
  assert.deepStrictEqual(missing, [],
    'these icons are used but not vendored - run: node scripts/vendor-dsfr.mjs');
});

test('every icon the sheet carries has its SVG file', () => {
  const missing = [];
  for (const m of sheet.matchAll(/url\((\/dsfr\/icons\/[^)]+\.svg)\)/g)) {
    if (!fs.existsSync(path.join(root, 'public', m[1]))) missing.push(m[1]);
  }
  assert.deepStrictEqual([...new Set(missing)], []);
});

test('and the sheet is trimmed, not the whole 1088-icon set', () => {
  // The whole point of trimming: if this ever grows to the full set, somebody
  // has changed the script and the repository just gained 4 MB of SVG.
  const classes = new Set([...sheet.matchAll(/\.(fr-icon-[a-z0-9-]+)[:,{]/g)].map(m => m[1]));
  assert.ok(classes.size <= 120,
    `the icon sheet carries ${classes.size} icon classes; it is meant to carry the ones in use`);
  const svgCount = fs.existsSync(path.join(root, 'public/dsfr/icons'))
    ? walkSvg(path.join(root, 'public/dsfr/icons')).length
    : 0;
  assert.ok(svgCount > 0 && svgCount <= 200,
    `public/dsfr/icons holds ${svgCount} files; the DSFR ships 1088`);
});

function walkSvg(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkSvg(full, out);
    else if (full.endsWith('.svg')) out.push(full);
  }
  return out;
}

test('the icons the DSFR core sheet draws by itself are vendored too', () => {
  // The checkbox tick, the alert marks, the accordion caret, the pagination
  // arrows: components ask for these without any icon class being written, so
  // scanning the source would never find them. They were missing once.
  const core = read('client/jalor/vendor/dsfr.min.css');
  const wanted = [...core.matchAll(/url\(["']?(\/dsfr\/icons\/[^)"']+\.svg)["']?\)/g)]
    .map(m => m[1]);
  assert.ok(wanted.length > 20, `the core sheet names ${wanted.length} icons`);
  const missing = wanted.filter(u => !fs.existsSync(path.join(root, 'public', u)));
  assert.deepStrictEqual([...new Set(missing)], []);
});

console.log(`\njalorDsfrIcons: ${passed} tests passed`);
