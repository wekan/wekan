'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const helper = path.join(ROOT, 'releases', 'ensure-tools.sh');
const fixtures = {
  alpine: 'ID=alpine\n',
  arch: 'ID=arch\n',
  fedora: 'ID=fedora\n',
  rhel: 'ID=rhel\n',
  oracle: 'ID=ol\nID_LIKE="fedora rhel"\n',
  debian: 'ID=ubuntu\nID_LIKE=debian\n',
};

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('linuxPackageManagers:');

for (const [name, contents] of Object.entries(fixtures)) {
  test(`${name} is detected from os-release`, () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-os-release-'));
    const file = path.join(dir, 'os-release');
    fs.writeFileSync(file, contents);
    const result = spawnSync('bash', ['-c', `. "${helper}"; _et_linux_family`], {
      encoding: 'utf8', env: { ...process.env, WEKAN_OS_RELEASE_FILE: file },
    });
    fs.rmSync(dir, { recursive: true, force: true });
    assert.strictEqual(result.status, 0, result.stderr);
    const expected = name === 'oracle' ? 'rhel' : name;
    assert.strictEqual(result.stdout.trim(), expected);
  });
}

test('every Linux family has an explicit package-manager command', () => {
  const src = fs.readFileSync(helper, 'utf8');
  for (const command of ['apk add --no-cache', 'pacman -Sy --needed --noconfirm',
    'dnf', 'yum', 'apt-get']) assert.ok(src.includes(command), command);
});

test('host-facing release installers use the shared detector', () => {
  for (const file of ['up.sh', 'clone-release-repos.sh',
    'count-lines-of-code-per-committer.sh', 'rebuild-release.sh',
    'rebuild-docs.sh', 'node-update-local.sh', 'install-sandstorm.sh',
    'build-bundle-armhf.sh', 'build-bundle-ppc64le.sh',
    'build-bundle-ppc64el.sh', 'build-bundle-s390x.sh', 'snap-build.sh']) {
    const src = fs.readFileSync(path.join(ROOT, 'releases', file), 'utf8');
    assert.ok(src.includes('ensure-tools.sh'), `${file} must source ensure-tools.sh`);
  }
});

test('shared specialized installers cover every Linux family', () => {
  const src = fs.readFileSync(helper, 'utf8');
  assert.ok(src.includes('ensure_build_toolchain()'));
  assert.ok(src.includes('ensure_archive_tools()'));
});

console.log(`\n${passed} tests passed`);
