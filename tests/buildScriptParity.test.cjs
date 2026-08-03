'use strict';

// build.sh and build.bat are the same menu on two platforms, and build.sh is the
// one that gets used - so build.bat drifts behind it silently. Two things are
// checked here, both of which had gone wrong:
//
//   * the test runs must ALWAYS delete .build and build WeKan first. Both scripts
//     built only when the bundle was MISSING, which is precisely the case where a
//     bundle exists but is stale: the suite then passes or fails on code that is
//     no longer in the working tree.
//   * every menu entry build.sh offers must exist in build.bat. Two were missing:
//     the dev server's custom port + ROOT_URL host, and "Install Playwright
//     browsers".
//
// Run: node tests/buildScriptParity.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const sh = read('build.sh');
const bat = read('build.bat');

console.log('buildScriptParity:');

test('build.sh builds before the tests, every time', () => {
  const at = sh.indexOf('function run_all_tests()');
  assert.ok(at !== -1, 'the ALL-tests flow must be there');
  const flow = sh.slice(at, sh.indexOf('\n}\n', at));
  const build = flow.indexOf('build_wekan');
  assert.ok(build !== -1, 'it must build');
  // Unconditionally: not inside an `if [ ! -d .build/bundle ]` guard.
  assert.ok(!/if \[ ! -d \.build\/bundle \][^\n]*\n\s*echo[^\n]*\n\s*build_wekan/.test(flow),
    'building only when the bundle is MISSING leaves a stale bundle in place');
  assert.ok(/Deleting \.build and building WeKan before running the tests/.test(flow),
    'and it says so');
  // build_wekan is what deletes .build. Searched over the whole function, not
  // its first 400 characters: that window was an accident of how long the
  // comment above the rm happened to be, and it broke the moment build_wekan
  // gained an explanation of where its log goes. What matters is that the
  // function deletes .build, not how far down the line sits.
  const fnStart = sh.indexOf('function build_wekan()');
  assert.ok(fnStart > 0, 'build_wekan exists');
  const fnEnd = sh.indexOf('\n}', fnStart);
  const fn = sh.slice(fnStart, fnEnd > 0 ? fnEnd : undefined);
  assert.ok(/rm -rf [^\n]*\.build/.test(fn), 'build_wekan deletes .build');
  // The server it starts is the bundle, so the freshness matters.
  assert.ok(/serves Node E2E \+ Playwright browser tests\. Built fresh above/.test(flow),
    'the description must not still promise the old bundle is reused');
});

test('build.bat does the same, in both of its ALL-tests flows', () => {
  assert.ok(/^:rebuild_for_tests/m.test(bat), 'the subroutine must exist');
  const sub = bat.slice(/^:rebuild_for_tests/m.exec(bat).index);
  assert.ok(/rmdir \/s \/q "%REPO%\\\.build"/.test(sub.slice(0, 900)), 'it deletes .build');
  assert.ok(/call meteor build \.build --directory/.test(sub.slice(0, 900)), 'and builds');
  assert.ok(/main\.js is missing after building/.test(sub.slice(0, 1200)),
    'and refuses to run the tests without a bundle');
  for (const label of [':test_all_parallel', ':test_all_sequential']) {
    const flow = bat.slice(bat.indexOf(label), bat.indexOf('call :start_bundle_server',
      bat.indexOf(label)));
    assert.ok(/call :rebuild_for_tests/.test(flow),
      `${label} must rebuild before starting the test server`);
    assert.ok(/if errorlevel 1 goto end/.test(flow.slice(flow.indexOf('call :rebuild_for_tests'))),
      `${label} must stop when the build failed`);
  }
  assert.ok(!/No recompile: your existing build is reused/.test(bat));
});

