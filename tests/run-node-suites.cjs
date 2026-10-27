'use strict';

// Run every plain-node test suite, and report ALL of them.
//
// This replaces the `node tests/a.cjs && node tests/b.cjs && ...` chain that
// test:unit:node used to be. npm's && stops at the FIRST failing suite, so one
// stale guard hid every suite after it: a run that printed "tests:508 fail:1"
// had actually skipped about 200 suites, and each fix only revealed the next
// one, one full test run at a time.
//
// Two consequences, both deliberate:
//   * discovery, not a list - a new tests/<name>.test.cjs is run the moment it
//     exists, so a suite can no longer be written and left unregistered;
//   * every suite runs even when an earlier one failed, and the failures are
//     listed together at the end.
//
// Each suite runs in its OWN node process (as it did before), so a suite that
// throws, exits, or leaves a handle open cannot affect the next one. Output is
// streamed live, unchanged, so the "  ok - " lines the build.sh progress counter
// reads still appear as they happen.
//
// Usage:
//   node tests/run-node-suites.cjs                 # everything
//   node tests/run-node-suites.cjs board card      # only suites matching a substring
//   node tests/run-node-suites.cjs --list          # print what would run
//   node tests/run-node-suites.cjs --bail          # stop at the first failure

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Where plain-node suites live. Anything matching in these directories runs.
// Integration suites declare their required isolated service URI and report a
// skip explicitly when it is absent. With that URI, they run in this flow too.
const SUITE_DIRS = ['tests', 'tests/unit', 'tests/integration'];
const SUITE_RE = /\.test\.(cjs|js)$/;

// Files that look like a suite here but are not run by node, WITH the reason.
// Nothing else may be skipped - a suite that is merely inconvenient must be
// fixed, not excluded, or it stops being a test.
const EXCLUDED = new Map([
  ['tests/all.test.js',
    'the Meteor mocha ENTRY POINT (imports client/lib/tests and server/lib/tests) - it runs under `meteor test`, not under node'],
]);

// A suite that hangs would otherwise hang the whole run. Generous, because some
// suites parse the entire client tree.
const SUITE_TIMEOUT_MS = Number(process.env.WEKAN_SUITE_TIMEOUT_MS) || 300000;
// Every file a suite writes goes to .tools/tmp, never /tmp or macOS's
// /var/folders: os.tmpdir() reads TMPDIR (TEMP and TMP on Windows), the same
// variables releases/tools-env.sh sets for the shell scripts.
const TOOLS_TMP = path.join(ROOT, '.tools', 'tmp');
fs.mkdirSync(TOOLS_TMP, { recursive: true });
const SUITE_ENV = { ...process.env, TMPDIR: TOOLS_TMP, TMP: TOOLS_TMP, TEMP: TOOLS_TMP };

function discoverSuites() {
  const found = [];

  for (const dir of SUITE_DIRS) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;

    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      if (!entry.isFile() || !SUITE_RE.test(entry.name)) continue;
      const rel = `${dir}/${entry.name}`;
      if (EXCLUDED.has(rel)) continue;
      found.push(rel);
    }
  }

  return found.sort();
}

function main(argv) {
  const bail = argv.includes('--bail') || process.env.WEKAN_TEST_BAIL === '1';
  const list = argv.includes('--list');
  const filters = argv.filter(a => !a.startsWith('--'));

  let suites = discoverSuites();
  if (filters.length) {
    suites = suites.filter(s => filters.some(f => s.includes(f)));
  }

  if (list) {
    suites.forEach(s => console.log(s));
    return 0;
  }

  if (!suites.length) {
    console.error(`No suites matched ${filters.join(' ') || '(nothing)'}.`);
    return 1;
  }

  const started = Date.now();
  const failures = [];
  let ran = 0;

  for (let i = 0; i < suites.length; i++) {
    const suite = suites[i];
    ran += 1;
    // One line per suite, so the log says which suite produced the lines under
    // it. "[3/258]" also makes a hang obvious: the last line names the suite.
    console.log(`\n--- [${i + 1}/${suites.length}] ${suite}`);

    const r = spawnSync(process.execPath, [suite], {
      cwd: ROOT,
      env: SUITE_ENV,
      stdio: 'inherit',
      timeout: SUITE_TIMEOUT_MS,
    });

    if (r.error && r.error.code === 'ETIMEDOUT') {
      console.error(`  FAIL - ${suite} timed out after ${SUITE_TIMEOUT_MS / 1000}s`);
      failures.push({ suite, why: `timed out after ${SUITE_TIMEOUT_MS / 1000}s` });
    } else if (r.error) {
      console.error(`  FAIL - ${suite} could not be started: ${r.error.message}`);
      failures.push({ suite, why: `could not be started: ${r.error.message}` });
    } else if (r.signal) {
      console.error(`  FAIL - ${suite} was killed by ${r.signal}`);
      failures.push({ suite, why: `killed by ${r.signal}` });
    } else if (r.status !== 0) {
      failures.push({ suite, why: `exit ${r.status}` });
    }

    if (failures.length && bail) {
      console.error(`\n--bail: stopping after ${i + 1} of ${suites.length} suites.`);
      break;
    }
  }

  const secs = Math.round((Date.now() - started) / 1000);
  const of = ran === suites.length ? '' : ` of ${suites.length}`;
  console.log(`\n===== node suites: ${ran}${of} run, ${failures.length} failed, ${secs}s =====`);

  if (failures.length) {
    // Listed together, which is the point of this runner: one run tells you
    // everything that is broken, instead of one thing per run.
    console.log('Failed suites:');
    for (const f of failures) console.log(`  x ${f.suite} (${f.why})`);
    console.log('Re-run one with: node <path>, or: meteor npm run test:unit:node -- <substring>');
  }

  return failures.length ? 1 : 0;
}

module.exports = { discoverSuites, EXCLUDED, SUITE_DIRS, SUITE_RE };

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}
