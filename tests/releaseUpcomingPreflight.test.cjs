'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const tmpRoot = path.join(root, '.tools/tmp');
fs.mkdirSync(tmpRoot, { recursive: true });
const checker = path.join(root, 'releases/check-upcoming-release.sh');
const entry = '<details>\n<summary><a href="https://github.com/wekan/wekan/commit/1234567">Fix build</a></summary>\n</details>\n';
const upcoming = '# Upcoming WeKan ® release\n\n**In short:** Fix build preparation.\n\n';

test('release preflight accepts real Upcoming entries and rejects missing/empty/duplicate notes', () => {
  const dir = fs.mkdtempSync(path.join(tmpRoot, 'release-preflight-'));
  try {
    for (const [text, valid] of [
      [upcoming.replace('**In short:** Fix build preparation.', '') + entry, false],
      [upcoming.replace('Fix build preparation.', '   ') + entry, false],
      ['# Upcoming WeKan ® release\n' + entry + '# v11.75 date\n**In short:** Older summary.\n', false],
      [upcoming + entry + '# v11.75 2026-09-14 WeKan ® release\n', true],
      ['# v11.75 2026-09-14 WeKan ® release\n' + entry, false],
      [upcoming + '\n# v11.75 2026-09-14 WeKan ® release\n' + entry, false],
      [upcoming + '**In short:** nothing here yet.\n', false],
      [upcoming + entry + upcoming + entry, false],
      ['# Upcoming WeKan unrelated heading\n' + entry, false],
    ]) {
      const file = path.join(dir, 'CHANGELOG.md');
      fs.writeFileSync(file, text);
      const result = spawnSync('bash', [checker, file], { encoding: 'utf8', env: { ...process.env, TMPDIR: tmpRoot } });
      assert.equal(result.status, valid ? 0 : 1, result.stderr);
      if (!valid) assert.match(result.stderr, /Error:.*Upcoming/);
      assert.equal(fs.readFileSync(file, 'utf8'), text, 'preflight is read-only');
    }
    const absent = spawnSync('bash', [checker, path.join(dir, 'absent.md')], { encoding: 'utf8' });
    assert.equal(absent.status, 1);
    assert.match(absent.stderr, /changelog not found/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('release preflight requires translation language metadata before tagging', () => {
  const dir = fs.mkdtempSync(path.join(tmpRoot, 'release-language-preflight-'));
  try {
    const file = path.join(dir, 'CHANGELOG.md');
    const group = '**Translations** - Locale repairs.\n\n';
    for (const [notes, valid] of [
      [upcoming + group + entry, false],
      [upcoming + group + '**Languages updated:** Veps, Tigre\n\n' + entry, true],
      [upcoming + group + entry + '\n**Languages updated:** Veps\n', false],
    ]) {
      fs.writeFileSync(file, notes);
      const result = spawnSync('bash', [checker, file], { encoding: 'utf8' });
      assert.equal(result.status, valid ? 0 : 1, result.stderr);
      if (!valid) assert.match(result.stderr, /Languages updated/);
      assert.equal(fs.readFileSync(file, 'utf8'), notes);
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('release notes are checked before tools, hash repairs, version overrides or remote commands', () => {
  const source = fs.readFileSync(path.join(root, 'releases/release-all.sh'), 'utf8');
  const guard = source.indexOf('bash "$REPO_DIR/releases/check-upcoming-release.sh"');
  assert.ok(guard > 0);
  for (const later of ['ensure_tools git gh', 'bash "$(dirname "$0")/fix-changelog-hashes.sh"',
    'if [ -n "${1:-}" ]', 'git add --all', '\n  git push', 'gh workflow run']) {
    assert.ok(source.indexOf(later) > guard, `${later} must follow successful preflight`);
  }
  assert.doesNotMatch(source, /NEW="\$\{RELEASED\[0\]/);
});
