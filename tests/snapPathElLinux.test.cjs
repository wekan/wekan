'use strict';

// Snapd keeps the snaps in /snap on Ubuntu and Debian, but in
// /var/lib/snapd/snap on Fedora, RHEL, AlmaLinux, Rocky Linux, CentOS Stream
// and Arch Linux, which have no /snap unless an admin made the symlink. A
// report from AlmaLinux/Rocky: the backup and restore instructions exported
// /snap/wekan/current/bin and .../lib/x86_64-linux-gnu, so mongorestore was not
// found, and only Arch had a note - for the library path alone.
//
//  - every instruction that puts the snap's bin or lib on PATH or
//    LD_LIBRARY_PATH picks the directory with the S= line, never /snap alone;
//  - a snap script that can be run from a host shell (no $SNAP) finds the snap
//    in either place.
//
// Run: node tests/snapPathElLinux.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const S_LINE = /^S=\/snap; \[ -d \/snap\/([a-z-]+) \] \|\| S=\/var\/lib\/snapd\/snap$/;

function markdownFiles() {
  const out = execFileSync('git', ['ls-files', '*.md'], { cwd: repoRoot, encoding: 'utf8' });
  return out.split('\n').filter(f => f && !f.startsWith('old-CHANGELOG/') && !/^CHANGELOG/.test(f));
}

test('no instruction exports a /snap-only bin or lib directory', () => {
  const bad = [];
  for (const file of markdownFiles()) {
    read(file).split('\n').forEach((line, i) => {
      if (/^\s*export (PATH|LD_LIBRARY_PATH)=.*(^|[^A-Za-z_$])\/snap\/[a-z-]+\/current\/(bin|lib)/.test(line)) {
        bad.push(`${file}:${i + 1}: ${line.trim()}`);
      }
    });
  }
  assert.deepStrictEqual(bad, [], 'use the S= line so EL and Arch hosts find the snap');
});

test('every $S/<snap>/current export has its S= line earlier in the same code block', () => {
  const bad = [];
  for (const file of markdownFiles()) {
    let inCode = false;
    let s = null;
    read(file).split('\n').forEach((line, i) => {
      if (line.startsWith('```')) { inCode = !inCode; s = null; return; }
      if (!inCode) return;
      const m = S_LINE.exec(line);
      if (m) { s = m[1]; return; }
      const use = /\$S\/([a-z-]+)\/current\/(bin|lib)/.exec(line);
      if (use && use[1] !== s) bad.push(`${file}:${i + 1}`);
    });
  }
  assert.deepStrictEqual(bad, []);
});

test('the snap restore instructions find mongorestore on either layout, for either CPU', () => {
  const backup = read('docs/Backup/Backup.md');
  const restore = backup.slice(backup.indexOf('# Restore Wekan Snap'), backup.indexOf('# Upgrade WeKan Snap Stable'));
  assert.match(restore, /S=\/snap; \[ -d \/snap\/wekan \] \|\| S=\/var\/lib\/snapd\/snap/);
  assert.match(restore, /\$S\/wekan\/current\/lib\/\$\(uname -m\)-linux-gnu/);
  assert.match(restore, /\$S\/wekan\/current\/bin/);
  assert.match(backup, /AlmaLinux, Rocky Linux/, 'the note says which hosts it is for');
  assert.doesNotMatch(backup, /NOTE for Arch Linux/, 'one rule for every host, not a note per distribution');
});

test('negative: no snap script falls back to /snap alone', () => {
  const dir = path.join(repoRoot, 'snap-src/bin');
  const bad = [];
  for (const name of fs.readdirSync(dir)) {
    const text = fs.readFileSync(path.join(dir, name), 'utf8');
    if (/SNAP="\$\{SNAP:-\/snap\//.test(text)) bad.push(name);
    // /var/snap/<name>/common is the data, the same on every host; only the
    // snap's own directory moves.
    if (/(^|[^r])\/snap\/\$\{SNAP_INSTANCE_NAME/m.test(text) && !/\/var\/lib\/snapd\/snap\/\$\{SNAP_INSTANCE_NAME/.test(text)) {
      bad.push(`${name} (no /var/lib/snapd/snap fallback)`);
    }
  }
  assert.deepStrictEqual(bad, []);
});

test('a host-shell run of database-role works with no $SNAP, and keeps a $SNAP that snapd set', () => {
  const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || require('os').tmpdir(), 'elsnap-'));
  try {
    const common = path.join(tmp, 'common');
    fs.mkdirSync(common);
    const script = path.join(repoRoot, 'snap-src/bin/database-role');
    const env = { PATH: '/usr/bin:/bin', SNAP_COMMON: common };
    assert.strictEqual(execFileSync('bash', [script], { env, encoding: 'utf8' }).trim(), 'ferretdb');
    const src = read('snap-src/bin/database-role');
    assert.match(src, /if \[ -z "\$\{SNAP:-\}" \]; then/, 'a $SNAP set by snapd is never replaced');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

console.log(`snapPathElLinux: ${passed} tests passed`);
