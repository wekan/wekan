'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const tmpRoot = path.join(root, '.tools/tmp');
fs.mkdirSync(tmpRoot, { recursive: true });
const dir = fs.mkdtempSync(path.join(tmpRoot, 'release-language-summary-'));
function run(text, version = '99.99') {
  const file = path.join(dir, 'CHANGELOG.md');
  fs.writeFileSync(file, text);
  return spawnSync('bash', ['releases/release-notes.sh', version, file], {
    cwd: root, encoding: 'utf8', env: { ...process.env, TMPDIR: dir },
  });
}
try {
  const intro = '# Status\nReference to `# Upcoming WeKan ® release` is not a heading.\n\n# Upcoming WeKan ® release\n\n**In short:** Summary.\n\n';
  const translations = '**Translations** - Repairs.\n\n**Languages updated:** Galician, Esperanto, Galician\n\n<details>\n<summary>Private translation details</summary>\nand this is wrapped prose, not a section boundary.\n<details>nested details</details>\n</details>\n\n';
  const other = 'and fixes the following bugs:\n\n**Authentication** - Login.\n\n<details>\n<summary>Keep non-translation detail</summary>\nSecurity fix.\n</details>\n\nThanks to above GitHub users.\n';
  const result = run(intro + translations + other + '\n# v1.00 date WeKan ® release\nOld release.\n');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /## Translations\n\n- Esperanto\n- Galician\n/);
  assert.doesNotMatch(result.stdout, /Private translation details|wrapped prose|nested details|Reference to|Old release/);
  assert.doesNotMatch(result.stdout, /Keep non-translation detail|Security fix/);
  assert.deepEqual(result.stdout.match(/^## .+$/gm), ['## In short', '## Translations']);
  assert.doesNotMatch(result.stdout, /No security changes|No translation updates/);
  assert.match(result.stdout, /More details at ChangeLog/);
  assert.equal((result.stdout.match(/- Galician/g) || []).length, 1);
  const proseHeading = run(intro.replace('Summary.',
    'First summary line.\n**Translations** repair wording in several languages.') + translations + other);
  assert.equal(proseHeading.status, 0, proseHeading.stderr);
  assert.match(proseHeading.stdout, /## Translations\n\n- Esperanto\n- Galician/);
  assert.doesNotMatch(proseHeading.stdout, /Private translation details/);
  const missing = run(intro + translations.replace('**Languages updated:** Galician, Esperanto, Galician\n', '') + other);
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /Translations group needs/);
  const missingSummary = run(intro.replace('**In short:** Summary.\n\n', '') + other);
  assert.notEqual(missingSummary.status, 0);
  assert.match(missingSummary.stderr, /needs an \*\*In short:\*\* summary/);
  const selected = run(intro + translations + other + '\n# v2.00 2026-09-14 WeKan ® release\n\n**In short:** Version-specific summary.\n', '2.00');
  assert.equal(selected.status, 0, selected.stderr);
  assert.match(selected.stdout, /Version-specific/);
  assert.deepEqual(selected.stdout.match(/^## .+$/gm), ['## In short']);
  assert.doesNotMatch(selected.stdout, /No security changes|No translation updates|translators/);
  assert.doesNotMatch(selected.stdout, /Galician|Private translation details/);
  assert.match(selected.stdout, /CHANGELOG\.md#v200-2026-09-14-wekan--release/);
  const security = run(intro + translations + 'This release fixes the following CRITICAL SECURITY ISSUES:\n\n**Security** - Board boundaries.\n\n<details>\n<summary>Security fix retained</summary>\nand wrapped security prose.\n</details>\n\n' + other);
  assert.equal(security.status, 0, security.stderr);
  assert.match(security.stdout, /Security fix retained|wrapped security prose/);
  assert.deepEqual(security.stdout.match(/^## .+$/gm), ['## In short', '## Security', '## Translations']);
  assert.doesNotMatch(security.stdout, /Keep non-translation detail|Private translation details/);
  const securityOnly = run(intro + '**Security** - Board boundaries.\n\n<details>\n<summary>Security fix retained</summary>\nAuthorization repaired.\n</details>\n\n' + other);
  assert.equal(securityOnly.status, 0, securityOnly.stderr);
  assert.deepEqual(securityOnly.stdout.match(/^## .+$/gm), ['## In short', '## Security']);
  assert.match(securityOnly.stdout, /Authorization repaired/);
  assert.doesNotMatch(securityOnly.stdout, /No security changes|No translation updates|translators/);
  // Exercise the real notes that blocked all platform builds in v11.96.
  const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
  const newest = changelog.match(/^# v([0-9]+\.[0-9]+) /m)[1];
  const repaired = run(changelog, newest);
  assert.equal(repaired.status, 0, repaired.stderr);
  assert.match(repaired.stdout, /## In short\n\n\S/);
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/release-all.yml'), 'utf8');
  const bump = workflow.split('\n  bump:\n')[1].split(/\n  [\w-]+:\n/)[0];
  assert.ok(bump.indexOf('bash releases/release-notes.sh') < bump.indexOf('./releases/version.sh'));
  assert.match(bump, /RELEASE_VERSION: \$\{\{ inputs.new_version \}\}/);
  const prepare = workflow.split('\n  prepare:\n')[1].split(/\n  [\w-]+:\n/)[0];
  assert.ok(prepare.indexOf('bash releases/release-notes.sh') < prepare.indexOf('git tag -a'));
  console.log('releaseTranslationSummary: languages only, nested details removed, only requested sections retained, explicit metadata required, headings anchored');
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
