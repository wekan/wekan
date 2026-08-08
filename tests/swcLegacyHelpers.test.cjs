'use strict';

// Plain-Node guard for the SWC runtime helpers the LEGACY client bundle needs.
// Run: node tests/swcLegacyHelpers.test.cjs
//
// wekan/wekan-snap#178, wekan/wekan#6534 / #6535 / #6556 / #6557: WeKan in Yandex
// Browser fails to start with
//
//   Uncaught Error: Cannot find module '@swc/helpers/_/_possible_constructor_return'
//       at a.s [as link] (…)  at client-rspack.js (…:285:985)
//
// The failing `link()` is in the copy of the rspack bundle that METEOR compiled -
// the bundle rspack writes contains no `@swc/helpers` specifier at all. Meteor put
// it there: package.json turns on `"meteor": { "modern": true }`, so Meteor 3.3+
// transpiles with SWC; babel-compiler sets `jsc.externalHelpers: true` whenever
// node_modules/@swc/helpers exists; and the `web.browser.legacy` transpile has no
// `jsc.target` and an `env.targets` down to ie 11, so `class` is lowered to ES5 and
// the output imports the helper. That specifier is not in the legacy bundle's
// module tree, so the app fails to boot - only for browsers served that bundle,
// which is why it looked Yandex-specific.
//
// Two things are pinned here.
//
//   * /.swcrc turns `jsc.externalHelpers` OFF, which is the fix: SWC inlines each
//     helper instead of importing it, so the import cannot be emitted and cannot
//     go missing. Both readers of that file merge it over their own defaults and
//     neither preserves this key, so it reaches the Meteor transpile and the rspack
//     build alike.
//   * client/lib/swcHelpers.js keeps every helper BOUND AND READ. It is not the
//     fix - it lives in the rspack graph, whose imports never become entries in
//     Meteor's module tree, which is why #6556's version of it changed nothing -
//     but `window.__wekanSwcHelpers` is the first thing to look at if this comes
//     back, and `@swc/helpers` still declares `sideEffects: false`, so an unread
//     import may be deleted.

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

test('.swcrc turns external helpers off, so the import is never emitted', () => {
  // THE fix for #6557. Without it Meteor's SWC emits
  // `import { _ } from "@swc/helpers/_/_possible_constructor_return"` into the
  // legacy bundle, where the specifier does not resolve.
  const swcrcPath = path.join(ROOT, '.swcrc');
  assert.ok(fs.existsSync(swcrcPath), '.swcrc must exist at the app root');

  const raw = fs.readFileSync(swcrcPath, 'utf8');
  // Both readers use strict JSON.parse (Meteor's babel-compiler and
  // @meteorjs/rspack's lib/swc.js), so a comment here breaks the build - and the
  // error surfaces as ".swcrc is not a valid JSON file".
  let swcrc;
  assert.doesNotThrow(() => { swcrc = JSON.parse(raw); },
    '.swcrc is parsed with JSON.parse by both readers: no comments, strict JSON');

  assert.strictEqual(swcrc.jsc && swcrc.jsc.externalHelpers, false,
    'jsc.externalHelpers must be false: with it true, SWC IMPORTS its helpers and '
    + 'the legacy bundle asks for a module that is not in it');

  // Neither reader preserves this key against the app config - Meteor's deepMerge
  // keeps jsc.target / env.targets / module.type, @meteorjs/rspack only jsc.target -
  // so setting it here is what makes it take effect. Setting one of THOSE here
  // would be silently ignored, so do not.
  for (const ignored of ['target']) {
    assert.ok(!(swcrc.jsc && ignored in swcrc.jsc),
      `jsc.${ignored} is preserved by both readers and cannot be set from .swcrc`);
  }
  assert.ok(!('env' in swcrc),
    'env.targets is preserved by Meteor: the legacy arch chooses its own targets');
});

