'use strict';

// Guard: every bare import in the app is something that actually exists.
// Run: node tests/importsResolve.test.cjs
//
// `import moment from 'moment'` broke the client build outright:
//
//   ERROR in ./client/components/history/historyTable.js
//     × Module not found: Can't resolve 'moment'
//
// moment was removed from WeKan and replaced with native Date helpers
// (imports/i18n/moment.js says so), so it is not in package.json and nothing
// resolves it. The import LOOKED completely ordinary - it is the single most
// familiar line in a JavaScript file - and no amount of reading the diff would
// have shown it, because what was wrong was somewhere else entirely: the
// dependency list.
//
// A full `meteor build` finds this in about two minutes. This finds it in under
// a second, which is the difference between noticing while writing the file and
// noticing after handing the work over.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { builtinModules } = require('node:module');

const ROOT = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

const DECLARED = new Set([
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
  ...Object.keys(pkg.optionalDependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
]);
const BUILTIN = new Set([...builtinModules, ...builtinModules.map(m => `node:${m}`)]);

/* The app's own code. Not tests, not tooling, not vendored trees. */
const DIRS = ['client', 'models', 'imports', 'server'];

let passed = 0;
const test = (name, run) => {
  run();
  passed++;
  if (process.env.VERBOSE) console.log(`  ok - ${name}`);
};

function sourceFiles(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, out);
    else if (/\.(js|jsx|mjs|cjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

/* Strip comments and strings-in-comments so a quoted example is not an import. */
function code(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '');
}

/*
 * The specifier of every static import and every require() of a literal.
 * Dynamic `import(variable)` and `require(variable)` are skipped: there is no
 * specifier to check, and Meteor's own module loader uses them.
 */
function specifiers(text) {
  const found = [];
  const patterns = [
    /^\s*import\s+[^'"]*?from\s*['"]([^'"]+)['"]/gm,
    /^\s*import\s*['"]([^'"]+)['"]/gm,
    /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
    /^\s*export\s+[^'"]*?from\s*['"]([^'"]+)['"]/gm,
  ];
  for (const pattern of patterns) {
    for (const m of text.matchAll(pattern)) found.push(m[1]);
  }
  return found;
}

const packageOf = specifier => {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
};

/*
 * The question the build asks is "can this be resolved", not "is it declared".
 * So this asks the same question, against the real node_modules: a package that
 * is installed resolves and the build is fine, whether or not package.json
 * names it directly. `moment` fails because it is not installed at all.
 */
function isResolvable(specifier) {
  if (specifier.startsWith('.') || specifier.startsWith('/')) return true;
  if (specifier.startsWith('meteor/')) return true;   // Meteor's own resolver
  if (BUILTIN.has(specifier)) return true;
  const name = packageOf(specifier);
  if (DECLARED.has(name)) return true;
  try {
    require.resolve(`${name}/package.json`, { paths: [ROOT] });
    return true;
  } catch {
    try {
      require.resolve(name, { paths: [ROOT] });
      return true;
    } catch {
      return false;
    }
  }
}

const FILES = DIRS.flatMap(dir => sourceFiles(path.join(ROOT, dir)));

test('there is app source to check', () => {
  assert.ok(FILES.length > 300, `expected the whole app, found ${FILES.length} files`);
});

// THE regression.
test('every bare import names a package the project declares', () => {
  const unresolvable = [];
  for (const file of FILES) {
    const text = code(fs.readFileSync(file, 'utf8'));
    for (const specifier of specifiers(text)) {
      if (!isResolvable(specifier)) {
        unresolvable.push(`${path.relative(ROOT, file)}: '${specifier}'`);
      }
    }
  }
  assert.deepEqual(unresolvable, [],
    'these cannot be resolved by the bundler, and the build fails on them:\n  ' +
    unresolvable.join('\n  '));
});

// Specifically the one that broke, so the reason is recorded where the next
// person meets it rather than only in a commit message.
test('moment is gone and stays gone (negative)', () => {
  assert.ok(!DECLARED.has('moment'),
    'moment was removed in favour of native Date helpers; re-adding it as a ' +
    'dependency should be a deliberate decision, not a way to make an import work');
  const importers = [];
  for (const file of FILES) {
    const text = code(fs.readFileSync(file, 'utf8'));
    if (specifiers(text).some(s => s === 'moment' || s.startsWith('moment/'))) {
      importers.push(path.relative(ROOT, file));
    }
  }
  assert.deepEqual(importers, [],
    'imports/i18n/moment.js: "moment.js has been removed and replaced with ' +
    'native JavaScript Date functions". Use formatDateTime from ' +
    '/imports/lib/dateUtils instead.');
});

// Resolving is what the build needs; DECLARING is what protects it tomorrow. A
// package the app imports directly but does not name is there only because
// something else happens to depend on it, and disappears when that dependency
// changes. These two are the ones that predate this test - the list is pinned so
// it cannot quietly grow, not because it is fine.
test('the set of imported-but-undeclared packages does not grow', () => {
  const undeclared = new Set();
  for (const file of FILES) {
    const text = code(fs.readFileSync(file, 'utf8'));
    for (const specifier of specifiers(text)) {
      if (specifier.startsWith('.') || specifier.startsWith('/')) continue;
      if (specifier.startsWith('meteor/') || BUILTIN.has(specifier)) continue;
      const name = packageOf(specifier);
      if (!DECLARED.has(name)) undeclared.add(name);
    }
  }
  assert.deepEqual([...undeclared].sort(), ['body-parser', 'mime-types'],
    'a new entry here is a direct dependency that package.json does not name: ' +
    'it works today only because something else pulls it in');
});

// The replacement is a real export, not a second thing that only looks right.
test('the date helper the app does have is importable', () => {
  const utils = fs.readFileSync(path.join(ROOT, 'imports/lib/dateUtils.js'), 'utf8');
  for (const name of ['formatDateTime', 'formatDate']) {
    assert.match(utils, new RegExp(`export function ${name}\\(`),
      `${name} must exist for the files that import it`);
  }
});

console.log(`importsResolve: ${passed} tests passed`);
