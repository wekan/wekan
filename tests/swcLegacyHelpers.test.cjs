'use strict';

// Plain-Node guard for the SWC runtime helpers the LEGACY client bundle needs.
// Run: node tests/swcLegacyHelpers.test.cjs
//
// wekan/wekan-snap#178: WeKan 10.44 in Yandex Browser failed to start with
//
//   Cannot find module '@swc/helpers/_/_possible_constructor_return'
//
// An older browser is served `web.browser.legacy`, where SWC compiles classes to
// ES5 and emits imports of its own helpers. The built legacy bundle contained
// `link("@swc/helpers/_/_possible_constructor_return", …)` - the app asks for it -
// while the module tree beside it held 22 helper directories and not that one:
// Meteor's scanner includes an npm package's files from the imports it can SEE,
// and these imports are written by the transform AFTERWARDS. `_call_super` came
// in through another helper's relative require; `_possible_constructor_return`
// did not, so exactly one was missing and the whole app failed to load.
//
// client/lib/swcHelpers.js imports them from ordinary client code, which the
// scanner does see. This checks that the file is loaded first, that every helper
// it names exists in the installed package (a typo would be a silent no-op), and
// that the one from the report is among them.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const helpersFile = read('client/lib/swcHelpers.js');
const mainFile = read('client/main.js');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok -', name);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

// The bindings, not bare imports. `@swc/helpers` declares `"sideEffects": false`,
// so a bundler may DELETE `import '@swc/helpers/_/_x';` outright - which is what
// happened: the first fix compiled to nothing and 10.45 failed exactly as before
// (#6556). Each helper has to be bound and read.
const imported = [...helpersFile.matchAll(
  /import \{ _ as (\w+) \} from '@swc\/helpers\/_\/(\w+)';/g)];
const boundNames = imported.map(m => m[1]);
const helperPaths = imported.map(m => m[2]);

console.log('swcLegacyHelpers:');

test('the helper the report names is imported', () => {
  assert.ok(helperPaths.includes('_possible_constructor_return'),
    'the missing one from the reports');
  // Its neighbours in the ES5 class transform: if one of these is dropped, the
  // same failure comes back with a different name in the message.
  for (const helper of ['_class_call_check', '_create_class', '_inherits',
    '_call_super', '_get_prototype_of', '_assert_this_initialized']) {
    assert.ok(helperPaths.includes(helper), `${helper} is part of the same transform`);
  }
  assert.ok(helperPaths.length >= 30,
    `expected the ES5 class/iteration/async set, found ${helperPaths.length}`);
});

test('every import is USED, or the bundler is allowed to delete it', () => {
  // This is the whole reason #6556 exists: side-effect-only imports of a package
  // that declares `sideEffects: false` are removable, and were removed.
  // On the CODE: the comment at the top of that file QUOTES the old bare form to
  // explain why it does not work, and a guard that reads comments as code fails
  // on its own explanation.
  const code = helpersFile
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  assert.ok(!/import '@swc\/helpers/.test(code),
    'no bare side-effect import may come back');

  const at = helpersFile.indexOf('const SWC_RUNTIME_HELPERS = [');
  assert.notStrictEqual(at, -1, 'the bindings are collected somewhere readable');
  const list = helpersFile.slice(at, helpersFile.indexOf('];', at));

  const unused = boundNames.filter(name => !new RegExp(`\\b${name}\\b`).test(list));
  assert.deepStrictEqual(unused, [], 'these bindings are imported and never read');

  // …and the list itself has to end somewhere observable, or reading it is dead
  // code too.
  assert.ok(/window\.__wekanSwcHelpers = /.test(helpersFile),
    'the collected helpers are written somewhere the optimizer must keep');

  // The package's own declaration is what makes this necessary - if it ever stops
  // saying that, this test should be revisited rather than silently kept.
  const pkgPath = path.join(ROOT, 'node_modules/@swc/helpers/package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    assert.strictEqual(pkg.sideEffects, false,
      '@swc/helpers still declares sideEffects: false, which is why the bindings must be used');
  }
});

test('every helper it names actually exists in @swc/helpers', () => {
  // A typo here is a silent no-op at build time and the same crash at runtime.
  const pkg = path.join(ROOT, 'node_modules/@swc/helpers/_');
  if (!fs.existsSync(pkg)) {
    console.log('    (skipped: @swc/helpers is not installed in this checkout)');
    return;
  }

  const missing = helperPaths.filter(h => !fs.existsSync(path.join(pkg, h, 'package.json')));
  assert.deepStrictEqual(missing, [], 'these helper subpaths do not exist');
});

test('it is loaded before anything that could be transformed', () => {
  const at = mainFile.indexOf("import '/client/lib/swcHelpers'");
  assert.notStrictEqual(at, -1, 'client/main.js must import it');
  const app = mainFile.indexOf("import '/client/imports'");
  assert.ok(at < app, 'before the application code');
  const styles = mainFile.indexOf("import '/client/styles'");
  assert.ok(at < styles, 'and before the styles');
});

test('@swc/helpers is a real dependency, not a transitive one', () => {
  const pkg = JSON.parse(read('package.json'));
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  assert.ok(deps['@swc/helpers'],
    'the bundle imports it directly, so it must be declared directly');
});

console.log(`\n${passed} tests passed`);
