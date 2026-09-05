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

test('build.sh keeps dependency-install errors visible in the console and log', () => {
  assert.ok(sh.includes('(meteor update --npm || true) && meteor npm install'),
    'meteor update and npm install must remain inside the build log stream');
  assert.ok(!sh.includes('meteor update --npm 2>/dev/null'),
    'meteor update stderr must not be hidden from the console or timestamped log');
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
  assert.ok(/unit\)   NODE_OPTIONS="\$TEST_NODE_OPTIONS" meteor npm run test:unit:all \|\| rc=\$\?/.test(flow),
    'build.sh must have a bounded unit job that runs test:unit:all');
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
    'EVERYTHING (sequential): the guard + WeKan tests + all databases + FerretDB tests':
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
    'debug-speed-ferretdb.sh': 'diagnostic launcher: starts only an instrumented '
      + 'local FerretDB for a restore investigation, not a release action',
    'debug-speed-server.sh': 'diagnostic launcher: starts an instrumented local '
      + 'WeKan and FerretDB pair, not a release action',
    'debug-speed-test.sh': 'diagnostic traffic runner used with debug-speed-server.sh',
    'debug-speed-traffic.mjs': 'browser workload helper called by debug-speed-test.sh',
    'debug-speed-watch.sh': 'instrumentation helper supervised by debug-speed-server.sh',
    'run-everything.sh': 'the Tests menu runs it (EVERYTHING, sequential)',
    'db-conformance.sh': 'the Tests menu runs it (all databases)',
    'fix-changelog-hashes.sh': 'Setup -> git pull and git push both run it',
    'ensure-tools.sh': 'a helper the other scripts source, not an action',
    'translations/wrong-script.mjs': 'finds and replaces values written in a script '
      + 'that is not the language\'s own - a fault no menu option can act on in bulk, '
      + 'because each replacement is a translation somebody has to write. Run with '
      + '--count / --list / --apply while working through a language',
    'translations/sync-transifex-languages.mjs': 'audits which repository locales '
      + 'are missing from the Transifex project. Translation push scripts were '
      + 'removed because local files contain provenance-unknown direct fills; run '
      + 'this audit on its own with --dry-run or --list',
    'translations/restore-pre-machine-humans.mjs': 'a pull-translations.sh helper '
      + 'that restores the reviewed historical human values after protected-token '
      + 'markers are decoded, not a standalone menu action',
    'ferretdb/start-wekan.sh': 'runs INSIDE the built snap/bundle, not here',
    'ferretdb/wekan-entrypoint.sh': 'the Docker image entrypoint',
    'ferretdb/recovery-bridge.mjs': 'runs inside the running server',
    'ferretdb/db-ready.mjs': 'runs inside the container, from the entrypoint: it '
      + 'asks whether the database answers yet so the wait can be a page rather '
      + 'than an unbound port (#6595)',
    'ferretdb/start-wekan.bat': 'shipped INSIDE the Windows bundle, to start it',
    'build-bundle-win64.bat': 'a Windows batch script - bash cannot run it, so it '
      + 'is not a menu entry; build.bat\'s Bundles menu says to run it directly',
    'git-mirror-update.sh': 'standalone Linux/macOS mirror updater; its Windows '
      + 'counterpart cannot share one cross-platform menu entry, and each pushes '
      + 'two external mirrors rather than performing a WeKan release step',
    'git-mirror-update.bat': 'standalone Windows counterpart of '
      + 'git-mirror-update.sh, tied to the documented Windows checkout path',
    // Release-workflow helpers. These are called by
    // .github/workflows/release-all.yml, not by a person from a menu: they take
    // their input from the matrix and the environment of a build job and would
    // have nothing to do on a developer's machine. A menu entry for
    // "install a target-CPU Node.js into the container we are inside" would be
    // an entry that cannot work.
    'check-arch-binaries.sh': 'release-workflow preflight: called per build job',
    'embed-verified-node.sh': 'release-workflow: called per native build job to '
      + 'download+verify the bundled Node.js from the wekan/node fork',
    'install-node-for-arch.sh': 'release-workflow: runs inside the build container',
    'resolve-node-source.sh': 'release-workflow: a lookup the other scripts, the\n      bundle jobs and the Dockerfile call - it prints where a platform\'s Node.js\n      comes from and downloads nothing itself',
    'require-binaries.sh': 'release-workflow: called per build job',
    'record-provenance.sh': 'release-workflow: called per build job',
    'verify-release-versions.mjs': 'release-workflow guard: the bump job calls it '
      + 'after version.sh and before committing or publishing; it requires the '
      + 'workflow-selected release version and changes nothing itself',
    'apt-install.sh': 'release-workflow: how the build jobs install their\n      distribution packages - it waits out a mirror mid-republish and drops\n      the repositories the release does not use',
    'fetch.sh': 'release-workflow: the downloader every build job, and the\n      preflight, and the Dockerfile use - it waits out a 503 and tells that\n      apart from a 404, and has no release step of its own',
    'npm-retry.sh': 'release-workflow: the wrapper the build jobs run their\n      npm installs through, inside the container as well as on the runner -\n      it retries a 503 and runs no release step of its own',
    'provenance-table.sh': 'release-workflow: called by the release job',
    'release-notes.sh': 'release-workflow: prints the CHANGELOG section that is\n'
      + '      a release\'s notes, called by prepare, the release job and the notes\n'
      + '      rewrite. It exists so the text goes file-to-file and never becomes an\n'
      + '      argument or an environment variable - 172 KB of notes is past the\n'
      + '      128 KiB MAX_ARG_STRLEN, and v10.92 failed to start bash at all',
    'ferretdb-latest-tag.sh': 'release-workflow: a lookup the build jobs call so\n      the provenance table can name the version `latest` resolved to - it prints\n      a tag and downloads nothing',
    'update-website-version-info.sh': 'release-workflow helper: release-website.sh\n      and version.sh call it with the website checkout and the already-selected\n      release version; it has no standalone release action of its own',
    'prepare-variant-repo.sh': 'release-workflow helper: the Ondra/Gantt sync\n      calls it with a checked-out source, a checked-out mirror and that mirror\'s\n      package identity; it has no standalone release action',
    'repack-bundle-for-arch.sh': 'release-workflow: needs ./bundle, docker and '
      + 'QEMU already set up by the build job around it',
    'expected-assets.sh': 'release-workflow: prints what a complete release '
      + 'carries, for release-all-missing.yml to compare against',
    'prune-build-only-modules.mjs': 'release-workflow + Dockerfile: takes a BUILT\n'
      + '      bundle and removes node-gyp\'s tree from programs/server, right after\n'
      + '      the npm install that needed it - there is nothing for it to do on a\n'
      + '      developer\'s machine, and a menu entry would need a bundle to point at',
    'bump-bundle-npm-deps.mjs': 'release-workflow + Dockerfile: the same shape -\n'
      + '      it raises the npm packages inside a BUILT bundle to the minimums in\n'
      + '      bundle-npm-security-bumps.json, and is run by the build jobs',
    'prune-unreachable-npm.mjs': 'release-workflow: the same shape again - it walks\n'
      + '      a BUILT bundle\'s require graph and removes from\n'
      + '      programs/server/npm/node_modules only what it can prove nothing\n'
      + '      reaches. There is no graph to walk until a build has produced a\n'
      + '      bundle, and a menu entry would need one to point at. Run it by hand\n'
      + '      with --dry-run against .build/bundle to see what it would take',
    'changelog-archive.mjs': 'a CALENDAR job, not a build one: it keeps the\n'
      + '      current MONTH in CHANGELOG.md and moves earlier months to\n'
      + '      old-CHANGELOG/<year>/<MM>.md and finished years to\n'
      + '      old-CHANGELOG/<year>.md, so the file stays small enough to open\n'
      + '      (#6580). Run it at the start of a month; it is idempotent, so a\n'
      + '      stray run only refreshes the tables',
    'changelog-open-next.mjs': 'release-workflow: releases/release-all.sh runs it\n'
      + '      as its second step, opening the "# Upcoming WeKan ® release" section\n'
      + '      the NEXT release\'s entries belong in as soon as this one is named.\n'
      + '      Not a menu action of its own: on its own it would open a section for\n'
      + '      a release nobody is making',
    'bundle-smoke-boot.sh': 'release-workflow: starts a BUILT bundle with a\n'
      + '      database address that cannot answer and requires it to get as far as\n'
      + '      trying to reach it - which proves the whole server image loaded.\n'
      + '      Nothing to start until a build has produced a bundle. Run it by hand\n'
      + '      against .build/bundle after building',
    'bundle-trim.mjs': 'release-workflow: the same shape again - it takes a BUILT\n'
      + '      bundle and removes what the target platform cannot run (uWebSockets.js\n'
      + '      prebuilds for other OS/CPU/ABI, and every source map), which is how the\n'
      + '      Sandstorm .spk gets under its 1 GiB limit. Nothing to point it at until\n'
      + '      a build has produced a bundle',
    'append-windows-payload.mjs': 'release-workflow: windows.yml runs it to\n'
      + '      append the PUBLISHED wekan-<version>-win64.zip to the compiled\n'
      + '      launcher and write the trailer that says where that payload is and\n'
      + '      what its SHA-256 must be. There is no published ZIP to append until\n'
      + '      a release exists, so a menu entry would have nothing to point at;\n'
      + '      --verify checks an already-built EXE by hand',
    'translations/add-language.mjs': 'adds a NEW language - takes two JSON files\n'
      + '      (the strings, and the name/rtl/flag of each language) and makes the\n'
      + '      three edits CLAUDE.md requires: the data file, the languages.js entry\n'
      + '      and the flag. Run when a language is being added, with arguments a\n'
      + '      menu cannot supply',
    'translations/fill-from-local-memory.mjs': 'a guarded translation-maintenance\n'
      + '      helper: dry-run finds reusable same-language values and --write\n'
      + '      changes hundreds of language files, so it is reviewed and run directly',
    'translations/repair-machine-placeholders.mjs': 'a one-off guarded repair\n'
      + '      helper for legacy machine-filled placeholder values; run directly\n'
      + '      while auditing those values, not as a release-menu action',
    'require-ferretdb-resume-login.sh': 'a private preflight called by\n'
      + '      require-binaries.sh; it verifies a downloaded FerretDB fork before\n'
      + '      a release build and is not an operator-facing menu command',
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
  // A `!`-prefixed entry is a build.sh FUNCTION, not a script in releases/, so
  // there is nothing for the .bat to `call :rel_run`. Windows implements those
  // natively instead - `git pull` and `git push` are entries 3 and 4 of its main
  // menu, going to :gitpull and :gitpush - and the assertion below checks that
  // it really does, rather than letting a function entry silently drop out of
  // one menu. Comparing them as scripts is what made this guard fail the moment
  // "Update git" was replaced by the two that finish the job.
  // A `!` marks an entry build.sh runs itself rather than by executing a file in
  // releases/. Most are raw commands, and the .bat runs those the same way -
  // those still compare. The exception is an entry naming a build.sh FUNCTION,
  // which is shell the .bat has no way to call: Windows implements the same
  // thing natively, and the loop below checks that it does.
  const isFunction = e =>
    e.script.startsWith('!') &&
    /^[a-z][a-z0-9_]*$/.test(e.script.slice(1)) &&
    new RegExp(`^function ${e.script.slice(1)}\\(\\)`, 'm').test(sh);

  const forWindows = entries.filter(e => e.platform !== 'linux' && !isFunction(e));

  for (const e of entries.filter(x => isFunction(x) && x.platform !== 'linux')) {
    const label = e.script.slice(1).replace(/_/g, '');   // git_pull -> gitpull
    assert.ok(new RegExp(`^:${label}\\b`, 'm').test(bat),
      `build.sh offers "${e.label}" as a function; build.bat must implement :${label}`);
  }
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

test('every menu entry in build.sh dispatches to something', () => {
  // How the menu works: choose() is given "Short label|Full description" pairs,
  // shows the short labels, and sets $opt to the FULL DESCRIPTION of the one
  // picked. The big `case "$opt" in` below then matches that description STRING,
  // in full, to decide what to run.
  //
  // So the description is an identifier written twice, in two places, hundreds
  // of lines apart - and editing the menu text without editing the case arm
  // leaves an entry that matches nothing. There is no `*)` catch-all, so the
  // case simply falls through, the `for _once` loop ends, and the script EXITS:
  // the option appears to work, prints nothing, and runs nothing. That is what
  // happened to "EVERYTHING (sequential)" when its description gained the
  // floating-promises stage: picking Tests -> 1 quit the script.
  const menuStart = sh.indexOf('select cat in "Setup"');
  assert.ok(menuStart !== -1, 'the category menu must be there');
  const menuEnd = sh.indexOf('\nfor _once in 1; do', menuStart);
  assert.ok(menuEnd > menuStart, 'and the dispatcher after it');
  const block = sh.slice(menuStart, menuEnd);

  const descriptions = [...block.matchAll(/"([^"]+\|[^"]*)"\s*\\?\n/g)]
    .map(m => m[1].split('|').slice(1).join('|'));
  assert.ok(descriptions.length > 20,
    `expected the whole menu, found ${descriptions.length} entries`);

  // Every case arm of the dispatcher: `    "…")` on its own line, including the
  // `"a"|"b")` alternations.
  const arms = new Set();
  for (const m of sh.matchAll(/^\s*"([^"]+)"\)\s*$/gm)) arms.add(m[1]);
  for (const m of sh.matchAll(/^\s*((?:"[^"]+"\s*\|\s*)+"[^"]+")\)\s*$/gm)) {
    for (const a of m[1].match(/"[^"]+"/g)) arms.add(a.slice(1, -1));
  }

  const dead = descriptions.filter(d => !arms.has(d));
  assert.deepStrictEqual(dead.map(d => d.slice(0, 70)), [],
    'these menu entries match no case arm, so choosing one runs nothing and '
    + 'quits the script - the description is the identifier, and it has to be '
    + 'identical in both places');

  // And if one ever gets past this guard, the person at the menu must be told
  // rather than dropped back to the shell: the dispatcher has a catch-all.
  const dispatcher = sh.slice(menuEnd);
  assert.ok(/^\s*\*\)\s*$/m.test(dispatcher),
    'the menu case needs a *) arm, or an unmatched option exits silently');
  assert.ok(/no handler for this menu option/.test(dispatcher),
    'and it must say what went wrong');
});

test('build.bat cannot fail the same way', () => {
  // The .bat menus dispatch on the NUMBER typed, not on a description string,
  // so there is no second copy of a label to drift - and EVERYTHING there hands
  // the whole run to bash rather than reimplementing it. The two ways a .bat
  // menu CAN break are covered by the numbering and label guards above; this
  // pins the structural reason it is not exposed to the build.sh failure.
  const everything = bat.slice(bat.indexOf(':test_everything'));
  assert.ok(/bash \.\/releases\/run-everything\.sh/.test(everything.slice(0, 1200)),
    'the .bat EVERYTHING delegates to the shared script');
  for (const [choice, label] of [['1', 'two'], ['2', 'one'], ['3', 'all']]) {
    assert.ok(new RegExp(`if "%choice%"=="${choice}"\\s+goto test_everything_${label}`).test(bat),
      `EVERYTHING mode ${choice} is reached by number, not by matching a sentence`);
  }
});

test('EVERYTHING runs every test either script offers', () => {
  // "Tests -> 1" is what a maintainer runs before a release, so a check that is
  // in the Tests menu but not in EVERYTHING is a check that only runs when
  // somebody remembers it. The floating-promises guard was exactly that.
  const at = sh.indexOf('function run_everything()');
  assert.ok(at !== -1, 'run_everything must be there');
  const flow = sh.slice(at, sh.indexOf('\n}\n', at));

  assert.ok(/floating_promises_checks/.test(flow),
    'EVERYTHING must run the floating-promises guard');
  assert.ok(/run_all_tests "\$EVERYTHING_MODE"/.test(flow),
    'and WeKan\'s own suite - mocha, the node suites, import, E2E, three browsers');
  assert.ok(/db-conformance\.sh/.test(flow), 'and the database conformance run');
  assert.ok(/build\.sh test-all/.test(flow), 'and all of FerretDB\'s own tests');

  // The stage that fails must fail the run: every stage's return code is in the
  // verdict, not just the last one's.
  for (const rc of ['guard_rc', 'wekan_rc', 'conf_rc', 'ferret_rc']) {
    assert.ok(new RegExp(`\\[ \\$${rc} -eq 0 \\]`).test(flow),
      `${rc} must be part of the final verdict`);
  }

  // The guard EVERYTHING runs may not install anything or edit the working tree:
  // it runs unattended, and a run that rewrites .eslintrc.json is no longer
  // testing the commit it started from.
  const fnAt = sh.indexOf('function floating_promises_checks()');
  assert.ok(fnAt !== -1, 'the checks must be their own function, shared with the menu option');
  const fn = sh.slice(fnAt, sh.indexOf('\n}\n', fnAt));
  for (const forbidden of ['sudo', 'npm install', 'writeFileSync']) {
    assert.ok(!fn.includes(forbidden),
      `the shared checks must not ${forbidden} - only the interactive menu option may`);
  }
  assert.ok(/server\/models/.test(fn) && /checkBoardWriteAccess/.test(fn),
    'it scans server/models for unawaited board auth checks');

  // Windows hands the whole run to the same bash script rather than carrying a
  // second implementation of it.
  assert.ok(/bash \.\/releases\/run-everything\.sh/.test(bat),
    'build.bat must delegate EVERYTHING to releases/run-everything.sh');
  assert.ok(/exec \.\/build\.sh --run-everything/.test(read('releases/run-everything.sh')),
    'and that script must call build.sh --run-everything, so there is one implementation');
});

test('the first three Tests options are complete bounded execution modes', () => {
  const testsMenu = sh.slice(sh.indexOf('choose "Tests"'));
  const labels = [...testsMenu.matchAll(/^\s*"(EVERYTHING [^|"\n]+)\|/gm)]
    .slice(0, 3).map((match) => match[1]);
  assert.deepStrictEqual(labels, [
    'EVERYTHING two-worker',
    'EVERYTHING one by one',
    'EVERYTHING at once',
  ]);

  const start = sh.indexOf('function run_all_tests(){');
  const flow = sh.slice(start, sh.indexOf('\n}\n', start));
  assert.match(flow, /two-worker\) RUN_MODE=sequential; PLAYWRIGHT_WORKERS=2/);
  assert.match(flow, /sequential\) RUN_MODE=sequential/);
  assert.match(flow, /parallel\) RUN_MODE=parallel/);
  assert.match(flow, /export WEKAN_PLAYWRIGHT_WORKERS="\$PLAYWRIGHT_WORKERS"/);
  assert.match(read('tests\/playwright\/playwright.config.js'),
    /workers: Math\.max\(1, Number\(process\.env\.WEKAN_PLAYWRIGHT_WORKERS \|\| 1\)\)/);

  for (const [label, mode] of [
    ['two', 'two-worker'], ['one', 'sequential'], ['all', 'parallel'],
  ]) {
    assert.match(bat, new RegExp(`:test_everything_${label}\\s+set "WEKAN_EVERYTHING_MODE=${mode}"`));
  }
  assert.match(read('releases\/run-everything.sh'),
    /--run-everything "\$\{1:-\$\{WEKAN_EVERYTHING_MODE:-two-worker\}\}"/);
});

