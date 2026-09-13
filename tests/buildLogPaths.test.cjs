'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'build.sh'), 'utf8');
const start = source.indexOf('function build_log(){');
const helper = source.slice(start, source.indexOf('\n}\n', start) + 3);
test('development and release logs use daily type directories and preserve earlier output', () => {
  const base = fs.mkdtempSync(path.join(root, '.tools/tmp/build-log-paths-'));
  try {
    const result = spawnSync('bash', ['-c', helper + '\nfor pair in "build-dev-bundle dev" "build-release-bundle release"; do set -- $pair; file=$(build_log "$1" "$2") || exit $?; echo "$file"; echo first | tee -a "$file"; echo second | tee -a "$file"; done'], { env: { ...process.env, WEKAN_LOG_ROOT: base }, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    for (const [type, name] of [['build-dev-bundle', 'dev'], ['build-release-bundle', 'release']]) {
      const day = fs.readdirSync(path.join(base, type))[0];
      assert.match(day, /^\d{4}-\d{2}-\d{2}$/);
      assert.equal(fs.readFileSync(path.join(base, type, day, name + '.txt'), 'utf8'), 'first\nsecond\n');
    }
    assert.match(result.stdout, /first\nsecond/);
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
