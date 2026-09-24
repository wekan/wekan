'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const tmpRoot = path.join(root, '.tools/tmp');
fs.mkdirSync(tmpRoot, { recursive: true });

function fixture(fn) {
  const dir = fs.mkdtempSync(path.join(tmpRoot, 'release-version-'));
  try {
    fs.mkdirSync(path.join(dir, 'releases'));
    fs.mkdirSync(path.join(dir, 'bin'));
    for (const name of ['latest-release-version.sh', 'check-upcoming-release.sh']) {
      fs.copyFileSync(path.join(root, 'releases', name), path.join(dir, 'releases', name));
    }
    // Run the actual preflight only. Never include the publishing portion.
    const source = fs.readFileSync(path.join(root, 'releases/release-all.sh'), 'utf8');
    fs.writeFileSync(path.join(dir, 'releases/preflight.sh'), source.split('DATE="$(date +%F)"')[0] + '\nprintf "%s %s\\n" "$OLD" "$NEW"\n');
    fs.writeFileSync(path.join(dir, 'releases/ensure-tools.sh'), 'ensure_tools() { :; }\n');
    fs.writeFileSync(path.join(dir, 'releases/fix-changelog-hashes.sh'), 'exit 0\n');
    // Dependency checks are covered by releaseTelemetry/remoteRelease; this fixture
    // isolates version selection and refuses all other git/gh operations.
    fs.writeFileSync(path.join(dir, 'releases/check-telemetry.py'), '# audited fixture\n');
    fs.writeFileSync(path.join(dir, 'releases/remote-release.py'), '# audited fixture\n');
    fs.writeFileSync(path.join(dir, 'bin/gh'), '#!/bin/sh\n[ \"$1 $2\" = \"auth status\" ] || exit 99\n', { mode: 0o755 });
    fs.writeFileSync(path.join(dir, 'bin/git'), '#!/bin/bash\ncase "$1" in\nbranch) echo main;;\nremote) echo git@github.com:wekan/wekan.git;;\nls-remote) [ "${OFFLINE:-0}" = 0 ] || exit 1; printf "%s\\n" "$REMOTE_TAGS";;\ntag) printf "%s\\n" "$LOCAL_TAGS";;\n*) exit 99;;\nesac\n', { mode: 0o755 });
    const notes = '# Upcoming WeKan ® release\n\n**In short:** Fix release builds.\n\n<details>\n<summary><a href="https://example.com">Fix</a></summary>\n</details>\n# v11.89 2026-09-20 WeKan ® release\n';
    fs.writeFileSync(path.join(dir, 'CHANGELOG.md'), notes);
    fs.writeFileSync(path.join(dir, 'package.json'), '{\n  "version": "v11.89.0",\n  "private": true\n}\n');
    const run = (env = {}, args = []) => {
      const result = spawnSync('bash', [path.join(dir, 'releases/preflight.sh'), ...args], {
        encoding: 'utf8', env: { ...process.env, TMPDIR: tmpRoot, PATH: path.join(dir, 'bin') + path.delimiter + process.env.PATH,
          REMOTE_TAGS: '', LOCAL_TAGS: '', ...env },
      });
      assert.equal(fs.readFileSync(path.join(dir, 'CHANGELOG.md'), 'utf8'), notes);
      return result;
    };
    fn(run, dir);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

test('stale changelog cannot reuse a local or remote release tag', () => fixture(run => {
  for (const env of [{ LOCAL_TAGS: 'v11.90' }, { REMOTE_TAGS: 'abc\trefs/tags/v11.90\nabc\trefs/tags/v11.90^{}' }]) {
    const result = run(env);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), '11.90 11.91');
  }
}));
test('package version prevents reuse even without tags; minor 99 rolls over', () => fixture((run, dir) => {
  for (const [version, expected] of [['11.90', '11.90 11.91'], ['11.99', '11.99 12.00']]) {
    fs.writeFileSync(path.join(dir, 'package.json'), `{\n  "version": "v${version}.0",\n  "private": true\n}\n`);
    const result = run();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), expected);
  }
}));
test('explicit versions must match the next unused version', () => fixture(run => {
  for (const args of [['11.89', '11.90'], ['11.90'], ['11.90', '11.92'], ['x', 'y']]) {
    const result = run({ LOCAL_TAGS: 'v11.90' }, args);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /refusing stale or reused versions/);
  }
  assert.equal(run({ LOCAL_TAGS: 'v11.90' }, ['v11.90', 'v11.91']).status, 0);
}));
test('remote failure stops before editing notes; unrelated tags are ignored', () => fixture(run => {
  assert.notEqual(run({ OFFLINE: '1' }).status, 0);
  const result = run({ REMOTE_TAGS: 'abc\trefs/tags/v99.99-beta\nabc\trefs/tags/other' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), '11.89 11.90');
}));
