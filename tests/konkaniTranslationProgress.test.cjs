const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'kok'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 1992);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const konkani = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/kok.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(konkani)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(konkani.accept, 'स्वीकारात');
assert.deepEqual(tokens(konkani['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(konkani['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.match(konkani['act-createBoard'], /फळो/);
assert.equal(konkani['workspace-settings'], 'कार्यस्थळ मांडावळ');
assert.deepEqual(tokens(konkani['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(konkani['set-list-width'], 'रुंदाय थारायात');
assert.equal(konkani['add-members'], 'वांगडी जोडात');
assert.equal(konkani['public-boards'], 'भौशीक फळे');
assert.deepEqual(tokens(konkani['and-n-other-card_plural']), ['__count__']);
