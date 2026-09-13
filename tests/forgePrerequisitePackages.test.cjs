'use strict';
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
// Exercise the real shared package mapping with no package/network mutations.
for (const [os, family, expected] of [
  ['linux', 'debian', ['golang-go', 'openssh-client', 'nodejs']],
  ['linux', 'fedora', ['golang', 'openssh-clients', 'nodejs']],
  ['macos', '', ['go', 'openssh', 'node']],
]) {
  const shell = `
    . releases/ensure-tools.sh
    _et_os() { echo "$TEST_OS"; }
    _et_linux_family() { echo "$TEST_FAMILY"; }
    _et_have() { [ "$1" = dnf ]; }
    _et_brew_ensure() { :; }
    sudo() { echo "PACKAGE $*"; }
    brew() { echo "BREW $*"; }
    ensure_tools go ssh scp sftp node git curl jq rsync
  `;
  const result = cp.spawnSync('bash', ['-c', shell], {cwd: root, encoding: 'utf8',
    env: {...process.env, TEST_OS: os, TEST_FAMILY: family,
      TMPDIR: path.join(root, '.tools/tmp')}});
  assert.equal(result.status, 0, result.stderr);
  for (const pkg of expected) assert.ok(result.stdout.includes(` ${pkg}\n`), result.stdout);
  assert.doesNotMatch(result.stdout, /install -y (?:ssh|scp|sftp|node|go)\n/);
}
console.log('forgePrerequisitePackages: Debian/Ubuntu, Fedora and macOS native package mappings passed offline');
