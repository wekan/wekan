'use strict';
// build.sh and build.bat: Tests -> "Playwright single spec", and
// ./build.sh --playwright-spec <spec> [browser] [title filter]. One spec, on the
// browsers chosen, against a server that already runs or one built and started
// for it - the same server the whole-suite runs start, so a single spec does not
// pass on a stale bundle.
// Run: node --test tests/playwrightSingleSpec.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const sh = fs.readFileSync(path.join(root, 'build.sh'), 'utf8');
const bat = fs.readFileSync(path.join(root, 'build.bat'), 'utf8');
const fn = name => {
  const start = sh.indexOf(`function ${name}(){`);
  assert.ok(start >= 0, name);
  return sh.slice(start, sh.indexOf('\n}\n', start) + 3);
};

// The matcher, run as bash runs it.
function match(want) {
  // The name goes in through the environment, not into the script text.
  const r = spawnSync('bash', ['-c', `${fn('playwright_specs_matching')}\nplaywright_specs_matching "$WANT"`],
    { encoding: 'utf8', env: { ...process.env, WEKAN_DIR: root, WANT: want } });
  return r.stdout.trim().split('\n').filter(Boolean);
}

test('a spec is found by its file, its path, or a part of its name', () => {
  for (const want of ['rest-card-list-fields.e2e.js', 'specs/rest-card-list-fields.e2e.js',
    'tests/playwright/specs/rest-card-list-fields.e2e.js', 'rest-card-list-fields']) {
    assert.deepStrictEqual(match(want), ['specs/rest-card-list-fields.e2e.js'], want);
  }
  assert.ok(match('card').length > 1, 'a part of several names lists them all');
  // Negative: no match is nothing, not every spec.
  assert.deepStrictEqual(match('no-such-spec-xyz'), []);
});

test('negative: the command line refuses before building anything', () => {
  const run = (...args) => spawnSync('bash', [path.join(root, 'build.sh'), '--playwright-spec', ...args],
    { cwd: root, encoding: 'utf8', input: '', timeout: 60000 });
  const cases = [
    [[], /Usage: \.\/build\.sh --playwright-spec/],
    [['no-such-spec-xyz'], /no spec under tests\/playwright\/specs matches/],
    [['card', 'chromium'], /matches several specs - name one/],
    [['rest-card-list-fields', 'opera'], /browser must be chromium, firefox, webkit or all/],
  ];
  for (const [args, message] of cases) {
    const r = run(...args);
    assert.notStrictEqual(r.status, 0, args.join(' '));
    assert.match(r.stdout + r.stderr, message, args.join(' '));
    assert.doesNotMatch(r.stdout + r.stderr, /Building WeKan/, `${args.join(' ')} must not build`);
  }
});

test('build.sh: the menu entry, its case arm and the server it starts', () => {
  const desc = 'Test one Playwright spec on the browsers you choose; builds and starts the test server when none is running on :3000';
  assert.ok(sh.includes(`"Playwright single spec|${desc}"`), 'menu entry');
  assert.ok(sh.includes(`    "${desc}")\n\t\t\trun_playwright_spec\n`), 'case arm with the same description');
  const server = fn('start_spec_test_server');
  // A server that answers is reused; otherwise the current source is built first.
  assert.ok(server.indexOf('curl -fsS') < server.indexOf('build_wekan'));
  for (const needle of ['MONGO_URL="$WEKAN_MONGO_URL"', 'ROOT_URL="http://localhost:3000"', 'WITH_API=true',
    'WRITABLE_PATH="$writable"', 'mongo_answers "$port"', '/meteor"']) {
    assert.ok(server.includes(needle), needle);
  }
  const runner = fn('run_playwright_spec');
  assert.match(runner, /start_spec_test_server[\s\S]*stop_spec_test_server/, 'what it starts, it stops');
  assert.match(runner, /run_playwright_docker "\$b"[\s\S]*"\$\{args\[@\]\}"/, 'the spec reaches the container too');
  assert.match(runner, /--project="\$b"[\s\S]*"\$\{args\[@\]\}"/);
  // Only what this run started is stopped.
  assert.match(fn('stop_spec_test_server'), /SPEC_SERVER_PID[\s\S]*SPEC_MONGOD_PID/);
});

test('build.bat: the same option, with the same server steps', () => {
  assert.match(bat, /echo  19\^\) Playwright single spec/);
  assert.match(bat, /if "%choice%"=="19" goto test_pw_spec/);
  const body = bat.slice(bat.indexOf(':test_pw_spec\n'), bat.indexOf('\n:test_pw_parallel'));
  assert.ok(body.length > 100);
  for (const step of ['call :rebuild_for_tests', 'call :start_bundle_server', 'call :stop_test_databases',
    'curl -fsS http://127.0.0.1:3000/sign-in', 'call :logdir test-playwright-spec', '"specs/%PW_MATCH%"']) {
    assert.ok(body.includes(step), step);
  }
  // Stops the server only when this option started it.
  assert.match(body, /if "%PW_STARTED%"=="1" call :stop_test_databases/);
});
