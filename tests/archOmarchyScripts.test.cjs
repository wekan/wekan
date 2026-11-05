'use strict';
// build.sh and releases/*.sh on Arch Linux and Omarchy (https://omarchy.org),
// the Arch-based Hyprland desktop: pacman without partial upgrades, Arch
// package names, snapd from the AUR, the sshd unit, Playwright without the
// apt-only --with-deps. Everything runs offline: sudo, yay and pacman are
// shell functions that print what they would have run.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const TMP = path.join(ROOT, '.tools', 'tmp');
fs.mkdirSync(TMP, { recursive: true });

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

function run(body, env = {}) {
  const shell = `
    . releases/ensure-tools.sh
    _et_os() { echo linux; }
    _et_linux_family() { echo "\${TEST_FAMILY:-arch}"; }
    _et_have() { [[ "|\${TEST_HAVE:-pacman}|" == *"|$1|"* ]]; }
    sudo() { echo "SUDO $*"; [ -z "\${TEST_SUDO_FAIL:-}" ]; }
    yay() { echo "YAY $*"; }
    paru() { echo "PARU $*"; }
    ${body}
  `;
  const result = spawnSync('bash', ['-c', shell], {
    cwd: ROOT, encoding: 'utf8',
    env: { ...process.env, TMPDIR: TMP, ...env },
  });
  return result;
}

function withSyncDir(hasDb, fn) {
  const dir = fs.mkdtempSync(path.join(TMP, 'pacman-sync-'));
  if (hasDb) fs.writeFileSync(path.join(dir, 'core.db'), '');
  try { return fn(dir); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

console.log('archOmarchyScripts:');

test('pacman installs with -S --needed, never a -Sy partial upgrade', () => {
  withSyncDir(true, (dir) => {
    const r = run('ensure_tools gh 7zip awk python3', { WEKAN_PACMAN_SYNC_DIR: dir });
    assert.equal(r.status, 0, r.stderr);
    for (const pkg of ['github-cli', '7zip', 'gawk', 'python']) {
      assert.match(r.stdout, new RegExp(`SUDO pacman -S --needed --noconfirm ${pkg}\\n`), r.stdout);
    }
    assert.doesNotMatch(r.stdout, /pacman -Sy /);
    assert.doesNotMatch(r.stdout, /p7zip/, 'Arch replaced p7zip with 7zip');
  });
});

test('a never-synced pacman (fresh container) does a full -Syu, not -Sy', () => {
  withSyncDir(false, (dir) => {
    const r = run('_et_pacman jq', { WEKAN_PACMAN_SYNC_DIR: dir });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /SUDO pacman -Syu --needed --noconfirm jq\n/);
  });
});

test('WEKAN_PACMAN_SYU=1 opts in to the full upgrade', () => {
  withSyncDir(true, (dir) => {
    const r = run('_et_pacman jq', { WEKAN_PACMAN_SYNC_DIR: dir, WEKAN_PACMAN_SYU: '1' });
    assert.match(r.stdout, /SUDO pacman -Syu --needed --noconfirm jq\n/);
  });
});

test('a failed install fails, and names omarchy-update on Omarchy', () => {
  withSyncDir(true, (dir) => {
    const r = run('_et_pacman jq', {
      WEKAN_PACMAN_SYNC_DIR: dir, TEST_SUDO_FAIL: '1', TEST_HAVE: 'pacman|omarchy-update',
    });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /omarchy-update/);
    assert.doesNotMatch(r.stdout, /pacman -Sy /, 'no automatic partial upgrade as a retry');
  });
  withSyncDir(true, (dir) => {
    const r = run('_et_pacman jq', {
      WEKAN_PACMAN_SYNC_DIR: dir, TEST_SUDO_FAIL: '1', HOME: path.join(TMP, 'no-such-home'),
    });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /sudo pacman -Syu/);
    assert.doesNotMatch(r.stderr, /omarchy-update/);
  });
});

test('snapcraft on Arch/Omarchy: snapd from the AUR with yay, then the snap', () => {
  const r = run('ensure_tools snapcraft', { TEST_HAVE: 'pacman|yay' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /YAY -S --needed --noconfirm snapd\n/);
  assert.match(r.stdout, /SUDO systemctl enable --now snapd.socket\n/);
  assert.match(r.stdout, /SUDO snap install snapcraft --classic\n/);
  assert.doesNotMatch(r.stdout, /SUDO yay|SUDO paru/, 'AUR helpers must not run as root');
});

test('snapcraft without an AUR helper fails with instructions instead of guessing', () => {
  const r = run('ensure_tools snapcraft');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /aur\.archlinux\.org/);
  assert.doesNotMatch(r.stdout, /snap install/);
});

test('the SSH server unit is sshd on Arch and ssh on Debian', () => {
  assert.equal(run('_et_ssh_unit').stdout.trim(), 'sshd');
  assert.equal(run('_et_ssh_unit', { TEST_FAMILY: 'debian' }).stdout.trim(), 'ssh');
});

test('Playwright system libraries come from pacman on Arch', () => {
  withSyncDir(true, (dir) => {
    const r = run('ensure_playwright_system_deps', { WEKAN_PACMAN_SYNC_DIR: dir });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /SUDO pacman -S --needed --noconfirm nss .*gtk3/);
  });
});

test('the build toolchain and archive tools use 7zip and no partial upgrade', () => {
  withSyncDir(true, (dir) => {
    const r = run('ensure_build_toolchain; ensure_archive_tools', { WEKAN_PACMAN_SYNC_DIR: dir });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /pacman -S --needed --noconfirm base-devel python curl wget 7zip zip unzip\n/);
    assert.doesNotMatch(r.stdout, /p7zip|pacman -Sy /);
  });
});

test('build.sh: Arch install, SSH menu and Playwright are distribution-aware', () => {
  const src = fs.readFileSync(path.join(ROOT, 'build.sh'), 'utf8');
  assert.match(src, /_et_pacman base-devel git curl wget 7zip zip unzip file npm/);
  assert.match(src, /systemctl enable \\"\\\$\(_et_ssh_unit\)\\"/);
  assert.doesNotMatch(src, /systemctl (enable|start|disable|stop) ssh\b/);
  // --with-deps is apt-only: it must be behind the Debian check.
  const withDeps = src.indexOf('npx playwright install --with-deps');
  const guard = src.lastIndexOf('"$(_et_linux_family)" != debian', withDeps);
  assert.ok(withDeps > 0 && guard > 0 && withDeps - guard < 800, 'with-deps is guarded');
  assert.match(src, /Arch\/Omarchy/);
});

// Negative test: the fault cannot live anywhere else. No tracked shell script
// does a `pacman -Sy <package>` partial upgrade (-Syu is the supported form),
// and none installs Arch's retired p7zip package.
test('no shell script anywhere does a pacman -Sy partial upgrade or installs p7zip on Arch', () => {
  const files = spawnSync('git', ['ls-files', '*.sh'], { cwd: ROOT, encoding: 'utf8' })
    .stdout.split('\n').filter(Boolean);
  assert.ok(files.length > 50);
  const offenders = [];
  for (const file of files) {
    const lines = fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (/^\s*#/.test(line)) return;
      if (/pacman\s+-Sy(?!u)\w*\s/.test(line)) offenders.push(`${file}:${i + 1}: ${line.trim()}`);
      if (/pacman\b.*\bp7zip\b/.test(line) || /_et_pacman\b.*\bp7zip\b/.test(line)) {
        offenders.push(`${file}:${i + 1}: ${line.trim()}`);
      }
    });
  }
  assert.deepEqual(offenders, []);
});

console.log(`\n${passed} tests passed`);
