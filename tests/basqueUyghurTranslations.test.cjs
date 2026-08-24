const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const node = process.execPath;
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');

for (const language of ['eu', 'ug']) {
  const result = spawnSync(node, [fillScript, '--list', language], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{}\n');
}

const basque = JSON.parse(
  fs.readFileSync(path.join(root, 'imports/i18n/data/eu.i18n.json'), 'utf8'),
);
const uyghur = JSON.parse(
  fs.readFileSync(path.join(root, 'imports/i18n/data/ug.i18n.json'), 'utf8'),
);

assert.equal(basque['select-none'], 'Ez hautatu bat ere');
assert.match(basque['office-report-desc'], /IPv4.*IPv6/);
assert.match(basque['api-no-calls'], /REST API.*WITH_API=true/);

assert.equal(uyghur['activity-on'], '%s دا');
assert.match(uyghur['office-report-desc'], /IPv4.*IPv6/);
assert.match(uyghur['api-no-calls'], /REST API.*WITH_API=true/);
assert.match(
  uyghur['globalSearch-instructions-operator-number'],
  /__operator_number__:<number>.*<number>/,
);
assert.match(uyghur['select-none'], /[\u0600-\u06ff]/);
