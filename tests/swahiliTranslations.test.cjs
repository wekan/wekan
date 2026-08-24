const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const result = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'), '--list', 'sw',
], { cwd: root, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
assert.equal(result.stdout, '{}\n');
const sw = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/sw.i18n.json'), 'utf8'));
assert.equal(sw['select-none'], 'Usichague yoyote');
assert.equal(sw['cpu-cores-suffix'], 'viini');
assert.match(sw['office-report-desc'], /IPv4.*IPv6/);
assert.match(sw['api-no-calls'], /REST API.*WITH_API=true/);