test('both scripts write ONE LOG PER BROWSER, not one for all three', () => {
  // CLAUDE.md's "check the newest test logs" names wekan-alltests-chromium.log,
  // -firefox.log and -webkit.log. build.sh has always written those; build.bat
  // ran the three browsers as a single Playwright invocation into one
  // wekan-alltests-browsers.log, so on Windows neither "which browser failed"
  // nor "what did WebKit print" could be answered afterwards.
  for (const b of ['chromium', 'firefox', 'webkit']) {
    assert.ok(sh.includes(`wekan-alltests-$k.log`) || sh.includes(b),
      `build.sh must know about ${b}`);
    assert.ok(bat.includes(`wekan-alltests-%~1.log`),
      'build.bat names its per-browser log from the browser argument');
    assert.ok(new RegExp(`call :start_browser_job ${b}`).test(bat),
      `build.bat must start ${b} as its own job`);
    assert.ok(new RegExp(`S_${b}`).test(bat) && new RegExp(`C_${b}`).test(bat),
      `${b} needs its own status and count in build.bat's summary`);
  }
  assert.ok(!/wekan-alltests-browsers\.log/.test(bat.replace(/^\s*REM.*$/gm, '')),
    'nothing may still write the combined browsers log (a comment may explain it)');
  // Playwright clears its output dir at startup, so three jobs need three of them.
  assert.ok(/--output=test-results\\%~1/.test(bat),
    'each browser job needs its own --output, or they wipe each other\'s traces');
  assert.ok(/--output="?\$?\{?outdir/.test(sh) || /--output=/.test(sh),
    'build.sh does the same');
});

