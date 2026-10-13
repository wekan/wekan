'use strict';

// v12.39: both Mac apps were skipped although their bundles were already on
// the release. The check was `gh release view … --jq '.assets[].name' | grep
// -qxF "$zip"` under `set -o pipefail`: grep -q exits at the first match while
// gh is still writing, gh gets SIGPIPE, pipefail makes the pipeline fail, and
// the job reported "has not been published yet" and skipped every step that
// would have built and attached the app - green, with two notices. The same
// shape decided the Windows EXE, the Docker image and the snap-launchpad
// bundle check. Each now reads the list whole, then matches.
// Run: node tests/releaseAssetCheckNoSigpipe.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const bash = script => spawnSync('bash', ['-c', `set -euo pipefail\n${script}`], { encoding: 'utf8' });

test('the old shape can report a present asset missing; the new one cannot', () => {
  // A writer still producing output after the match: grep -q closes the pipe.
  const old = bash('if seq 1 200000 | grep -qx 1; then echo found; else echo missing; fi');
  assert.equal(old.stdout.trim(), 'missing', 'SIGPIPE + pipefail turns a match into "missing"');
  const fixed = bash('assets="$(seq 1 200000)"\nif grep -qx 1 <<< "$assets"; then echo found; else echo missing; fi');
  assert.equal(fixed.stdout.trim(), 'found');
  const absent = bash('assets="$(seq 1 10)"\nif grep -qx 99 <<< "$assets"; then echo found; else echo missing; fi');
  assert.equal(absent.stdout.trim(), 'missing', 'an asset that is not there is still reported missing');
});

test('every release-asset check reads the list before matching', () => {
  for (const file of ['mac.yml', 'windows.yml', 'release-all.yml', 'dockerimage.yml', 'docker-publish.yml']) {
    const src = fs.readFileSync(path.join(ROOT, '.github/workflows', file), 'utf8');
    assert.match(src, /assets="\$\(gh release view [^)]*--jq '\.assets\[\]\.name'[^)]*\)"\n\s+if (?:! )?grep -qxF? "[^"]+" <<< "\$assets"; then/, file);
  }
});

test('nothing pipes gh or curl output into grep -q (negative)', () => {
  const files = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(rel);
      else if (/\.(ya?ml|sh|bash)$/.test(entry.name)) files.push(rel);
    }
  };
  walk('.github');
  walk('releases');
  const offenders = [];
  for (const file of files) {
    // Join continuation lines, so a command split with `\` is one statement.
    const lines = fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/\\\n\s*/g, ' ').split('\n');
    lines.forEach((line, i) => {
      if (/^\s*#/.test(line)) return;
      if (/\b(gh|curl)\b[^|#\n]*\|\s*grep\s+-[a-zA-Z]*q/.test(line)) offenders.push(`${file}: ${line.trim()}`);
    });
  }
  assert.deepEqual(offenders, []);
});