test('"Run ALL tests" really runs all of them, in both scripts', () => {
  // The node suites - test:unit:all, i.e. the ~165 .cjs guards plus the sticker /
  // Trello / OAuth2 .js tests - were in package.json and in no test RUN: the flow
  // ran mocha, import, e2e and the three browsers only. A guard that never runs
  // guards nothing.
  const flow = sh.slice(sh.indexOf('function run_all_tests()'));
  assert.ok(/unit\)   meteor npm run test:unit:all \|\| rc=\$\?/.test(flow),
    'build.sh must have a unit job that runs test:unit:all');
  assert.ok(/launch_job unit/.test(flow), 'and launch it');
  for (const keys of flow.match(/ALLKEYS="[^"]+"/g) || []) {
    assert.ok(/\bunit\b/.test(keys), `${keys} must include the unit job`);
  }
  assert.ok(/unit\) echo "Unit tests \(node\)" ;;/.test(flow), 'labelled in the summary');
  assert.ok(/unit\) n=\$\(grep -cE '\^\\s\*ok - '/.test(flow),
    'and counted - the node suites print "  ok - <name>", not a check mark');

  // build.bat: both flows start it, wait for it and report it.
  assert.ok((bat.match(/start "Wekan unit"/g) || []).length === 2,
    'both .bat flows must start the unit job');
  assert.ok(/call :seq_run_wait unit unit C_unit/.test(bat), 'sequential waits for it');
  assert.ok(/if not exist "\.done-unit" set "ALLDONE=0"/.test(bat), 'parallel waits for it');
  assert.ok((bat.match(/call :report "!S_unit!"/g) || []).length === 2,
    'and both summaries report it');
  assert.ok(/:jcount_unit/.test(bat), 'with a counter that understands its output');
  assert.ok(/call meteor npm run test:unit:all/.test(bat), 'running the same script');
});

test('every menu entry of build.sh exists in build.bat', () => {
  // build.sh's entries are "Label|description" pairs passed to choose().
  const labels = [...sh.matchAll(/^\s*"([^"|]+)\|[^"]*"\s*\\?$/gm)].map(m => m[1].trim());
  assert.ok(labels.length > 20, `expected the whole menu, found ${labels.length}`);
  // How each one is spelled in the .bat menu (same words, or the closest thing
  // Windows offers). A label missing from BOTH lists is a real parity gap.
  const spelling = {
    'localhost:3000 + trace warnings': 'trace warnings',
    'localhost:3000 + bundle visualizer': 'bundle visualizer',
    'CURRENT-IP:3000 + MONGO_URL 27019': 'MONGO_URL 27019',
    'Mocha (server-side)': 'Mocha',
    // The .bat menu escapes its parentheses (echo 1^) EVERYTHING ^(sequential^)),
    // so the label is compared without them.
    'EVERYTHING (sequential): WeKan tests + all databases + FerretDB tests':
      'EVERYTHING ^(sequential^)',
    'FerretDB v1 MySQL (experimental)': 'FerretDB v1 MySQL',
    'FerretDB v1 MariaDB (experimental)': 'FerretDB v1 MariaDB',
    'FerretDB v1 SAP HANA (experimental)': 'FerretDB v1 SAP HANA',
    // The Docker backends are named slightly differently in the two menus; what
    // must match is the compose file each one starts, which is checked below.
    'FerretDB v2 (PostgreSQL)': 'ferretdb-v2-postgresql',
  };
  const missing = labels.filter(label => {
    const needle = spelling[label] || label;
    return !bat.includes(needle);
  });
  assert.deepStrictEqual(missing, [],
    'build.bat is missing menu entries build.sh has - it is the one that drifts');
});

test('both offer the same Docker backends, by compose file', () => {
  // The labels differ ("FerretDB v2 (PostgreSQL)" vs "FerretDB v2 Postgres");
  // the file each one starts is the thing that must not drift.
  const files = s => [...s.matchAll(/docker-compose[\w.-]*\.yml/g)].map(m => m[0]);
  const inSh = new Set(files(sh));
  const inBat = new Set(files(bat));
  const missing = [...inSh].filter(f => !inBat.has(f));
  assert.deepStrictEqual(missing, [], 'a backend build.sh can start and build.bat cannot');
});

test('the .bat menus number what they dispatch', () => {
  // A menu that prints 1..12 but dispatches 1..11 silently drops an entry - which
  // is how a parity gap survives being "added".
  for (const menu of ['menu_dev', 'menu_tests', 'menu_setup', 'menu_tools']) {
    const start = bat.indexOf(`:${menu}`);
    assert.ok(start !== -1, `${menu} must exist`);
    const block = bat.slice(start, bat.indexOf(`goto ${menu}`, start + menu.length));
    const printed = [...block.matchAll(/echo\s+(\d+)\^\)/g)].map(m => Number(m[1]));
    const dispatched = [...block.matchAll(/if "%choice%"=="(\d+)"/g)]
      .map(m => Number(m[1])).filter(n => n !== 0);
    assert.deepStrictEqual(dispatched, printed, `${menu}: printed and dispatched differ`);
  }
});

