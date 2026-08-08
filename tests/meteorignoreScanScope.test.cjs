'use strict';

// What Meteor is allowed to walk when it builds.
//
// Meteor scans the app directory. It honours .meteorignore and it does NOT read
// .gitignore, so a repository cloned in beside the app is invisible to git and
// fully visible to the build - and the build pays for it twice: one inotify
// watch per directory (the limit is shared with every other watcher the user
// runs), and one ignore matcher per directory descended into, each carrying the
// whole accumulated pattern list.
//
// That second cost is what this guard exists for, because it is the one that
// killed the build rather than merely slowing it. A heap snapshot taken as
// `meteor build` died showed 945 matchers holding 14.3 million IgnoreRule
// objects - 980 MB of them, plus 667 MB of sliced strings, 308 MB of
// concatenated strings and 274 MB in 945 copies of a single 296 KB pattern
// list. About 2.5 GB of a 4.1 GB heap, and only 945 directories in. With the
// sibling clones present there were 6,867 directories to walk and roughly 1,000
// of them were WeKan; the rest were a Node.js fork checkout (4,132), FerretDB
// (9,568 before it was excluded), .tools (20,535), mongo-tools, TSC, the TSC
// website, two more WeKan checkouts and Meteor's own build output. Raising
// --max-old-space-size cannot fix that shape - the cost scales with the
// directory count, so the ceiling was never the variable.
//
// So: every top-level directory that is NOT WeKan must be excluded here. This
// guard pins the ones already known, and - the part that matters for the next
// person - fails on any NEW top-level directory that .gitignore excludes while
// .meteorignore does not, which is exactly how each of these arrived.
//
// Run: node tests/meteorignoreScanScope.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// The entries, with the comments and blank lines dropped. .meteorignore uses
// gitignore syntax, so a leading "/" anchors to the directory holding the file.
function entries(rel) {
  return read(rel)
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));
}

const meteorignore = entries('.meteorignore');
const ignored = new Set(meteorignore.map(l => l.replace(/^\/+/, '').replace(/\/+$/, '')));

console.log('meteorignoreScanScope:');

test('every foreign checkout in this directory is excluded', () => {
  // A whole other project cloned inside this working copy is thousands of
  // directories Meteor would walk on every rebuild, and for the two WeKan
  // variants it is worse than walking: they contain client/ and server/, which
  // Meteor loads EAGERLY, so leaving one in pulls a second copy of the whole app
  // into the build.
  //
  // These used to be listed here by name - FerretDB, node, mongo-tools, TSC,
  // gitea, the variants - matching one .meteorignore entry each. They live in
  // .tools/ now, one entry that covers all of them, so a list of names is a list
  // of history: it fails for the directories that moved, and says nothing about
  // the next repo somebody clones.
  //
  // What matters has not changed, so ask THAT instead: .tools is excluded, and
  // nothing at the top of this checkout that is its own git repository is left
  // for Meteor to walk.
  assert.ok(ignored.has('.tools'),
    '.tools is where companion repos live, and it is the one entry that keeps '
    + 'every one of them out of the build');

  const strays = fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(e => e.isDirectory() && e.name !== '.git')
    .filter(e => fs.existsSync(path.join(ROOT, e.name, '.git')))
    .map(e => e.name)
    .filter(name => !ignored.has(name));
  assert.deepStrictEqual(strays, [],
    'these are separate git repositories inside the checkout that .meteorignore '
    + 'does not exclude - Meteor walks every one of them on every rebuild. Clone '
    + 'companion repos into .tools/ instead');
});

test('and a variant WeKan checkout is worse than the rest, so it is caught too', () => {
  // wekan-ondra and wekan-gantt-gpl each contain client/, server/ and models/.
  // Meteor loads server/ and client/ EAGERLY, so one of those is not merely
  // scanned - leaving it in pulls a second copy of the whole app into the build.
  // They belong in .tools/ with the others, and the check above catches them
  // wherever they are (they are git repositories); this one states the case
  // separately because the consequence is different in kind, and checks the
  // stronger property: no client/ or server/ tree from another checkout is
  // reachable from the top of this one.
  const appLike = fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'client' && e.name !== 'server')
    .filter(e => fs.existsSync(path.join(ROOT, e.name, 'client'))
              && fs.existsSync(path.join(ROOT, e.name, 'server'))
              && fs.existsSync(path.join(ROOT, e.name, 'models')))
    .map(e => e.name)
    .filter(name => !ignored.has(name));
  assert.deepStrictEqual(appLike, [],
    'this is another WeKan checkout inside this one, and Meteor loads its '
    + 'client/ and server/ eagerly - a second copy of the whole app in the '
    + 'build. Keep it in .tools/');
});

test('but _build is NOT excluded - it is the handoff, not leftovers', () => {
  // The opposite assertion to the ones above, and it is here because the guard
  // originally made the wrong one. _build/ and _build-local-test/ look exactly
  // like build output that should be ignored: they are gitignored, and they are
  // the first two entries of that 296 KB pattern list. Excluding them breaks
  // the build outright, in a way that does not name .meteorignore at all:
  //
  //   error: Could not find mainModule for 'os' architecture:
  //   _build/main-prod/server-meteor.js
  //   Check the "meteor" section of your package.json file?
  //
  // rspack compiles the app INTO _build/main-prod/ (and _build/test/ for a test
  // run), and Meteor then reads server-meteor.js and client-meteor.js from
  // there as the application's main modules. Ignoring them hides the files
  // Meteor is about to be handed. They are 3 directories each, so there is
  // nothing to win by excluding them and a build to lose.
  for (const d of ['_build', '_build-local-test']) {
    assert.ok(!ignored.has(d),
      `${d} holds the mainModule Meteor reads - excluding it breaks the build`);
  }
});

