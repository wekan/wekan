'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const script = path.join(root, 'releases/translations/fill-translations.mjs');
const baseline = require('../releases/translations/completed-source.json');

// Source catalog at 6cae1d48b9, when the global completeness gate was added.
// New features cannot invalidate that milestone or disappear from the work list.
assert.equal(Object.keys(baseline).length, 2417);
assert.equal(baseline.accept, 'Accept');
assert.equal(baseline['blockly-DELETE_BLOCK'], undefined);
const tempRoot = path.join(root, '.tools/tmp');
fs.mkdirSync(tempRoot, { recursive: true });
const fixture = fs.mkdtempSync(path.join(tempRoot, 'completed-catalog-'));
try {
  const data = path.join(fixture, 'imports/i18n/data');
  fs.mkdirSync(data, { recursive: true });
  const english = { accept: 'Accept', 'new-feature': 'New feature' };
  const write = (code, value) => fs.writeFileSync(path.join(data, `${code}.i18n.json`), JSON.stringify(value));
  write('en', english);
  write('fi', { accept: 'Hyväksy', 'new-feature': 'New feature' });
  const run = args => spawnSync(process.execPath, [script, ...args], {
    cwd: fixture, encoding: 'utf8',
  });
  const list = scoped => {
    const result = run(['--list', 'fi', ...(scoped ? ['--completed-catalog'] : [])]);
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  };
  assert.deepEqual(list(true), {}, 'completed translations pass');
  assert.deepEqual(list(false), { 'new-feature': 'New feature' }, 'ordinary listing retains new work');
  assert.match(run(['--missing']).stdout, /1\tfi/);
  write('fi', english);
  assert.deepEqual(list(true), { accept: 'Accept' }, 'English regression is detected');
  write('fi', { 'new-feature': 'New feature' });
  assert.deepEqual(list(true), { accept: 'Accept' }, 'missing completed keys are detected');
  const pendingDir = path.join(fixture, 'releases/translations');
  fs.mkdirSync(pendingDir, { recursive: true });
  fs.writeFileSync(path.join(pendingDir, 'pending-transifex.json'), JSON.stringify({ keys: [{ key: 'accept' }] }));
  assert.match(run(['--missing']).stdout, /1\tfi/,
    'ordinary report excludes pending accept but counts the new feature');
  assert.deepEqual(list(false), english,
    'ordinary listing includes both pending and untracked work');
  assert.match(run(['--missing', '--completed-catalog']).stdout, /1\tfi/,
    'marking an old key pending cannot conceal a regression');
  assert.notEqual(run(['--apply', 'fi', '--completed-catalog']).status, 0,
    'regression scope cannot change mutation behavior');
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}
console.log('Completed translation catalog: regression detection and full backlog visibility passed');