test('every goto/call in build.bat has a label to land on', () => {
  const labels = new Set([...bat.matchAll(/^:(\w+)/gm)].map(m => m[1].toLowerCase()));
  const targets = new Set([
    ...[...bat.matchAll(/goto\s+(\w+)/g)].map(m => m[1].toLowerCase()),
    ...[...bat.matchAll(/call\s+:(\w+)/g)].map(m => m[1].toLowerCase()),
  ]);
  targets.delete('end');
  targets.delete('eof');
  const missing = [...targets].filter(t => !labels.has(t));
  assert.deepStrictEqual(missing, [], 'a goto with no label falls through to the next line');
});

test('every script in releases/ is reachable from BOTH menus', () => {
  // releases/ holds ~90 maintainer scripts and, before this, four of them were
  // in a menu: the rest existed only for whoever remembered the file name. Each
  // one is now a line in build.sh's RELEASE_SCRIPTS and a `call :rel_run` in
  // build.bat, and this is what keeps a NEW script from being added to the
  // directory and to neither menu.
  const dir = path.join(__dirname, '..', 'releases');
  const files = [];
  const walk = (rel) => {
    for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(r);
      else if (/\.(sh|mjs|bat)$/.test(e.name)) files.push(r);
    }
  };
  walk('');

  // Deliberately not in the Releases menu, each for a stated reason. A script
  // added here must be given one.
  const SKIP = {
    'run-everything.sh': 'the Tests menu runs it (EVERYTHING, sequential)',
    'db-conformance.sh': 'the Tests menu runs it (all databases)',
    'fix-changelog-hashes.sh': 'Setup -> Update git runs it',
    'ensure-tools.sh': 'a helper the other scripts source, not an action',
    'ferretdb/start-wekan.sh': 'runs INSIDE the built snap/bundle, not here',
    'ferretdb/wekan-entrypoint.sh': 'the Docker image entrypoint',
    'ferretdb/recovery-bridge.mjs': 'runs inside the running server',
    'ferretdb/start-wekan.bat': 'shipped INSIDE the Windows bundle, to start it',
    'old-build-bundle-arm64.sh': 'superseded by build-bundle-arm64.sh',
    'translations/old-pull-translations.sh': 'superseded by pull-translations.sh',
    'build-bundle-win64.bat': 'a Windows batch script - bash cannot run it, so it '
      + 'is not a menu entry; build.bat\'s Bundles menu says to run it directly',
    // Release-workflow helpers. These are called by
    // .github/workflows/release-all.yml, not by a person from a menu: they take
    // their input from the matrix and the environment of a build job and would
    // have nothing to do on a developer's machine. A menu entry for
    // "install a target-CPU Node.js into the container we are inside" would be
    // an entry that cannot work.
    'check-arch-binaries.sh': 'release-workflow preflight: called per build job',
    'install-node-for-arch.sh': 'release-workflow: runs inside the build container',
    'require-binaries.sh': 'release-workflow: called per build job',
    'record-provenance.sh': 'release-workflow: called per build job',
    'provenance-table.sh': 'release-workflow: called by the release job',
  };

  const missing = { sh: [], bat: [] };
  for (const f of files) {
    if (SKIP[f]) continue;
    if (!sh.includes(`releases/${f}`)) missing.sh.push(f);
    if (!bat.includes(`releases/${f}`)) missing.bat.push(f);
  }
  assert.deepStrictEqual(missing.sh, [], 'scripts build.sh cannot run');
  assert.deepStrictEqual(missing.bat, [], 'scripts build.bat cannot run');
});

