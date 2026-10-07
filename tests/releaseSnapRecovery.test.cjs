'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');
const workflow = fs.readFileSync(path.join(root, '.github/workflows/release-all.yml'), 'utf8');
const start = workflow.indexOf('      - name: Build the ${{ matrix.arch }} snap on Launchpad');
const run = workflow.indexOf('        run: |\n', start) + '        run: |\n'.length;
const end = workflow.indexOf('\n      - name:', run);
const source = workflow.slice(run, end).split('\n').map(line => line.startsWith('          ') ? line.slice(10) : line).join('\n');
function fixture(fn) {
  const tmp = path.join(root, '.tools/tmp');
  fs.mkdirSync(tmp, { recursive: true });
  const dir = fs.mkdtempSync(path.join(tmp, 'snap-recovery-test-'));
  try { return fn(dir); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
function remote(scenario, arch = 'armhf') {
  return fixture(dir => {
    const script = `
fixture="$FIXTURE_ROOT"
export TMPDIR="$fixture" GITHUB_OUTPUT="$fixture/output" VERSION=11.85
mkdir -p "$fixture/.tools/tmp/snap-launchpad-source"
mkdir -p "$fixture/releases"
printf '#!/usr/bin/env bash\nsnapcraft "$@"\n' > "$fixture/releases/snapcraft-remote-compat.sh"
count="$fixture/count"
timeout() { printf '%s\\n' "$*" >> "$fixture/calls"; shift 2; "$@"; }
sleep() { :; }
snapcraft() {
 n=0; [ ! -f "$count" ] || n=$(cat "$count"); n=$((n+1)); echo "$n" > "$count"
 case "$SCENARIO:$n" in
  absent:1) echo 'Could not find snap recipe snapcraft-wekan-hash'; return 1 ;;
  tls:1|budget:1) echo 'Recovering build hash'; echo 'Monitoring build'; echo 'ssl.SSLEOFError: EOF occurred in violation of protocol';
    [ "$SCENARIO" != budget ] || /usr/bin/sleep 1; return 1 ;;
  pending:*|budget:2) echo 'Pending: '$ARCH; return 124 ;;
  denied:*) echo 'Recovering build hash'; echo 'HTTP 401 Unauthorized'; return 1 ;;
  bad:*) echo 'Monitoring build'; printf 'oops' > "wekan_11.85_\${ARCH}.snap"; return 0 ;;
  stopped:1|proxy:1) echo 'Starting new build.'; echo 'Monitoring build'; echo "Stopped: $ARCH";
    printf 'Downloading package: libyaml-cpp0.8\nFailed to fetch package: The item %s could not be fetched: 501  Gateway error [IP: 10.10.10.1 8222].\nBuild failed\n' \
      "'/root/.cache/snapcraft/download/libyaml-cpp0.8_0.8.0+dfsg-6build1_\${ARCH}.deb'" > "snapcraft-wekan-hash_\${ARCH}_1.txt"; return 0 ;;
  proxy:*) echo 'Starting new build.'; echo "Stopped: $ARCH"; echo "snapcraft internal error: MissingSchema(\"Invalid URL 'None'\")"; return 70 ;;
 esac
 truncate -s 52428800 "wekan_11.85_\${ARCH}.snap"
 printf hsqs | dd of="wekan_11.85_\${ARCH}.snap" conv=notrunc status=none
 [ "$SCENARIO" != cleanup ] || return 1
 return 0
}
export fixture count
export -f snapcraft
` + source.replaceAll('${{ matrix.arch }}', arch)
      // Redirect only the workflow's log/cache paths into the fixture. Never
      // change HOME or let this test touch a real Snapcraft cache/credentials.
      .replaceAll('$HOME', '$fixture');
    const result = spawnSync('bash', ['-c', script], { cwd: dir, env: { ...process.env, SCENARIO: scenario, ARCH: arch, FIXTURE_ROOT: dir }, encoding: 'utf8', timeout: 15000 });
    assert.ifError(result.error);
    return { ...result, output: fs.readFileSync(path.join(dir, 'output'), 'utf8'), calls: fs.readFileSync(path.join(dir, 'calls'), 'utf8').trim().split('\n') };
  });
}
test('TLS polling failures recover the same recipe without resubmitting', () => {
  const result = remote('tls');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.calls.length, 2);
  assert.ok(result.calls.every(call => call.endsWith('--recover')));
  assert.match(result.output, /built=true/);
  assert.doesNotMatch(result.stdout, /Clearing snapcraft/);
});
test('only an explicitly absent recipe permits submitting a new build', () => {
  const result = remote('absent');
  assert.equal(result.status, 0);
  assert.match(result.calls[0], /--recover$/);
  assert.doesNotMatch(result.calls[1], /--recover/);
  const denied = remote('denied');
  assert.equal(denied.status, 1);
  assert.equal(denied.calls.length, 3);
  assert.ok(denied.calls.every(call => call.endsWith('--recover')));
  assert.doesNotMatch(denied.output, /built=true|pending=true/);
});
test('#v12.21 s390x: a build that ended Stopped is retried with a NEW build, not recovered', () => {
  const result = remote('stopped', 's390x');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.calls.length, 2, result.calls.join('\n'));
  assert.match(result.calls[0], /--recover$/);
  assert.doesNotMatch(result.calls[1], /--recover/, 'a finished build cannot be recovered into a snap');
  assert.match(result.stdout, /submitting a new build instead of recovering it/);
  assert.match(result.output, /built=true/);
});
test('negative: a Launchpad proxy 5xx is named as infrastructure, and old logs are not reprinted', () => {
  const result = remote('proxy', 's390x');
  assert.equal(result.status, 1);
  assert.equal(result.calls.length, 3);
  assert.match(result.calls[0], /--recover$/);
  for (const call of result.calls.slice(1)) assert.doesNotMatch(call, /--recover/);
  assert.match(result.stderr, /build-farm package proxy failed \(HTTP 5xx\).*libyaml-cpp0\.8_0\.8\.0\+dfsg-6build1_s390x\.deb/);
  assert.match(result.stderr, /snapcraft\.yaml needs no change/);
  // Attempt 1's log is printed once; attempts 2 and 3 fetched none of their own.
  assert.equal((result.stdout.match(/::group::Launchpad build log: /g) || []).length, 1, result.stdout);
  assert.equal((result.stdout.match(/downloaded no Launchpad build log of its own/g) || []).length, 2);
  assert.doesNotMatch(result.stderr, /This is NOT a transient failure/);
  assert.doesNotMatch(result.output, /built=true|pending=true/);
});
test('all Launchpad architectures stop waiting cleanly without claiming a build', () => {
  for (const arch of ['armhf', 'ppc64el', 's390x', 'riscv64']) {
    const result = remote('pending', arch);
    assert.equal(result.status, 0, arch);
    assert.equal(result.calls.length, 1);
    assert.match(result.calls[0], /--kill-after=30s \d+s bash .*snapcraft-remote-compat.sh remote-build/);
    assert.doesNotMatch(result.calls[0], /--foreground/);
    assert.match(result.output, /pending=true/);
    assert.doesNotMatch(result.output, /built=true/);
  }
});
test('the total wait budget decreases across retries', () => {
  const result = remote('budget');
  const seconds = result.calls.map(call => Number(call.match(/ (\d+)s bash/)[1]));
  assert.ok(seconds[1] < seconds[0], result.calls.join('\n'));
  assert.match(result.output, /pending=true/);
});
test('a valid artifact survives cleanup errors, but invalid files never publish', () => {
  assert.match(remote('cleanup').output, /built=true/);
  const invalid = remote('bad');
  assert.equal(invalid.status, 1);
  assert.doesNotMatch(invalid.output, /built=true|pending=true/);
});
test('GitHub attachments retry timeouts and reject missing or wrong-size assets', () => {
  for (const scenario of ['ok', 'timeout', 'missing', 'wrongsize', 'viewtimeout', 'fail']) fixture(dir => {
    fs.writeFileSync(path.join(dir, 'a.snap'), 'snap');
    const script = `
export fixture="$FIXTURE_ROOT"
export TMPDIR="$fixture"
timeout() { printf '%s\\n' "$*" >> "$fixture/calls"; shift 2; "$@"; }
sleep() { :; }
gh() {
 if [ "$2" = upload ]; then
  n=0; [ ! -f "$fixture/count" ] || n=$(cat "$fixture/count"); n=$((n+1)); echo "$n" > "$fixture/count"
  [ "$SCENARIO" != fail ] || return 1
  [ "$SCENARIO:$n" != timeout:1 ] || return 124
 else
  case "$SCENARIO" in
   missing) return 0 ;;
   wrongsize) printf 'a.snap\\t3\\n' ;;
   viewtimeout) return 124 ;;
   *) printf 'a.snap\\t4\\n' ;;
  esac
 fi
}
export -f timeout sleep gh
bash "$UPLOAD_SCRIPT" test/repo v11.85 a.snap
`;
    const result = spawnSync('bash', ['-c', script], { cwd: dir, env: { ...process.env, SCENARIO: scenario, FIXTURE_ROOT: dir, UPLOAD_SCRIPT: path.join(root, 'releases/github-release-upload.sh') }, encoding: 'utf8', timeout: 10000 });
    assert.ifError(result.error);
    assert.equal(result.status, ['ok', 'timeout'].includes(scenario) ? 0 : 1, scenario + result.stderr);
    const attempts = Number(fs.readFileSync(path.join(dir, 'count'), 'utf8'));
    assert.equal(attempts, scenario === 'ok' ? 1 : scenario === 'timeout' ? 2 : 3);
    const calls = fs.readFileSync(path.join(dir, 'calls'), 'utf8');
    assert.match(calls, /--kill-after=30s 10m gh release upload/);
    if (scenario !== 'fail') assert.match(calls, /--kill-after=10s 60s gh release view/);
    assert.ok(fs.existsSync(path.join(dir, 'a.snap')));
  });
});
