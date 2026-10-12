'use strict';

// The v12.38 release run (.tools/log/wekan2): every Bun target that failed,
// and the release check that was skipped, each pinned here.
//
//   android-x64/arm64  EPERM at chmod on npm-rebuild-args.js. Termux's user does
//                      not own the bind-mounted bundle - the workflow made it
//                      writable for everyone - and only an owner may chmod.
//   freebsd-x64/arm64  the final Bun native check hit its 3-minute deadline
//                      with NO output: console.log was buffered and SIGKILLed
//                      with the process, so nothing said which package, or
//                      that every check had passed and Bun hung on exit
//                      (oven-sh/bun#44595).
//   windows-arm64      built, passed and attached, yet listed with an error:
//                      the expected "no prebuilt addon" probe printed Bun's raw
//                      `error:` line, which GitHub turns into an annotation.
//   docker             the bundle-version check looked for "name":"wekan" in
//                      app.js; rspack keeps only `version`, so it was skipped.
//
// Run: node tests/bunTargetBuildFailures.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const load = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);
const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'bun-target-'));

let passed = 0;
async function test(name, fn) { await fn(); passed += 1; console.log('  ok -', name); }

(async () => {
  console.log('bunTargetBuildFailures:');
  const { makeWritable } = await load('releases/prepare-bundle-npm.mjs');
  const { probeFailureReason } = await load('releases/bun/rebuild.mjs');
  const { nativeCheckVerdict, PASS_MARKER, STEP_PREFIX } = await load('releases/bun/native-check-verdict.mjs');

  await test('android: a writable file someone else owns is not chmodded', () => {
    // /dev/null is writable by everyone and owned by root: exactly the shape
    // of the Termux bind mount. chmod on it is EPERM for an ordinary user.
    if (process.getuid && process.getuid() !== 0) {
      assert.throws(() => fs.chmodSync('/dev/null', fs.statSync('/dev/null').mode | 0o200), /EPERM/,
        'the old unconditional chmod fails here');
    }
    assert.doesNotThrow(() => makeWritable('/dev/null'));
  });

  await test('android: a read-only file the build owns is still made writable', () => {
    const file = path.join(tmp, 'npm-rebuild-args.js');
    fs.writeFileSync(file, 'var args = ["rebuild", "--update-binary"];\n');
    fs.chmodSync(file, 0o444);
    makeWritable(file);
    fs.accessSync(file, fs.constants.W_OK);
  });

  await test('android: no Bun rebuild path chmods unconditionally (negative)', () => {
    for (const rel of ['releases/prepare-bundle-npm.mjs', 'releases/bun/rebuild.mjs']) {
      const code = read(rel).split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
      const calls = code.match(/chmodSync\(/g) || [];
      const inHelper = /export function makeWritable[\s\S]*?chmodSync\(file, statSync\(file\)\.mode \| 0o200\)/.test(code) ? 1 : 0;
      assert.equal(calls.length, inHelper, `${rel}: chmodSync only inside makeWritable`);
    }
  });

  await test('windows/freebsd: the probe reports one line that is not an error annotation', () => {
    const stderr = [
      "55 |     'node=' + process.versions.node,",
      "60 |   throw new Error('No native build was found for ' + target + '\\n    loaded from: ' + dir + '\\n')",
      '                 ^',
      'error: No native build was found for platform=win32 arch=arm64 runtime=node abi=147',
      '    loaded from: C:\\a\\wekan\\argon2',
      '      at load (node-gyp-build.js:22:30)',
    ].join('\n');
    const reason = probeFailureReason({ status: 1, stderr });
    assert.equal(reason, 'no usable prebuilt addon (No native build was found for platform=win32 arch=arm64 runtime=node abi=147)');
    assert.ok(!/\n/.test(reason));
    assert.doesNotMatch(reason, /^(error:|::error|##\[error\])/i);
    assert.equal(probeFailureReason({ error: new Error('spawnSync bun ETIMEDOUT') }), 'spawnSync bun ETIMEDOUT');
    assert.equal(probeFailureReason({ status: null, signal: 'SIGKILL', stderr: '' }), 'probe ended by SIGKILL');
    assert.equal(probeFailureReason({ status: 3, stderr: 'odd' }), 'probe exited 3');
  });

  await test('freebsd: every check passed and Bun hung on exit -> passed with a warning', () => {
    const v = nativeCheckVerdict({ status: null, signal: 'SIGKILL', error: Object.assign(new Error('x'), { code: 'ETIMEDOUT' }),
      stdout: `${PASS_MARKER} freebsd/x64\n`, stderr: `${STEP_PREFIX}sharp ok\n` });
    assert.equal(v.ok, true);
    assert.match(v.warning, /44595/);
    assert.deepEqual(nativeCheckVerdict({ status: 0, stdout: `${PASS_MARKER} linux/x64\n` }), { ok: true });
  });

  await test('freebsd: a hung or failed operation still fails, naming the step (negative)', () => {
    const hung = nativeCheckVerdict({ status: null, signal: 'SIGKILL', error: Object.assign(new Error('x'), { code: 'ETIMEDOUT' }),
      stdout: '', stderr: `${STEP_PREFIX}bcrypt (b)\n${STEP_PREFIX}bcrypt ok\n${STEP_PREFIX}argon2 (a)\n` });
    assert.equal(hung.ok, false);
    assert.match(hung.message, /did not finish before the deadline \(last step: argon2 \(a\)\)/);
    const failed = nativeCheckVerdict({ status: 1, stdout: '', stderr: `${STEP_PREFIX}sharp (s)\n` });
    assert.equal(failed.ok, false);
    assert.match(failed.message, /failed: exit 1 \(last step: sharp/);
    const none = nativeCheckVerdict({ status: 1, stdout: '', stderr: '' });
    assert.match(none.message, /before the first package/);
    // A clean exit that never said it passed is not a pass either.
    assert.equal(nativeCheckVerdict({ status: 0, stdout: '' }).ok, false);
  });

  await test('freebsd: the check writes unbuffered, exits explicitly, and the supervisor reads it', () => {
    const check = read('releases/bun/check-native.mjs');
    assert.match(check, /writeSync\(fd, `\$\{text\}\\n`\)/);
    const code = check.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
    assert.doesNotMatch(code, /console\.log/, 'buffered output is lost when the run is killed');
    assert.match(check, /process\.exit\(0\);\s*$/, 'ends with an explicit exit');
    const run = read('releases/bun/run-native-check.mjs');
    assert.match(run, /stdio: \['ignore', 'pipe', 'pipe'\]/);
    assert.match(run, /timeout: 180000, killSignal: 'SIGKILL'/);
    assert.match(run, /nativeCheckVerdict\(result\)/);
  });

  await test('docker: the bundle-version check finds the version in an rspack bundle', () => {
    const wf = read('.github/workflows/release-all.yml');
    const i = wf.indexOf('          found=""\n          if [ -f "$appjs" ]; then');
    const j = wf.indexOf('          rm -rf "$tmp" bundle.zip', i);
    assert.ok(i > 0 && j > i, 'the extraction block is where this test expects it');
    const block = wf.slice(i, j).split('\n').map((l) => l.slice(10)).join('\n');
    const script = path.join(tmp, 'extract.sh');
    fs.writeFileSync(script, `set -euo pipefail\nappjs="$1"\n${block}\nprintf '%s' "$found"\n`);
    const found = (content) => {
      const file = path.join(tmp, 'app.js');
      fs.writeFileSync(file, content);
      return execFileSync('bash', [script, file], { encoding: 'utf8' });
    };
    assert.equal(found(`a,8330(e){"use strict";e.exports=JSON.parse('{"version":"v12.38.0"}')}},b`), 'v12.38.0');
    assert.equal(found('x{"name":"wekan","version":"v9.63.0","private":true}'), 'v9.63.0', 'the older layout still works');
    // Negative: ambiguous or absent stays "not found" (a warning), never a guess.
    assert.equal(found(`JSON.parse('{"version":"v1.0.0"}') JSON.parse('{"version":"v2.0.0"}')`), '');
    assert.equal(found(`JSON.parse('{"version":"11.2.0"}')`), '', 'an npm package version-only module is not WeKan');
    assert.equal(found('nothing here'), '');
  });

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\nbunTargetBuildFailures: ${passed} tests passed`);
})().catch((err) => { fs.rmSync(tmp, { recursive: true, force: true }); console.error(err); process.exit(1); });