test('the Releases menu is the same list, in the same order, in both scripts', () => {
  const arr = /^RELEASE_SCRIPTS=\(([\s\S]*?)^\)$/m.exec(sh);
  assert.ok(arr, 'build.sh must define RELEASE_SCRIPTS');
  const entries = arr[1].trim().split('\n').map(l => l.trim().replace(/^"|"$/g, ''))
    .filter(Boolean).map(l => {
      const [group, label, script, prompt, platform, key] = l.split('|');
      return { group, label, script, prompt, platform, key };
    });
  assert.ok(entries.length > 50, `expected the whole list, found ${entries.length}`);

  // Same entries, same order, in the .bat's dispatch lines - EXCEPT the ones
  // marked linux: systemd, ufw, snap and multipass are things Windows cannot do
  // at all, so offering them there would be a menu entry that can only fail.
  const forWindows = entries.filter(e => e.platform !== 'linux');
  const inBat = [...bat.matchAll(/call :rel_(?:run|cmd) "([^"]+)" "([^"]*)"/g)]
    .map(m => ({ what: m[1], prompt: m[2] }));
  assert.deepStrictEqual(inBat.map(e => e.what),
    forWindows.map(e => e.script.replace(/^!/, '')),
    'build.bat runs a different set of entries, or in a different order');
  assert.deepStrictEqual(inBat.map(e => e.prompt), forWindows.map(e => e.prompt),
    'an entry that needs an argument in one menu must ask for it in the other');
  for (const e of entries.filter(x => x.platform === 'linux')) {
    assert.ok(!bat.includes(e.script.replace(/^!/, '')),
      `build.bat offers "${e.label}", which Windows cannot run`);
  }

  // Every group has a labelled submenu on the Windows side.
  for (const group of new Set(entries.map(e => e.group))) {
    const label = `:rel_${group.toLowerCase().replace(/[^a-z0-9]+/g, '')}`;
    assert.ok(bat.includes(label), `build.bat has no ${label} submenu for "${group}"`);
  }
});

test('both scripts run an entry from the command line, not only from the menu', () => {
  // The point: a release, a bundle build or a translation pull can go into a
  // script or a cron entry. `./build.sh release-snap 10.50` is the same thing
  // the menu would run, with the argument it would have asked for.
  assert.ok(/^cli_run\(\) \{/m.test(sh), 'build.sh has a command-line dispatcher');
  assert.ok(/-h\|--help\|help\)\s+cli_help/.test(sh), 'and --help');
  assert.ok(/-l\|--list\|list\)/.test(sh), 'and --list');
  assert.ok(/no command called/.test(sh), 'and says so when the name is unknown');
  // An unknown name must not silently do nothing.
  assert.ok(/return 2/.test(sh.slice(sh.indexOf('cli_run() {'))), 'with a non-zero exit');

  assert.ok(/^:cli_run/m.test(bat), 'build.bat has one too');
  assert.ok(/^:cli_help/m.test(bat) && /^:cli_list/m.test(bat), 'with help and list');
  assert.ok(/if \/I "%~1"=="--help" goto cli_help_exit/.test(bat),
    'dispatched before the menu, from the real command line');
  assert.ok(/exit \/b 2/.test(bat), 'and a non-zero exit for an unknown name');

  // Every name the .sh answers to, the .bat answers to as well (minus the
  // linux-only entries, which are not in the Windows menu either).
  const arr = /^RELEASE_SCRIPTS=\(([\s\S]*?)^\)$/m.exec(sh)[1];
  const keys = arr.trim().split('\n').map(l => l.trim().replace(/^"|"$/g, ''))
    .filter(Boolean).map(l => {
      const [, , what, , platform, key] = l.split('|');
      const derived = what.split(' ')[0].split('/').pop().replace(/\.[^.]+$/, '');
      return { key: key || derived, platform };
    });
  const missing = keys.filter(k => k.platform !== 'linux'
    && !new RegExp(`"%K%"=="${k.key}"`).test(bat)).map(k => k.key);
  assert.deepStrictEqual(missing, [], 'names build.sh answers to and build.bat does not');

  // The examples in both help texts must be real names, or they teach a command
  // that fails.
  // The examples, not the four usage lines above them (--help, --list,
  // --run-everything and the bare "<name>" placeholder).
  const helpNames = [...sh.matchAll(/^  \.\/build\.sh ([a-z0-9][a-z0-9-]+)/gm)]
    .map(m => m[1]).filter(n => n !== 'run-everything');
  const known = new Set(keys.map(k => k.key));
  for (const n of helpNames) {
    assert.ok(known.has(n), `./build.sh --help gives an example "${n}" that is not a command`);
  }
});

console.log(`\n${passed} tests passed`);