test('the excludes are anchored to the repo root, not matched at any depth', () => {
  // A naked "tests/" matches a directory named tests at ANY depth and would hide
  // server/lib/tests/ and client/lib/tests/ - the Mocha suites loaded via
  // meteor.testModule - making `meteor test` report "0 passing". The same trap
  // applies to "node/" (there is no such subdirectory today, but a bare pattern
  // is a landmine) and to "log/". Everything that names a top-level directory
  // gets a leading slash.
  const unanchored = meteorignore.filter(l =>
    !l.startsWith('/') && l !== 'npm-packages/');
  assert.deepStrictEqual(unanchored, [],
    'unanchored patterns match at any depth');
});

test('every git repository cloned in here is excluded from BOTH files', () => {
  // The general rule, stated over the whole thing rather than over a list: a
  // directory with a .git of its own is ANOTHER PROJECT, so it is not WeKan's
  // source and it is not WeKan's history. It belongs in .gitignore so `git
  // status` stays readable, and in .meteorignore so the build does not walk it.
  //
  // This is the check the rest of the file cannot make. The test below derives
  // its list FROM .gitignore, so it only catches a clone that got half way; a
  // clone added to NEITHER file is invisible to it, and that is the state every
  // one of these arrived in.
  //
  // Found by walking rather than by listing, so a clone nobody thought to name
  // here is still caught.
  const skip = new Set(['node_modules', '.git', '.meteor', '.build']);
  const nested = [];
  (function walk(dir, rel, depth) {
    if (depth > 4) return;
    let items;
    try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const it of items) {
      if (!it.isDirectory() || skip.has(it.name)) continue;
      const childRel = rel ? `${rel}/${it.name}` : it.name;
      // A submodule's .git is a FILE, not a directory - existsSync covers both.
      if (fs.existsSync(path.join(dir, it.name, '.git'))) {
        nested.push(childRel);
        continue;   // do not descend: its own submodules ride along with it
      }
      walk(path.join(dir, it.name), childRel, depth + 1);
    }
  })(ROOT, '', 0);

  const notIgnoredByGit = nested.filter(d => {
    try {
      execFileSync('git', ['check-ignore', '-q', '--', d],
        { cwd: ROOT, stdio: 'ignore' });
      return false;
    } catch {
      return true;   // exit 1 = not ignored (and git missing fails loudly here)
    }
  });
  assert.deepStrictEqual(notIgnoredByGit, [],
    'cloned repositories that git would try to track - add them to .gitignore');

  // Only a TOP-LEVEL entry can be excluded by a root .meteorignore path; a repo
  // nested deeper is already covered by whichever top-level entry contains it.
  const notIgnoredByMeteor = nested
    .filter(d => !d.includes('/'))
    .filter(d => !ignored.has(d));
  assert.deepStrictEqual(notIgnoredByMeteor, [],
    'cloned repositories Meteor would still walk - add them to .meteorignore');
});

test('nothing gitignored at the top level is left for Meteor to walk', () => {
  // The general rule, so the NEXT clone dropped in here is caught by a test
  // rather than by a build running out of memory. Any top-level directory that
  // .gitignore excludes is by definition not part of the app, so Meteor has no
  // business scanning it either.
  //
  // The exceptions are the directories Meteor and npm own and handle
  // themselves - excluding those would break the build rather than speed it up.
  //
  // _build and _build-local-test are listed for the reason the test above
  // states: they are gitignored, but they hold the mainModule Meteor reads, so
  // this rule must not drag them into .meteorignore. Today .gitignore happens to
  // write them unanchored ("_build/", not "/_build/") so the filter below skips
  // them anyway - that is luck, not design, and normalising .gitignore would
  // otherwise turn this guard into the thing that breaks the build.
  const meteorOwns = new Set([
    'node_modules', '.meteor', '.build', '.git',
    '_build', '_build-local-test',
  ]);

  const gitignored = entries('.gitignore')
    .filter(l => l.startsWith('/') && l.endsWith('/') && !l.startsWith('/*'))
    .map(l => l.replace(/^\/+/, '').replace(/\/+$/, ''));

  const unguarded = [...new Set(gitignored)]
    .filter(d => !meteorOwns.has(d))
    .filter(d => !ignored.has(d))
    // Only what is actually here: .gitignore names clones that a given checkout
    // may not have, and a guard that demands .meteorignore list directories
    // that do not exist would fail on a clean CI checkout.
    .filter(d => fs.existsSync(path.join(ROOT, d)));

  assert.deepStrictEqual(unguarded, [],
    'top-level directories git ignores but Meteor would still scan - add them ' +
    'to .meteorignore, or to meteorOwns here if Meteor genuinely needs them');
});

console.log(`meteorignoreScanScope: ${passed} passed`);