test('a test run stops the databases it started, on every way out', () => {
  // The cleanup at the end of a run is reached when the run FINISHES. It is not
  // reached when the run is interrupted - Ctrl-C is the usual one - or when an
  // early failure returns, and then the test mongod on :3001 and the bundle
  // server on :3000 outlive it. The cost is the NEXT run: the harness reuses a
  // database that ANSWERS, so a leftover mongod is silently reused holding data
  // this run never seeded, and the failures land somewhere else entirely.
  assert.ok(/stop_test_databases\(\) \{/.test(sh), 'build.sh has one place that stops them');
  assert.ok(sh.includes("trap 'stop_test_databases; cleanup_everything_processes own; release_everything_lock' EXIT") && sh.includes("trap 'stop_test_databases; cleanup_everything_processes own; release_everything_lock; exit 130' INT TERM"),
    'and it runs on every way out, not only the happy path');
  const fn = sh.slice(sh.indexOf('stop_test_databases() {'));
  const body = fn.slice(0, fn.indexOf("trap 'stop_test_databases'"));
  assert.ok(/TEST_SERVER_PID=""/.test(body) && /MONGOD_PID=""/.test(body),
    'idempotent: each half clears its PID, so the trap firing after the normal '
    + 'call stops nothing twice');
  assert.ok(/wekan-conformance-/.test(body),
    'and the conformance containers go too - one holding 5432 or 3306 fails the '
    + 'next run before it starts');

  // cmd has no trap, so the .bat does the same clearing on the way IN.
  assert.ok(/^:stop_test_databases$/m.test(bat), 'build.bat has the same label');
  const calls = (bat.match(/call :stop_test_databases/g) || []).length;
  assert.strictEqual(calls, 4,
    'called at the start AND the end of both all-tests flows: starting from a '
    + 'clean slate is the batch answer to a trap it cannot have');
  const label = bat.slice(bat.indexOf('\n:stop_test_databases'));
  const labelBody = label.slice(0, label.indexOf('exit /b 0'));
  assert.ok(/WekanTestServer/.test(labelBody) && /WekanTestMongo/.test(labelBody),
    'stopping the same two things build.sh stops');
  assert.ok(/wekan-conformance-db-/.test(labelBody), 'and the conformance containers');
});

test('a new EVERYTHING run replaces an older complete run before starting', () => {
  const acquireAt = sh.indexOf('acquire_everything_lock || return 1');
  const stampAt = sh.indexOf('RUN_TS="$(date', acquireAt);
  assert.ok(acquireAt !== -1 && stampAt > acquireAt,
    'the old run is stopped before a new timestamp or test stage is created');
  assert.match(sh, /EVERYTHING_LOCK_DIR="\$WEKAN_DIR\/\.tools\/run-everything\.lock"/);
  assert.match(sh, /everything_process_start[\s\S]*\/proc\/\$1\/stat[\s\S]*lstart=[\s\S]*cksum/,
    'Linux, macOS and Windows record a process-start token, preventing stale PID reuse');
  assert.match(sh, /Stopping older EVERYTHING run[\s\S]*kill -TERM[\s\S]*-lt 30[\s\S]*kill -KILL/,
    'replacement is graceful first, bounded, then forced when necessary');
  assert.match(sh, /pgrep -f "\[b\]uild\\.sh --run-everything"/,
    'the first upgraded run also finds active runs created before locking existed');
  assert.match(sh, /Could not stop previous WeKan tests and databases[\s\S]*No new EVERYTHING test run was started/,
    'cleanup failure must explain why the new run exits before starting');
  assert.match(sh, /kill_meteor_on_port 3000[\s\S]*label=org\.wekan\.test-run/,
    'shared server ports and browser/database containers are stopped and verified');
  assert.match(sh, /release_everything_lock\n\treturn "\$FAILED"/,
    'a completed menu run releases ownership without waiting for build.sh to exit');
  assert.match(bat, /shared runner first stops and waits for any older EVERYTHING run/,
    'build.bat documents and uses the same replacement behavior');
});

test('test runtimes cannot inherit the build tool half-of-RAM heap', () => {
  const start = sh.indexOf('function run_all_tests(){');
  const end = sh.indexOf('\n# floating_promises_checks', start);
  const flow = sh.slice(start, end);

  assert.ok(/local TEST_HEAP_MB=\$\(\( _mem_total_mb \/ 4 \)\)/.test(flow),
    'the test-runtime allowance is computed separately from the build heap');
  assert.ok(/TEST_HEAP_MB.*-gt 4096/.test(flow),
    'the runtime heap is proportional and capped at 4 GiB');
  assert.ok(/WEKAN_TEST_NODE_OPTIONS/.test(flow), 'the test-only ceiling is overridable');
  for (const command of [
    'meteor npm run test:unit:all',
    'node tests/wekanCreator.import.test.js',
    'meteor npm run test:e2e',
    'run_pw_all_browser "$k"',
    '"$NODE_BIN" "$BUNDLE_DIR/main.js"',
  ]) {
    const escaped = command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(flow, new RegExp(`NODE_OPTIONS="\\$TEST_NODE_OPTIONS"[^\\n]*${escaped}`),
      `${command} must use the bounded test-runtime heap`);
  }
  assert.match(flow,
    /mocha\)  METEOR_LOCAL_DIR=.*meteor test --once/,
    'Meteor test keeps the larger build heap because it compiles a test application');
});

