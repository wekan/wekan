'use strict';

// Companion repositories live under .tools/ (CLAUDE.md): .tools/wekan.fi,
// .tools/charts, .tools/FerretDB and the rest. They used to be checked out in
// ../w/ beside the repository, and several scripts and tests kept that as a
// fallback - so a stale ../w/wekan.fi was read in place of a missing
// .tools/wekan.fi and failed tests/hallOfFameProblemsCoverage.test.cjs with
// markup the site no longer has. Nothing looks in ../w/ any more.
// Run: node tests/noLegacySiblingRepos.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

// ../w/x, ..\w\x, path.join(.., '..', 'w', ...) and the Python form.
const LEGACY = /\.\.[/\\]w[/\\]|['"]\.\.['"],\s*['"]w['"]/;
// Strings that only look like it: an attack path a test feeds a guard, and a
// GitHub API path whose owner is named "w".
const NOT_A_LOCATION = new Set([
  'tests/floppyBleed.test.cjs',
  'tests/optionalApis.test.cjs',
  'tests/noLegacySiblingRepos.test.cjs',
]);

function files() {
  const out = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      if (['node_modules', '_build', '.build', '.git', '.tools', 'old-CHANGELOG', 'test-results'].includes(entry.name)) continue;
      const rel = dir ? path.join(dir, entry.name) : entry.name;
      if (entry.isDirectory()) { walk(rel); continue; }
      if (/\.(sh|bat|ps1|cmd|py|mjs|cjs|js|md)$/.test(entry.name) && !['CHANGELOG.md', 'CHANGELOG-big.md'].includes(rel)) out.push(rel);
    }
  };
  for (const dir of ['releases', 'tests', 'docs', 'tools']) if (fs.existsSync(path.join(root, dir))) walk(dir);
  for (const f of fs.readdirSync(root)) if (/\.(sh|bat|md)$/.test(f) && !['CHANGELOG.md', 'CHANGELOG-big.md'].includes(f)) out.push(f);
  return out;
}

test('no script, test or document looks for a companion repository in ../w/', () => {
  // In code, a whole-line comment may say the old place is no longer used; a
  // path to it in the code itself may not. A document is checked as written.
  const codeOf = (rel, src) => (/\.md$/.test(rel) ? src
    : src.split('\n').filter(l => !/^\s*(#|\/\/|\*|REM\b|::)/i.test(l)).join('\n'));
  const offenders = files().filter(rel => !NOT_A_LOCATION.has(rel))
    .filter(rel => LEGACY.test(codeOf(rel, fs.readFileSync(path.join(root, rel), 'utf8'))));
  assert.deepStrictEqual(offenders, []);
});

test('the Hall of Fame and charts are read from .tools/', () => {
  assert.match(fs.readFileSync(path.join(root, 'tests/hallOfFameProblemsCoverage.test.cjs'), 'utf8'),
    /path\.join\(ROOT, '\.tools', 'wekan\.fi', 'hall-of-fame', 'index\.html'\)/);
  assert.match(fs.readFileSync(path.join(root, 'releases/release-charts.sh'), 'utf8'),
    /for candidate in "\$REPO_DIR\/\.tools\/charts"; do/);
});

test('negative: the pattern catches every form of the old path', () => {
  for (const s of ['../w/charts', '..\\w\\wekan.fi', "path.join(ROOT, '..', 'w', 'x')", 'os.path.join(repo, "..", "w", "charts")']) {
    assert.match(s, LEGACY, s);
  }
  for (const s of ['.tools/charts', '../wekan', '/api/compat/github/repos/w/DEV']) assert.doesNotMatch(s, LEGACY, s);
});

console.log(`\n${passed} tests passed`);
