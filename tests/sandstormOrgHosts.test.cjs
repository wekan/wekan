'use strict';
// Sandstorm is at sandstorm.org. v12.69's build-sandstorm stopped because the
// certificate of install.sandstorm.io had expired; install.sandstorm.org, the
// installer it serves and the dl.sandstorm.org it downloads from are current,
// and that installer configures a development server at local.sandstorm.org.
// Run: node tests/sandstormOrgHosts.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

test('every Sandstorm build installs Sandstorm from install.sandstorm.org', () => {
  const releaseAll = read('.github/workflows/release-all.yml');
  assert.match(releaseAll, /releases\/fetch\.sh" -o \/tmp\/install-sandstorm\.sh https:\/\/install\.sandstorm\.org\n/);
  for (const wf of ['.github/workflows/sandstorm.yml', '.github/workflows/sandstorm-store.yml']) {
    assert.match(read(wf), /curl https:\/\/install\.sandstorm\.org \| sudo bash -s -- -d/, wf);
  }
  assert.match(read('releases/install-sandstorm.sh'), /curl https:\/\/install\.sandstorm\.org \| bash/);
});

test('negative: no tracked file names a sandstorm.io host', () => {
  // Kept on purpose: demo.sandstorm.io has no sandstorm.org name; a released
  // CHANGELOG section is a record; fetch.sh's comment says what happened to
  // install.sandstorm.io.
  const KEPT = /(?:^|[^a-z0-9.-])demo\.sandstorm\.io\b|install\.sandstorm\.io's certificate had expired/;
  const files = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n')
    .filter(f => f && f !== 'CHANGELOG.md' && !f.startsWith('old-CHANGELOG/') && f !== 'tests/sandstormOrgHosts.test.cjs');
  const found = [];
  for (const f of files) {
    let text;
    try { text = read(f); } catch (e) { continue; }
    if (!text.includes('sandstorm.io') || text.includes('\0')) continue;
    text.split('\n').forEach((line, i) => {
      const rest = line.replace(new RegExp(KEPT.source, 'g'), '');
      if (/(?:^|[^A-Za-z0-9-])(?:[a-z0-9-]+\.)*sandstorm\.io\b/.test(rest)) found.push(`${f}:${i + 1}: ${line.trim().slice(0, 120)}`);
    });
  }
  assert.deepEqual(found, []);
});

console.log(`sandstormOrgHosts: ${passed} tests passed`);
