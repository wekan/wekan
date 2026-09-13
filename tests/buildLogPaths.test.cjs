'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'build.sh'), 'utf8');
const start = source.indexOf('function log_directory(){');
const helper = source.slice(start, source.indexOf('\n}\n', source.indexOf('function build_log(){')) + 3);
test('development and release logs use dated time directories and preserve earlier output', () => {
  const base = fs.mkdtempSync(path.join(root, '.tools/tmp/build-log-paths-'));
  try {
    const result = spawnSync('bash', ['-c', helper + '\nfor pair in "build-dev-bundle dev" "build-release-bundle release"; do set -- $pair; file=$(build_log "$1" "$2") || exit $?; echo "$file"; echo first | tee -a "$file"; echo second | tee -a "$file"; done'], { env: { ...process.env, WEKAN_LOG_ROOT: base }, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    for (const [type, name] of [['build-dev-bundle', 'dev'], ['build-release-bundle', 'release']]) {
      const day = fs.readdirSync(path.join(base, type))[0];
      assert.match(day, /^\d{4}-\d{2}-\d{2}$/);
      const time = fs.readdirSync(path.join(base, type, day))[0];
      assert.match(time, /^\d{2}-\d{2}-\d{2}(?:-\d+)?$/);
      assert.equal(fs.readFileSync(path.join(base, type, day, time, name + '.txt'), 'utf8'), 'first\nsecond\n');
    }
    assert.match(result.stdout, /first\nsecond/);
    const repeated = spawnSync('bash', ['-c', helper + '\nfirst=$(build_log build-dev-bundle dev); second=$(build_log build-dev-bundle dev); test "$first" != "$second"'], { env: { ...process.env, WEKAN_LOG_ROOT: base }, encoding: 'utf8' });
    assert.equal(repeated.status, 0, 'repeat builds must have distinct paths');
    const invalid = spawnSync('bash', ['-c', helper + '\nbuild_log ../escape wrong'], { env: { ...process.env, WEKAN_LOG_ROOT: base }, encoding: 'utf8' });
    assert.notEqual(invalid.status, 0);
    assert.match(invalid.stderr, /unknown build log type/);
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
});
test('release preparation shares the chosen log and test runs retain their build log', () => {
  assert.match(source, /build_type=build-release-bundle; build_name=release/);
  assert.match(source, /buildlogs\+=\("\$\(one_log build\)"\)/);
  assert.match(source, /Prepare release bundle[^\n]*tee -a "\$\{buildlogs\[@\]\}"/);
});

test('Node directory reservation for Windows separates simultaneous starts and rejects invalid types', () => {
  const { reserve } = require('../tools/log-directory.cjs');
  const base = fs.mkdtempSync(path.join(root, '.tools/tmp/log-reservation-'));
  try {
    const now = new Date(2026, 8, 14, 0, 1, 2);
    const first = reserve(base, 'dev-server', now);
    const second = reserve(base, 'dev-server', now);
    assert.equal(path.relative(base, first), path.join('dev-server', '2026-09-14', '00-01-02'));
    assert.equal(second, first + '-1');
    assert.throws(() => reserve(base, '../escape', now), /Invalid log type/);
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
});
test('all logger entry points use operation/date/time directories on both platforms', () => {
  const bat = fs.readFileSync(path.join(root, 'build.bat'), 'utf8');
  assert.doesNotMatch(source, /RUN_LOGDIR="\$WEKAN_LOG_ROOT\//);
  assert.doesNotMatch(source, /tee "\$WEKAN_LOG_ROOT\/wekan-log\.log"/);
  assert.doesNotMatch(bat, /set "RUN_LOGDIR=%REPO%\\\.tools\\log\\%RUN_TS%"/);
  for (const type of ['test-all-parallel', 'test-all-sequential', 'dev-server', 'build-dev-bundle', 'build-release-bundle']) assert.ok(bat.includes('call :logdir ' + type) || bat.includes('call :buildlog ' + type), type);
  assert.match(bat, /call :logdir test-%~1/);
  assert.match(bat, /call :build_logged meteor build/);
});
