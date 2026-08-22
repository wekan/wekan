'use strict';

// Companion repos live in wekan/.tools/, and the scripts clone them there.
//
// wekan/FerretDB is a different git repository that WeKan's test runs need: the
// database conformance run builds it from source, and "Run all FerretDB tests"
// runs its own suites. It used to be cloned as a subdirectory of the repo root,
// which meant one .gitignore and .meteorignore entry per companion repo - nine
// of them, each a chance for a clone to end up in a commit or in a Meteor
// rebuild. They live in .tools/ now, one already-ignored directory.
//
// Two things have to hold for that to work, and this pins both:
//
//   * nothing still looks for a companion repo at the OLD path, and both build
//     scripts CLONE one when it is missing rather than telling the reader to;
//   * a repo inside .tools still finds its way back out - FerretDB writes its
//     logs into WeKan's log directory, and it used to get there by counting
//     "../../", which now lands one directory short.
//
// Run: node tests/toolsDirectoryRepos.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(ROOT, rel));

const sh = read('build.sh');
const bat = read('build.bat');
const conformance = read('releases/db-conformance.sh');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Comments explain the old layout on purpose.
const shCode = sh.replace(/^\s*#.*$/gm, '');
const batCode = bat.replace(/^\s*REM.*$/gim, '');
const confCode = conformance.replace(/^\s*#.*$/gm, '');

console.log('toolsDirectoryRepos:');

test('build.sh clones a companion repo into .tools, SSH then HTTPS', () => {
  assert.ok(/function ensure_tool_repo\(\)/.test(sh), 'the helper must exist');
  const at = sh.indexOf('function ensure_tool_repo()');
  const fn = sh.slice(at, sh.indexOf('\n}', at));
  assert.ok(/\$WEKAN_TOOLS_DIR\/\$name/.test(fn), 'it resolves .tools/<name>');
  assert.ok(/git clone "\$url"/.test(fn) && /git clone "\$https_url"/.test(fn),
    'SSH first - a maintainer pushes - then HTTPS, so everyone else still gets it');
  assert.ok(/\[ -d "\$dir\/\.git" \]/.test(fn),
    'and an existing clone is left alone rather than cloned over');
  // The path it prints must be usable by the caller, so nothing else may go to
  // stdout: `dir="$(ensure_tool_repo FerretDB)"`.
  const chatter = fn.split('\n').filter(l => /^\s*echo /.test(l) && !/>&2/.test(l));
  assert.deepStrictEqual(chatter, [],
    'every message must go to stderr, or it ends up in the returned path');
});

test('the .tools directory is derived from the script, not the caller\'s cwd', () => {
  assert.ok(sh.includes('WEKAN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"'),
    'a clone must not land in whatever directory somebody happened to be in');
  assert.ok(sh.includes('WEKAN_TOOLS_DIR="$WEKAN_DIR/.tools"'),
    'and .tools sits in the checkout');
});

test('build.sh prefers the repository-local Node and Meteor tools', () => {
  assert.ok(sh.includes('PATH="$WEKAN_TOOLS_DIR/.meteor:$PATH"'),
    'the installed Meteor launcher is available to every menu and direct entry');
  assert.ok(sh.includes('node-v${_wekan_node_version}-linux-${_wekan_node_arch}/bin'),
    'the exact Node version from Dockerfile is resolved under .tools');
  assert.ok(sh.includes('PATH="$_wekan_local_node:$PATH"'),
    'the repository-local Node precedes the host Node when it exists');
});

test('EVERYTHING and the conformance run both use .tools/FerretDB', () => {
  const at = shCode.indexOf('function run_everything()');
  const flow = shCode.slice(at, shCode.indexOf('\n}\n', at));
  assert.ok(/ensure_tool_repo FerretDB/.test(flow),
    'the FerretDB stage clones it if this is the first run - EVERYTHING must not '
    + 'depend on the order of its own stages');
  // Every mention of the repo's build.sh must be the .tools one - including the
  // error message, which tells the reader where it should be.
  assert.ok(!/cd FerretDB\b/.test(flow), 'nothing cds into the old repo-root path');
  assert.ok(!/cd FerretDB\b/.test(shCode), 'the direct menu dispatcher also uses .tools');
  for (const m of flow.match(/\S*FerretDB\/build\.sh/g) || []) {
    assert.ok(m.includes('.tools/'), `still names the old path: ${m}`);
  }

  assert.ok(/FERRET_DIR="\$WEKAN_DIR\/\.tools\/FerretDB"/.test(confCode),
    'db-conformance.sh builds from .tools/FerretDB');
  assert.ok(/mkdir -p "\$\(dirname "\$FERRET_DIR"\)"/.test(confCode),
    'and makes .tools before cloning into it');
});

test('build.bat clones it too, instead of telling the reader to', () => {
  assert.ok(/\.tools\\FerretDB/.test(batCode), 'Windows uses the same directory');
  assert.ok(/git clone git@github\.com:wekan\/FerretDB "%REPO%\\\.tools\\FerretDB"/.test(batCode),
    'SSH first');
  assert.ok(/git clone https:\/\/github\.com\/wekan\/FerretDB "%REPO%\\\.tools\\FerretDB"/.test(batCode),
    'then HTTPS');
  assert.ok(/cd \.tools\/FerretDB && \.\/build\.sh test-all/.test(batCode),
    'and it runs the tests from there');
  assert.ok(!/cd FerretDB &&/.test(batCode), 'nothing left at the old path');
  // git may be absent on Windows; saying so beats a cryptic failure.
  assert.ok(/git was not found/.test(bat), 'a missing git is reported');
});

test('.tools is ignored by git and by Meteor', () => {
  // The whole point of one directory: a companion repo cannot reach a commit,
  // and Meteor does not walk a second repository's node_modules on every build.
  assert.ok(/^\.tools\/$/m.test(read('.gitignore')), '.gitignore excludes .tools/');
  assert.ok(/^\/\.tools\/$/m.test(read('.meteorignore')), '.meteorignore excludes /.tools/');
});

test('a repo inside .tools still finds the WeKan log directory', () => {
  // FerretDB writes its test logs where WeKan writes its own, so "check the
  // newest test logs" stays one directory. It used to reach them by counting -
  // "$ROOT/../../log" from wekan/FerretDB - and from wekan/.tools/FerretDB the
  // same string means wekan/log, which no other run writes to. It searches for
  // the checkout now, so moving the companion repos again cannot scatter logs.
  if (!exists('.tools/FerretDB/build.sh')) {
    console.log('    (.tools/FerretDB is not cloned here - nothing to check)');
    return;
  }
  const ferret = read('.tools/FerretDB/build.sh');
  // Comments there quote the old expression to explain what moved, so compare
  // against the code.
  const ferretCode = ferret.replace(/^\s*#.*$/gm, '');
  assert.ok(!/\$ROOT\/\.\.\/\.\.\/log/.test(ferretCode),
    'counting ../ from the repo is what broke when the repo moved');
  assert.ok(/-d "\$d\/\.meteor" \] && \[ -f "\$d\/build\.sh"/.test(ferret),
    'it recognises a WeKan checkout by what is in it');
  const unit = ferret.slice(ferret.indexOf('act_unit()'), ferret.indexOf('act_test_all()'));
  assert.ok(unit.indexOf('go run generate.go') < unit.indexOf('go test -count=1'),
    'version metadata is generated before unit packages initialize');
  assert.ok(ferret.includes('logdir="$wekan_dir/.tools/log/$stamp"'),
    'a standalone companion run uses WeKan .tools/log');
  assert.ok(/WEKAN_LOGDIR/.test(ferret),
    'and a run driven by WeKan still shares that run\'s directory');
});

console.log(`\n${passed} tests passed`);
