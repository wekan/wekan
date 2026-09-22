'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const tempRoot = path.join(root, '.tools/tmp');
fs.mkdirSync(tempRoot, { recursive: true });
const fixture = fs.mkdtempSync(path.join(tempRoot, 'pull-rollback-'));
const repo = path.join(fixture, 'repo');
const scripts = path.join(repo, 'releases/translations');
const data = path.join(repo, 'imports/i18n/data');
fs.mkdirSync(scripts, { recursive: true });
fs.mkdirSync(data, { recursive: true });
const oldValue = '{"board":"Монгол самбар"}\n';
try {
  fs.copyFileSync(path.join(root, 'releases/translations/pull-translations.sh'),
    path.join(scripts, 'pull-translations.sh'));
  fs.writeFileSync(path.join(data, 'mn.i18n.json'), oldValue);
  fs.writeFileSync(path.join(data, 'en.i18n.json'), '{"board":"Board"}\n');
  const tx = path.join(fixture, 'tx');
  fs.writeFileSync(tx, '#!/bin/sh\nprintf \'{"board":"Board"}\\n\' > imports/i18n/data/mn.i18n.json\nexit 7\n');
  fs.chmodSync(tx, 0o755);
  const result = spawnSync('sh', [path.join(scripts, 'pull-translations.sh')],
    { cwd: repo, encoding: 'utf8', env: { ...process.env, TMPDIR: tempRoot } });
  assert.equal(result.status, 7, result.stderr);
  assert.equal(fs.readFileSync(path.join(data, 'mn.i18n.json'), 'utf8'), oldValue);
  assert.match(result.stderr, /restored pre-pull locale files/);
  console.log('Failed Transifex pull restores the pre-pull local translation.');
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}
