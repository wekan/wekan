const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root,
  'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'ml'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 2117);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const malayalam = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/ml.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(malayalam)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(malayalam.accept, 'സ്വീകരിക്കുക');
assert.match(malayalam.accept, /[\u0D00-\u0D7F]/);
assert.deepEqual(tokens(malayalam['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(malayalam['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.match(malayalam['board-members-same-org-only'], /സംഘടന/);
assert.match(malayalam['board-members-same-team-only'], /ടീമ/);
assert.deepEqual(tokens(malayalam['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.deepEqual(tokens(malayalam['act-setCustomField']),
  ['__board__', '__card__', '__customFieldValue__', '__customField__',
    '__list__', '__swimlane__']);
assert.match(malayalam['act-archivedBoard'], /ആർക്കൈവ/);