test('.swcrc is not swallowed by the vim-swapfile ignore rule', () => {
  // .gitignore's `*.sw*` is for .swp / .swo, and it matches `.swcrc` too - so
  // `git add .swcrc` was silently a no-op and the fix would never have left the
  // working tree, which is the failure mode this whole issue has already had twice.
  const ignore = read('.gitignore');
  const rules = ignore.split(/\r?\n/).map(line => line.trim());
  assert.ok(rules.includes('*.sw*'), 'the rule that catches it is still there');
  const swStar = rules.indexOf('*.sw*');
  const negation = rules.indexOf('!.swcrc');
  assert.notStrictEqual(negation, -1, '.swcrc must be excepted from it');
  assert.ok(negation > swStar,
    'and after it: in gitignore the LAST matching pattern wins');
});

test('the big local-only clones are ignored, node included', () => {
  // Sibling repositories cloned INSIDE this working copy to be edited or built
  // from. They are whole git repos and gigabytes of source - `node/` alone is a
  // 2.2G clone of the Node.js 24.x fork WeKan builds its runtime from - and
  // untracked they are noise in every `git status` that hides the files that
  // matter.
  const rules = read('.gitignore').split(/\r?\n/).map(line => line.trim());
  // One entry, not one per repo. They were listed here by name - /FerretDB/,
  // /node/, /mongo-tools/, /mongosh/, /sandstorm/, /projects/ - each needing its
  // own .gitignore line. They are cloned into .tools/ now, which covers all of
  // them and any that come later; a name list would fail for the ones that moved
  // and stay silent about the next one.
  assert.ok(rules.includes('.tools/'),
    '.tools/ is where companion repos are cloned, and ignoring it is what keeps '
    + 'gigabytes of other projects out of git status');
  // If any of the old per-repo entries is ever re-added, it must still be rooted
  // and a directory: a bare `node` also matches `node` anywhere below - including
  // anything a package happens to call that - and a bare `node/` matches at any
  // depth. Kept because the rule is about the SHAPE of such an entry, not about
  // those particular repos.
  for (const rule of rules.filter(r => /^\/?(node|projects|sandstorm|FerretDB|mongo-tools|mongosh)\/?$/.test(r))) {
    assert.ok(rule.startsWith('/') && rule.endsWith('/'),
      `"${rule}" must be rooted and a directory, or it matches more than the clone`);
  }
  // ...and the entry says what it is, so the next reader knows why it is there.
  // This used to require the comment naming each clone - `- node/ : clone of the
  // Node.js ...` - which went with the entries themselves. What has to be
  // explained now is the one directory that replaced them.
  const ignore = read('.gitignore');
  const at = ignore.indexOf('\n.tools/');
  assert.notStrictEqual(at, -1, '.tools/ must be ignored');
  const preamble = ignore.slice(Math.max(0, at - 700), at);
  const comment = preamble.split('\n').filter(l => l.startsWith('#')).join(' ');
  assert.ok(/companion|clone/i.test(comment) && /\.tools/i.test(comment + ' .tools'),
    'the .tools/ entry must say what it holds - it is where every companion '
    + 'repository is cloned, and an unexplained ignore of a whole directory is '
    + 'the kind nobody dares remove later');
});

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

test('the file says it is a diagnostic, not the fix', () => {
  // #6556 shipped this file believing it fixed the crash, and 10.51 failed
  // identically. Whoever reads it next has to find out why from the file itself.
  assert.ok(/rspack graph/.test(helpersFile),
    'it must say that its imports go into the rspack graph, not Meteor\'s module tree');
  assert.ok(/\.swcrc/.test(helpersFile),
    'and point at /.swcrc, which is what actually fixes it');
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

  // …and this is also what makes Meteor set externalHelpers in the first place:
  // babel-compiler turns it on when node_modules/@swc/helpers exists. Removing the
  // dependency would "fix" #6557 by accident and lose the inlining choice, so the
  // choice stays explicit in .swcrc.
  assert.ok(/"modern"/.test(read('package.json')),
    'package.json still opts into the modern (SWC) transpiler, which is what emits '
    + 'the helper imports');
});

console.log(`\n${passed} tests passed`);
