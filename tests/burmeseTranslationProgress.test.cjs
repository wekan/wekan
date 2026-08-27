'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root,
  'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'my'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 1917);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const burmese = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/my.i18n.json'), 'utf8'));
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(burmese)) {
  assert.deepEqual(tokens(value), tokens(english[key]), key);
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(burmese.accept, 'လက်ခံရန်');
assert.match(burmese.accept, /[\u1000-\u109F]/);
assert.deepEqual(tokens(burmese['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(burmese['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(burmese['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.deepEqual(tokens(burmese['act-setCustomField']),
  ['__board__', '__card__', '__customFieldValue__', '__customField__',
    '__list__', '__swimlane__']);
assert.match(burmese['board-members-same-org-only'], /အဖွဲ့အစည်း/);
assert.match(burmese['board-members-same-team-only'], /အဖွဲ့/);
assert.deepEqual(tokens(burmese['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(burmese['activity-imported']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(burmese['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(burmese['allboards.workspaces'], 'လုပ်ငန်းနေရာများ');
assert.match(burmese['allboards.edit-workspace-icon'], /markdown/);
assert.deepEqual(tokens(burmese['activity-dueDate']), ['%s', '%s']);
assert.match(burmese['list-width-error-message'], /270/);
assert.match(burmese['set-list-width-value'], /ပစ်ဇယ်/);
assert.match(burmese['set-swimlane-height-value'], /ပစ်ဇယ်/);
assert.equal(burmese['add-checklist'], 'စစ်ဆေးစာရင်း ထည့်ရန်');
assert.deepEqual(tokens(burmese['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(burmese['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(burmese['avatar-too-big']), ['__size__']);
assert.match(burmese['board-background-image-url'], /URL/);
assert.deepEqual(tokens(burmese['board-nb-stars']), ['%s']);
assert.deepEqual(tags(burmese['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tags(burmese['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  burmese['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(burmese['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(burmese['card-comments-title']), ['%s']);
assert.equal(burmese['card-edit-custom-fields'],
  'စိတ်ကြိုက်အကွက်များ ပြင်ရန်');

console.log('Burmese translation progress checks passed.');