test('a Dockerfile Node bump does not hide an already installed test Node', () => {
  assert.match(sh, /node-v\*-linux-\$\{_wekan_node_arch\}/,
    'build.sh must fall back to an installed repository-local Node version');
  assert.match(sh, /sort -V \| tail -n 1/,
    'the fallback must choose the newest installed version deterministically');
  assert.match(sh, /PATH="\$_wekan_local_node:\$PATH"[\s\S]*export PATH/,
    'plain Node stages and Playwright version discovery must receive that PATH');
});


test('EVERYTHING bounds FerretDB compilation and skips the redundant dependency preload', () => {
  const start = sh.indexOf('function run_everything(){');
  const flow = sh.slice(start, sh.indexOf('\n}\n', start) + 3);
  assert.ok(/FERRET_GO_JOBS=\$\(\( _mem_total_mb \/ 4096 \)\)/.test(flow));
  assert.ok(/FERRET_GO_JOBS.*-lt 1/.test(flow) && /FERRET_GO_JOBS.*-gt 4/.test(flow));
  assert.ok(/WEKAN_FERRETDB_GOFLAGS/.test(flow) && /WEKAN_FERRETDB_GOMEMLIMIT/.test(flow));
  assert.strictEqual((flow.match(/GOFLAGS="\$FERRET_GOFLAGS" GOMEMLIMIT="\$FERRET_GOMEMLIMIT"/g) || []).length, 2);
  const conformance = read('releases/db-conformance.sh');
  assert.ok(/\.\/build\.sh build/.test(conformance));
  assert.ok(!/\.\/build\.sh deps/.test(conformance));
});
console.log(`\n${passed} tests passed`);
