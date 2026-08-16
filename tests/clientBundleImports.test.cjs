'use strict';

// What is actually IN the client bundle.
//
// package.json sets `meteor.mainModule.client`, so the client is NOT eagerly
// loaded: only what `client/main.js` reaches through imports is bundled. A file
// nobody imports is not "loaded a bit later" - it does not exist at runtime.
// That failure is silent and looks like a dead control: leftMenu.js registered
// the caret's click handler and the `isLeftMenuCollapsed` helper, nobody
// imported it, so the caret rendered and clicking it did nothing (an
// unregistered Blaze helper is simply undefined). The same thing had happened
// to adminProblems.css, which is why the Admin Panel reports lost their styling.
//
// So this walks the import graph from the entry point and pins that every
// client component file which REGISTERS something with Blaze - a template's
// events/helpers/lifecycle, a global helper, a BlazeComponent - is reachable
// from it, and that every stylesheet and template beside those components is
// reachable too.
//
// Run: node tests/clientBundleImports.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const rel = p => path.relative(root, p).split(path.sep).join('/');

// ── the import graph, from the client entry point ────────────────────────────

// `import '/x/y'`, `import a from './y'`, `export … from '…'` and the
// `require('…')` WeKan still uses in a few places. Only specifiers that name a
// file in this repo matter; a Meteor package or an npm module is not ours to
// check.
const SPECIFIER = /(?:\bimport\s[^;]*?from\s*|\bimport\s*|\bexport\s[^;]*?from\s*|\brequire\s*\()\s*['"]([^'"]+)['"]/g;
const EXTENSIONS = ['', '.js', '.jsx', '.ts', '.cjs', '.mjs', '.json', '.jade', '.css', '.styl'];

function resolve(spec, fromFile) {
  if (!spec.startsWith('/') && !spec.startsWith('.')) return null; // package
  const base = spec.startsWith('/')
    ? path.join(root, spec)
    : path.resolve(path.dirname(fromFile), spec);
  for (const ext of EXTENSIONS) {
    const candidate = base + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  for (const ext of ['.js', '.jsx', '.ts']) {
    const candidate = path.join(base, 'index' + ext);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function reachableFrom(entry) {
  const seen = new Set();
  const queue = [path.join(root, entry)];
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    // Only a JS-ish file can import anything further; a .css or .jade leaf ends
    // the walk.
    if (!/\.(js|jsx|ts|cjs|mjs)$/.test(file)) continue;
    const src = fs.readFileSync(file, 'utf8');
    let m;
    SPECIFIER.lastIndex = 0;
    while ((m = SPECIFIER.exec(src)) !== null) {
      const target = resolve(m[1], file);
      if (target && !seen.has(target)) queue.push(target);
    }
  }
  return new Set([...seen].map(rel));
}

const bundle = reachableFrom('client/main.js');

// The walk itself has to be right before anything it says means anything: if it
// resolved nothing, every file would look unreachable and the guards below
// would pass by accident.
test('the walk reaches the client entry point and what it loads', () => {
  assert.ok(bundle.has('client/main.js'), 'the entry point itself');
  for (const known of [
    'client/imports.js',
    'client/lib/utils.js',
    'client/features/settings.js',
    'client/components/settings/settingBody.js',
    'client/components/boards/boardsList.js',
  ]) {
    assert.ok(bundle.has(known), `${known} is reached`);
  }
  assert.ok(bundle.size > 300, `the graph is a whole app, not a few files (${bundle.size})`);
});

// ── a component .js that others import must bring its own template ──────────
//
// `Template.exportScopeBody.helpers(...)` at module scope throws when the
// template is not defined YET, and that does not break one popup - it stops the
// module evaluating, so every template registered after it never registers. The
// sign-in page came up with "no template passwordInput found" and a blank form.
//
// The central lists in client/features/*.js import a component's .jade before
// its .js, which is enough for a component nobody else imports. It is NOT enough
// for one that other components import: whichever module reaches it first
// evaluates it, and that can happen long before the feature list gets to the
// .jade. Such a file has to import its own template.
test('a component .js imported by other components imports its own .jade', () => {
  const strip = code => code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter(line => !/^\s*\/\//.test(line)).join('\n');

  const jsFiles = allFiles('client/components', /\.js$/);
  const importedByAnother = new Set();
  for (const file of jsFiles) {
    const code = strip(read(file));
    for (const m of code.matchAll(/(?:from|import)\s+'([^']*components\/[^']+)'/g)) {
      const spec = m[1];
      if (spec.endsWith('.jade') || spec.endsWith('.css')) continue;
      importedByAnother.add(spec.replace(/^\//, '').replace(/\.js$/, ''));
    }
  }

  const offenders = [];
  for (const file of jsFiles) {
    const key = file.replace(/\.js$/, '');
    if (!importedByAnother.has(key)) continue;
    const template = `${key}.jade`;
    if (!fs.existsSync(path.join(root, template))) continue;
    const code = strip(read(file));
    if (!/Template\.\w+\.(helpers|events|onCreated|onRendered|onDestroyed)/.test(code)) continue;
    if (!code.includes(`${path.basename(template)}`)) offenders.push(file);
  }
  assert.deepStrictEqual(offenders, [],
    'these register on a template they do not import, and are imported by another '
    + 'component - so the template may not exist yet when they run:\n  '
    + offenders.join('\n  '));
});

// ── every component that registers something with Blaze is in it ─────────────

function allFiles(dir, match) {
  const out = [];
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const p = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...allFiles(p, match));
    else if (match.test(entry.name)) out.push(p);
  }
  return out;
}

// A file that only EXPORTS helpers (say boardLabelHelpers.js) needs no import of
// its own - whoever uses it pulls it in, and if nobody does, nothing is lost.
// A file that REGISTERS something is different: its whole purpose is the side
// effect of being loaded, so it has to be reached.
const REGISTERS = [
  /Template\.\w+\.(events|helpers|onCreated|onRendered|onDestroyed)\s*\(/,
  /Template\.registerHelper\s*\(/,
  /BlazeComponent\.extendComponent\(/,
  /\.register\(['"]/,
];

test('every component that registers a template is reached from main.js', () => {
  const missing = allFiles('client/components', /\.js$/)
    .filter(f => REGISTERS.some(re => re.test(read(f))))
    .filter(f => !bundle.has(f));
  assert.deepStrictEqual(missing, [],
    'these register handlers/helpers that would never run:\n  ' + missing.join('\n  '));
});

test('every component stylesheet and template is reached from main.js', () => {
  const missing = allFiles('client/components', /\.(css|styl|jade|html)$/)
    .filter(f => !bundle.has(f));
  assert.deepStrictEqual(missing, [],
    'these would not be in the bundle:\n  ' + missing.join('\n  '));
});

// ── the negative: the guard has to FAIL when an import is dropped ────────────

test('dropping an import is caught, not shrugged off', () => {
  // The bug as it actually was: leftMenu.js present, registering the caret's
  // click handler and the isLeftMenuCollapsed helper, and imported by nobody.
  const feature = 'client/features/settings.js';
  const src = read(feature);
  const line = "import '/client/components/settings/leftMenu.js';\n";
  assert.ok(src.includes(line), 'the import under test is there to remove');

  const without = new Set(bundle);
  without.delete('client/components/settings/leftMenu.js');
  const wouldMiss = allFiles('client/components', /\.js$/)
    .filter(f => REGISTERS.some(re => re.test(read(f))))
    .filter(f => !without.has(f));
  assert.deepStrictEqual(wouldMiss, ['client/components/settings/leftMenu.js'],
    'without that import the caret file is reported unreachable');
});

console.log(`\nclientBundleImports: ${passed} tests passed`);
