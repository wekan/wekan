const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'am'], { cwd: root, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 0);
const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const amharic = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/am.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(/__[A-Za-z0-9]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)].map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)].map(([tag]) => tag).sort();
for (const [key, value] of Object.entries(amharic)) {
  if (value !== english[key]) assert.deepEqual(tokens(value), tokens(english[key]), key);
  assert.deepEqual(tags(value), tags(english[key]), key);
}
assert.equal(amharic.accept, 'ተቀበል');
assert.match(amharic['act-addChecklistItem'], /[\u1200-\u137f]/);
assert.match(amharic['act-addChecklistItem'], /__checklistItem__.*__checklist__.*__card__.*__list__.*__swimlane__.*__board__/);
assert.match(amharic['advanced-filter-description'], /== != <= >= && \|\| \( \).*F1 == \/Tes\.\*\/i/);
assert.match(amharic['import-board-instruction-issues'], /__sourceName__.*__endpoint__/);
assert.match(amharic['activity-set-customfield'], /'%s'.*'%s'.*%s/);
assert.match(amharic['n-n-of-n-cards-found'], /__start__.*__end__.*__total__/);
